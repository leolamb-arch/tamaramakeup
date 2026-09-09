import {
  isGoogleConfigured,
  exchangeCodeForTokens,
} from "../utils/googleCalendar.js";

// Ruta de retorno de OAuth. Google redirige aquí con ?code=... (éxito) o
// ?error=... (cancelación). Intercambia el código por tokens de forma
// segura en el backend y devuelve a la usuaria al panel /admin con un
// parámetro de estado que la UI interpreta como éxito, cancelación o error.
export default async (req, res) => {
  if (!isGoogleConfigured()) {
    return res.redirect("/admin?google=error");
  }

  const error = req.query.error;
  if (error) {
    // La usuaria canceló la autorización en la pantalla de Google.
    return res.redirect("/admin?google=cancelled");
  }

  const code = req.query.code;
  if (!code) {
    return res.redirect("/admin?google=error");
  }

  try {
    await exchangeCodeForTokens(code, req);
    res.redirect("/admin?google=success");
  } catch (e) {
    res.redirect("/admin?google=error");
  }
};
