import {
  getAvailableSlotsForDate,
  weekdayOf,
} from "../utils/schedule.js";

// Disponibilidad pública para una fecha (YYYY-MM-DD). Devuelve solo las
// franjas libres en zona horaria America/Mexico_City.
export default async (req, res) => {
  const date = req.query.date;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res
      .status(422)
      .json({ error: "Parámetro date (YYYY-MM-DD) requerido." });
  }
  try {
    const { config, slots } = await getAvailableSlotsForDate(date);
    res.json({
      date,
      active_day: (config.active_days || []).includes(weekdayOf(date)),
      blocked: (config.blocked_dates || []).includes(date),
      slots,
    });
  } catch (e) {
    res.status(500).json({ error: "No se pudo consultar la disponibilidad." });
  }
};
