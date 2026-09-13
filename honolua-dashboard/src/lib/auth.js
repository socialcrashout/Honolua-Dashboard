import { cookies } from "next/headers"
import crypto from "crypto"

const SECRET = process.env.SESSION_SECRET
const COOKIE_NAME = "honolua_session"

function requireSecret() {
  if (!SECRET) {
    throw new Error(
      "SESSION_SECRET is not set — check your deployment's environment variables."
    )
  }
}

function verify(token) {
  if (!token) return null
  requireSecret()
  const [data, sig] = token.split(".")
  if (!data || !sig) return null
  const expected = crypto.createHmac("sha256", SECRET).update(data).digest("base64url")
  if (sig !== expected) return null
  try {
    return JSON.parse(Buffer.from(data, "base64url").toString())
  } catch {
    return null
  }
}

export async function getUserFromSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const session = verify(token)
  if (!session || Object.keys(session).length === 0) return null
  return session
}