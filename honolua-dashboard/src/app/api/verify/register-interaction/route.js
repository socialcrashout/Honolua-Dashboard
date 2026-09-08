// api/verify/register-interaction/route.js
import { NextResponse } from "next/server";
import { getSession, setSessionCookie } from "@/lib/session.js";

export async function POST(request) {
  const { token, app_id } = await request.json().catch(() => ({}));
  if (!token || !app_id) {
    return NextResponse.json({ error: "Missing token or app_id" }, { status: 400 });
  }

  const session = getSession(request);
  session.interactionToken = token;
  session.interactionAppId = app_id;

  const response = NextResponse.json({ saved: true });
  setSessionCookie(response, session);
  return response;
}
