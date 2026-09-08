// api/auth/discord/route.js
import crypto from "crypto";
import { NextResponse } from "next/server";

const isSecureCookie = process.env.NODE_ENV === "production" && process.env.PUBLIC_URL?.startsWith("https://");

export async function GET(request) {
  const flow = request.nextUrl.searchParams.get("flow") === "workspace" ? "workspace" : "server";
  const random = crypto.randomBytes(16).toString("hex");
  const state = `${random}.${flow}`;

  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: `${process.env.PUBLIC_URL}/api/auth/discord/callback`,
    response_type: "code",
    scope: "identify",
    state,
  });

  const response = NextResponse.redirect(
    `https://discord.com/oauth2/authorize?${params.toString()}`
  );

  response.cookies.set("discord_oauth_state", state, {
    path: "/",
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: "lax",
    maxAge: 600,
  });

  return response;
}
