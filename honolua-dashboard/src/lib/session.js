// lib/session.js
import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET;
const COOKIE_NAME = "honolua_session";
const isSecureCookie =
  process.env.NODE_ENV === "production" &&
  process.env.PUBLIC_URL?.startsWith("https://");

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

  // timing-safe compare — buffers must be equal length or timingSafeEqual throws
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const session = JSON.parse(Buffer.from(data, "base64url").toString());
    if (!session || typeof session !== "object" || Object.keys(session).length === 0) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

// For use in middleware / Route Handlers (NextRequest/NextResponse)
export function getSession(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  return verify(token);
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

export { verify, sign, COOKIE_NAME };