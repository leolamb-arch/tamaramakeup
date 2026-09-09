import {
  isGoogleConfigured,
  isGoogleConnected,
  getAvailableSlots,
} from "../utils/googleCalendar.js";

export default async (req, res) => {
  const date = req.query.date;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res
      .status(422)
      .json({ error: "Parámetro date (YYYY-MM-DD) requerido." });
  }
  const configuredSlots = (req.query.slots || "")
    .toString()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const configured = isGoogleConfigured();
  const connected = configured ? await isGoogleConnected() : false;

  if (!connected) {
    // Sin conexión: devuelve los bloques configurados (fallback del formulario).
    return res.json({
      connected: false,
      configured,
      slots: configuredSlots,
    });
  }

  const slots = await getAvailableSlots(date, configuredSlots, 2);
  res.json({ connected: true, configured, slots });
};
