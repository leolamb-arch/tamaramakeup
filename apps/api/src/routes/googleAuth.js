import {
  isGoogleConfigured,
  buildAuthUrl,
} from "../utils/googleCalendar.js";
import { respondNotConfigured } from "../utils/integrationConfig.js";

export default async (req, res) => {
  if (!isGoogleConfigured()) {
    return respondNotConfigured(res, {
      integration: "Google Calendar",
      envKeys: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    });
  }
  const state = (req.query.state || "").toString();
  res.redirect(buildAuthUrl(req, state));
};
