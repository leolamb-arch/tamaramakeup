import { getScheduleConfig } from "../utils/schedule.js";

// Configuración pública de agenda (sin datos privados): días activos,
// fechas bloqueadas, bloques y duración. La usa el calendario público
// para saber qué fechas deshabilitar.
export default async (req, res) => {
  try {
    const config = await getScheduleConfig();
    res.json(config);
  } catch (e) {
    res
      .status(500)
      .json({ error: "No se pudo cargar la configuración de agenda." });
  }
};
