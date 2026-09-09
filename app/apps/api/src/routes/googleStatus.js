import {
  isGoogleConfigured,
  isGoogleConnected,
  getConnectedAccount,
} from "../utils/googleCalendar.js";

export default async (req, res) => {
  const configured = isGoogleConfigured();
  const connected = configured ? await isGoogleConnected() : false;
  const account = connected ? await getConnectedAccount() : "";
  res.json({ configured, connected, account });
};
