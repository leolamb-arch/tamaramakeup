// Utilidad de servidor para la administración de agenda.
// Genera las franjas horarias disponibles a partir de la configuración
// que la administradora guarda en PocketBase (colección `schedule_config`),
// excluye las citas ya confirmadas (colección `bookings`) y, si Google
// Calendar está conectado, también las franjas ocupadas del calendario de
// trabajo. Todo en zona horaria America/Mexico_City (UTC-6 fijo).

import pocketbaseClient from "./pocketbaseClient.js";
import {
  isGoogleConfigured,
  isGoogleConnected,
  getBusyPeriods,
  createCalendarEvent,
} from "./googleCalendar.js";

const CONFIG_COLLECTION = "schedule_config";
const BOOKINGS_COLLECTION = "bookings";
const TZ_OFFSET_MS = 6 * 60 * 60 * 1000; // Mexico City = UTC-6 fijo

const DEFAULT_CONFIG = {
  active_days: [1, 2, 3, 4, 5, 6],
  time_blocks: [{ start: "09:00", end: "19:00" }],
  appointment_duration: 60,
  breaks: [],
  blocked_dates: [],
};

function parseJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed == null ? fallback : parsed;
    } catch (_) {
      return fallback;
    }
  }
  return value;
}

export async function getScheduleConfig() {
  try {
    const list = await pocketbaseClient
      .collection(CONFIG_COLLECTION)
      .getFullList({ sort: "-created" });
    const rec = list[0];
    if (!rec) return { ...DEFAULT_CONFIG };
    return {
      active_days: parseJson(rec.active_days, DEFAULT_CONFIG.active_days),
      time_blocks: parseJson(rec.time_blocks, DEFAULT_CONFIG.time_blocks),
      appointment_duration:
        Number(rec.appointment_duration) || DEFAULT_CONFIG.appointment_duration,
      breaks: parseJson(rec.breaks, []),
      blocked_dates: parseJson(rec.blocked_dates, []),
      blocked_slots: parseJson(rec.blocked_slots, []),
    };
  } catch (_) {
    return { ...DEFAULT_CONFIG, blocked_slots: [] };
  }
}

// Día de la semana (0=domingo ... 6=sábado) estable, sin desfase de zona.
export function weekdayOf(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay();
}

function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Convierte una marca ISO (con offset) a minutos desde medianoche en CDMX.
function isoToMinMex(iso) {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  const local = new Date(ms + TZ_OFFSET_MS);
  return local.getUTCHours() * 60 + local.getUTCMinutes();
}

function slotToMs(date, hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  const iso = `${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00-06:00`;
  return Date.parse(iso);
}

// Genera las franjas candidatas para una fecha según la configuración.
// Devuelve un array de { start, end, startMin, endMin }.
export function generateSlots(config, dateStr) {
  const cfg = config || DEFAULT_CONFIG;
  const weekday = weekdayOf(dateStr);
  if (!(cfg.active_days || []).includes(weekday)) return [];
  if ((cfg.blocked_dates || []).includes(dateStr)) return [];

  const dur = Number(cfg.appointment_duration) || 60;
  const breaks = (cfg.breaks || []).map((b) => ({
    start: toMinutes(b.start),
    end: toMinutes(b.end),
  }));

  const slots = [];
  for (const block of cfg.time_blocks || []) {
    const blockStart = toMinutes(block.start);
    const blockEnd = toMinutes(block.end);
    let cur = blockStart;
    while (cur + dur <= blockEnd) {
      const startMin = cur;
      const endMin = cur + dur;
      const overlapsBreak = breaks.some(
        (b) => startMin < b.end && endMin > b.start,
      );
      if (!overlapsBreak) {
        slots.push({
          start: toHHMM(startMin),
          end: toHHMM(endMin),
          startMin,
          endMin,
        });
      }
      cur += dur;
    }
  }
  return slots;
}

// Devuelve { config, slots } para una fecha, excluyendo citas confirmadas
// y (si Google está conectado) franjas ocupadas del calendario de trabajo.
export async function getAvailableSlotsForDate(date) {
  const config = await getScheduleConfig();
  const candidates = generateSlots(config, date);
  if (candidates.length === 0) return { config, slots: [] };

  // Horarios individuales bloqueados por la administradora para esta fecha.
  const blockedTimes = (config.blocked_slots || [])
    .filter((b) => b && b.date === date)
    .map((b) => b.time);

  // Citas confirmadas en la base local.
  let bookedRanges = [];
  try {
    const bookings = await pocketbaseClient
      .collection(BOOKINGS_COLLECTION)
      .getFullList({
        filter: `event_date = "${date}" && status = "confirmed"`,
      });
    bookedRanges = bookings.map((b) => ({
      start: toMinutes(b.event_time),
      end: toMinutes(b.event_time) + (Number(b.duration_hours) || 2) * 60,
    }));
  } catch (_) {
    /* si no hay bookings, continúa */
  }

  let result = candidates.filter((s) => !blockedTimes.includes(s.start));
  result = result.filter(
    (s) => !bookedRanges.some((b) => s.startMin < b.end && s.endMin > b.start),
  );

  // Franjas ocupadas en Google Calendar (si está conectado).
  if (isGoogleConfigured() && (await isGoogleConnected())) {
    try {
      const busy = await getBusyPeriods(date);
      const busyRanges = busy
        .map((b) => ({ start: isoToMinMex(b.start), end: isoToMinMex(b.end) }))
        .filter((r) => r.start != null && r.end != null);
      result = result.filter(
        (s) => !busyRanges.some((b) => s.startMin < b.end && s.endMin > b.start),
      );
    } catch (_) {
      /* si Google falla, se devuelven las franjas locales */
    }
  }

  return { config, slots: result.map((s) => s.start) };
}

// Crea una reserva: re-verifica disponibilidad, evita duplicados y crea
// el evento en Google Calendar si está conectado. Siempre guarda el
// registro en la colección `bookings`.
export async function createScheduleBooking(details) {
  const {
    date,
    time,
    durationHours = 2,
    service,
    clientName,
    phone,
    email,
    location,
    locationType,
    eventType,
    people,
    deposit,
    total,
    paymentRef,
    notes,
  } = details;

  if (!date || !time) {
    throw new Error("Faltan la fecha o la hora de la reserva.");
  }

  const config = await getScheduleConfig();
  const slots = generateSlots(config, date);
  const match = slots.find((s) => s.start === time);
  if (!match) {
    throw new Error(
      "Ese horario ya no está disponible según la agenda. Elige otro.",
    );
  }

  // Re-verifica que la hora no esté bloqueada individualmente por la admin.
  const blockedTimes = (config.blocked_slots || [])
    .filter((b) => b && b.date === date)
    .map((b) => b.time);
  if (blockedTimes.includes(time)) {
    throw new Error(
      "Ese horario está bloqueado por la administradora. Elige otro.",
    );
  }

  // Evita duplicados en la base local.
  const existing = await pocketbaseClient
    .collection(BOOKINGS_COLLECTION)
    .getList(1, 1, {
      filter: `event_date = "${date}" && event_time = "${time}" && status = "confirmed"`,
    });
  if (existing.totalItems > 0) {
    throw new Error("Ya existe una reserva confirmada para esa fecha y hora.");
  }

  // Google Calendar (opcional): verifica conflictos y crea el evento.
  let eventId = "";
  if (isGoogleConfigured() && (await isGoogleConnected())) {
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
    eventId = await createCalendarEvent(details);
  }

  const rec = await pocketbaseClient.collection(BOOKINGS_COLLECTION).create({
    client_name: clientName,
    phone: phone || "",
    email: email || "",
    service: service || "",
    event_type: eventType || "",
    event_date: date,
    event_time: time,
    duration_hours: durationHours,
    location: location || "",
    location_type: locationType || "",
    people: people || 0,
    deposit: deposit || 0,
    total: total || 0,
    payment_ref: paymentRef || "",
    google_event_id: eventId,
    status: "confirmed",
    notes: notes || "",
    deposit_status: paymentRef ? "paid" : "pending",
    exported_google: !!eventId,
    exported_apple: false,
  });

  return { bookingId: rec.id, eventId };
}
