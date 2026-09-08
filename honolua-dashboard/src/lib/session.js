// lib/session.js
import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET;

function requireSecret() {
  if (!SECRET) {
    throw new Error(
      "SESSION_SECRET is not set — check your deployment's environment variables."
    );
  }
}

function sign(payload) {
  requireSecret();
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

function verify(token) {
  if (!token) return null;
  requireSecret();
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  if (sig !== expected) return null;
  try {
    return JSON.parse(Buffer.from(data, "base64url").toString());
  } catch {
    return null;
  }
}

export function getSession(req) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/(?:^|;\s*)honolua_session=([^;]+)/);
  return verify(match ? decodeURIComponent(match[1]) : null) || {};
}

export function setSessionCookie(res, session) {
  const token = sign(session);
  res.setHeader(
    "Set-Cookie",
    `honolua_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=1800`
  );
}