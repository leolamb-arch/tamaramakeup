import {
  isGoogleConfigured,
  isGoogleConnected,
  createBooking,
} from "../utils/googleCalendar.js";
import { respondNotConfigured } from "../utils/integrationConfig.js";

export default async (req, res) => {
  const b = req.body || {};
  if (!b.date || !b.time || !b.service || !b.clientName) {
    return res
      .status(422)
      .json({ error: "Faltan datos de la reserva (date, time, service, clientName)." });
  }

  const configured = isGoogleConfigured();
  const connected = configured ? await isGoogleConnected() : false;

  // Si Google no está conectado, se reporta como estado de configuración
  // (no como error 500) para que el flujo de reserva siga funcionando.
  if (!connected) {
    return respondNotConfigured(res, {
      integration: "Google Calendar",
      envKeys: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    });
  }

  const result = await createBooking(b);
  res.json({ ok: true, connected: true, ...result });
};
