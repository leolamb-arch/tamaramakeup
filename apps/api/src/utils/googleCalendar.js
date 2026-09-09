// Utilidad de servidor para Google Calendar.
// Maneja OAuth (intercambio/renovación de tokens), consulta free/busy
// (solo franjas ocupadas, sin exponer títulos ni datos privados) y
// crea eventos únicamente tras confirmar el pago del anticipo.
// Las credenciales viven en apps/api/.env, nunca en el navegador.

import pocketbaseClient from "./pocketbaseClient.js";

const TOKENS_COLLECTION = "google_tokens";
const BOOKINGS_COLLECTION = "bookings";
const TIME_ZONE = "America/Mexico_City";
// Ciudad de México abolió el horario de verano en 2023 → UTC-6 fijo.
const TZ_OFFSET = "-06:00";

export function isGoogleConfigured() {
  return (
    String(process.env.GOOGLE_CLIENT_ID ?? "").trim() !== "" &&
    String(process.env.GOOGLE_CLIENT_SECRET ?? "").trim() !== ""
  );
}

// URI de redirección de OAuth: la configurable por env, o derivada del host público.
export function getRedirectUri(req) {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  const proto = (req.headers["x-forwarded-proto"] || req.protocol || "https")
    .toString()
    .split(",")[0];
  const host = req.headers["x-forwarded-host"] || req.get("host");
  return `${proto}://${host}/hcgi/api/google/callback`;
}

export function buildAuthUrl(req, state = "") {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: getRedirectUri(req),
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.events",
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function getTokensRecord() {
  const list = await pocketbaseClient
    .collection(TOKENS_COLLECTION)
    .getFullList({ sort: "-created" });
  return list[0] || null;
}

export async function isGoogleConnected() {
  if (!isGoogleConfigured()) return false;
  const rec = await getTokensRecord();
  return !!rec && !!rec.refresh_token;
}

async function saveTokens(tokenData) {
  const rec = await getTokensRecord();
  const payload = {
    access_token: tokenData.access_token || "",
    refresh_token: tokenData.refresh_token || (rec ? rec.refresh_token : ""),
    expiry: String(tokenData.expiry_date || (rec ? rec.expiry : "")),
    scope: tokenData.scope || (rec ? rec.scope : ""),
    account_email: tokenData.account_email || (rec ? rec.account_email : ""),
  };
  if (rec) {
    await pocketbaseClient.collection(TOKENS_COLLECTION).update(rec.id, payload);
  } else {
    await pocketbaseClient.collection(TOKENS_COLLECTION).create(payload);
  }
}

export async function exchangeCodeForTokens(code, req) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: getRedirectUri(req),
    grant_type: "authorization_code",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `google token exchange failed: ${res.status} ${res.statusText} ${text}`,
    );
  }
  const data = await res.json();
  // Obtener el correo de la cuenta vinculada para mostrarlo en el panel
  // (sin exponer tokens). Solo guardamos el email, nunca claves.
  let accountEmail = "";
  try {
    const ui = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    if (ui.ok) {
      const u = await ui.json();
      accountEmail = u.email || "";
    }
  } catch (_) {}
  await saveTokens({ ...data, account_email: accountEmail });
  return data;
}

async function getValidAccessToken() {
  const rec = await getTokensRecord();
  if (!rec || !rec.refresh_token) {
    throw new Error("Google Calendar no está conectado.");
  }
  const now = Date.now();
  const expiry = Number(rec.expiry) || 0;
  if (rec.access_token && expiry > now + 60000) {
    return rec.access_token;
  }
  const body = new URLSearchParams({
    refresh_token: rec.refresh_token,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `google token refresh failed: ${res.status} ${res.statusText} ${text}`,
    );
  }
  const data = await res.json();
  await saveTokens(data);
  return data.access_token;
}

// Devuelve las franjas ocupadas del calendario principal (sin títulos ni datos).
export async function getBusyPeriods(date) {
  const accessToken = await getValidAccessToken();
  const timeMin = `${date}T00:00:00${TZ_OFFSET}`;
  const timeMax = `${date}T23:59:59${TZ_OFFSET}`;
  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      timeZone: TIME_ZONE,
      items: [{ id: "primary" }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `google freebusy failed: ${res.status} ${res.statusText} ${text}`,
    );
  }
  const data = await res.json();
  const cal = data.calendars && data.calendars.primary;
  if (!cal) return [];
  return (cal.busy || []).map((b) => ({ start: b.start, end: b.end }));
}

// Convierte un slot "HH:mm" en milisegundos (epoch) en zona Mexico City.
function slotToMs(date, hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const iso = `${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00${TZ_OFFSET}`;
  return Date.parse(iso);
}

// Filtra los bloques configurados dejando solo los libres.
export async function getAvailableSlots(date, configuredSlots, durationHours = 2) {
  const busy = await getBusyPeriods(date);
  const busyMs = busy.map((b) => ({
    start: Date.parse(b.start),
    end: Date.parse(b.end),
  }));
  const durMs = durationHours * 3600 * 1000;
  return configuredSlots.filter((slot) => {
    const start = slotToMs(date, slot);
    const end = start + durMs;
    return !busyMs.some((b) => start < b.end && end > b.start);
  });
}

// Crea el evento en Google Calendar.
export async function createCalendarEvent(details) {
  const accessToken = await getValidAccessToken();
  const {
    date,
    time,
    durationHours = 2,
    service,
    clientName,
    phone,
    email,
    location,
    eventType,
    people,
    deposit,
    total,
    paymentRef,
  } = details;
  const [h, m] = time.split(":").map(Number);
  const startIso = `${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
  const endH = h + durationHours;
  const endIso = `${date}T${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
  const body = {
    summary: `Reserva — ${service} — ${clientName}`,
    location: location || "",
    description: [
      `Cliente: ${clientName}`,
      `Servicio: ${service}`,
      eventType ? `Tipo de evento: ${eventType}` : "",
      `Fecha: ${date} · Hora: ${time}`,
      people ? `Personas: ${people}` : "",
      phone ? `Teléfono: ${phone}` : "",
      email ? `Correo: ${email}` : "",
      `Anticipo pagado: ${deposit}`,
      `Total: ${total}`,
      paymentRef ? `Referencia de pago: ${paymentRef}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    start: { dateTime: startIso, timeZone: TIME_ZONE },
    end: { dateTime: endIso, timeZone: TIME_ZONE },
  };
  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `google create event failed: ${res.status} ${res.statusText} ${text}`,
    );
  }
  const data = await res.json();
  return data.id;
}

// Crea la reserva: re-verifica conflictos, evita duplicados y crea el evento.
export async function createBooking(details) {
  const { date, time, durationHours = 2 } = details;

  // 1) Re-verifica conflictos en el calendario (free/busy).
  const busy = await getBusyPeriods(date);
  const startMs = slotToMs(date, time);
  const endMs = startMs + durationHours * 3600 * 1000;
  const conflict = busy.some(
    (b) => startMs < Date.parse(b.end) && endMs > Date.parse(b.start),
  );
  if (conflict) {
    throw new Error(
      "Ese horario acaba de ocuparse en el calendario. Elige otra hora.",
    );
  }

  // 2) Evita reservas duplicadas en la base local.
  const existing = await pocketbaseClient
    .collection(BOOKINGS_COLLECTION)
    .getList(1, 1, {
      filter: `event_date = "${date}" && event_time = "${time}" && status = "confirmed"`,
    });
  if (existing.totalItems > 0) {
    throw new Error(
      "Ya existe una reserva confirmada para esa fecha y hora.",
    );
  }

  // 3) Crea el evento en Google Calendar.
  const eventId = await createCalendarEvent(details);

  // 4) Registra la reserva confirmada.
  const rec = await pocketbaseClient.collection(BOOKINGS_COLLECTION).create({
    client_name: details.clientName,
    phone: details.phone,
    email: details.email || "",
    service: details.service,
    event_type: details.eventType || "",
    event_date: date,
    event_time: time,
    duration_hours: durationHours,
    location: details.location || "",
    people: details.people || 0,
    deposit: details.deposit || 0,
    total: details.total || 0,
    payment_ref: details.paymentRef || "",
    google_event_id: eventId,
    status: "confirmed",
  });

  return { eventId, bookingId: rec.id };
}

// Devuelve el correo de la cuenta vinculada (o "" si no hay). Sin tokens.
export async function getConnectedAccount() {
  if (!isGoogleConfigured()) return "";
  const rec = await getTokensRecord();
  if (!rec || !rec.refresh_token) return "";
  return rec.account_email || "";
}

// Desvincula la cuenta: elimina el registro de tokens del backend.
export async function disconnectGoogle() {
  const rec = await getTokensRecord();
  if (rec) {
    await pocketbaseClient.collection(TOKENS_COLLECTION).delete(rec.id);
  }
}
