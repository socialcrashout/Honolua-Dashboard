// api/verify/register-interaction.js
import { getSession, setSessionCookie } from "../../lib/session.js";

export default async function handler(req, res) {
  const { token, app_id } = req.body || {};
  if (!token || !app_id) {
    return res.status(400).json({ error: "Missing token or app_id" });
  }

  const session = getSession(req);
  session.interactionToken = token;
  session.interactionAppId = app_id;
  setSessionCookie(res, session);

  res.status(200).json({ saved: true });
}