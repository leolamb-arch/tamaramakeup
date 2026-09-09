import { createScheduleBooking } from "../utils/schedule.js";

// Crea una reserva confirmada tras el pago del anticipo. Re-verifica
// disponibilidad y evita duplicados. Público (lo llama el formulario de
// cotización); la autorización se controla con la verificación de agenda.
export default async (req, res) => {
  const b = req.body || {};
  if (!b.date || !b.time || !b.service || !b.clientName) {
    return res
      .status(422)
      .json({ error: "Faltan datos de la reserva (date, time, service, clientName)." });
  }
  try {
    const result = await createScheduleBooking(b);
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(409).json({ error: e.message || "No se pudo crear la reserva." });
  }
};
