import {
  isGoogleConfigured,
  isGoogleConnected,
  disconnectGoogle,
} from "../utils/googleCalendar.js";
import { respondNotConfigured } from "../utils/integrationConfig.js";

// Desvincula la cuenta de Google Calendar: elimina los tokens almacenados
// en el backend. No expone ni devuelve tokens. Tras esto, la consulta de
// disponibilidad vuelve al fallback de bloques configurados.
export default async (req, res) => {
  if (!isGoogleConfigured()) {
    return respondNotConfigured(res, {
      integration: "Google Calendar",
      envKeys: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    });
  }
  const wasConnected = await isGoogleConnected();
  if (wasConnected) {
    await disconnectGoogle();
  }
  res.json({ disconnected: true, wasConnected });
};
