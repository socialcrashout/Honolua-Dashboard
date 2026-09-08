// lib/session.js
import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET;
const COOKIE_NAME = "honolua_session";
const isSecureCookie = process.env.NODE_ENV === "production" && process.env.PUBLIC_URL?.startsWith("https://");

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

export function getSession(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  return verify(token) || {};
}

export function setSessionCookie(response, session) {
  const token = sign(session);
  response.cookies.set(COOKIE_NAME, token, {
    path: "/",
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: "lax",
    maxAge: 1800,
  });
}
