// api/auth/discord/callback/route.js
import { NextResponse } from "next/server";
import { getSession, setSessionCookie } from "@/lib/session.js";

async function fetchGuildJoinedTimestamp(discordId) {
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!guildId || !process.env.DISCORD_BOT_TOKEN) {
    console.error("Missing DISCORD_GUILD_ID or DISCORD_BOT_TOKEN — can't fetch join date");
    return null;
  }

  try {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`,
      { headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` } }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Guild member lookup failed:", res.status, text);
      return null;
    }

    const member = await res.json();
    if (!member?.joined_at) return null;

    return Math.floor(new Date(member.joined_at).getTime() / 1000);
  } catch (err) {
    console.error("Guild member lookup error (non-fatal):", err);
    return null;
  }
}

export async function GET(request) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const cookieState = request.cookies.get("discord_oauth_state")?.value;

  // Which page started this login — falls back to "server" if the state
  // is missing/malformed, so a bad state still fails safely below.
  const flow = state?.split(".")[1] === "workspace" ? "workspace" : "server";
  const redirectBase = flow === "workspace" ? "/workspace-verify" : "/verify";

  if (!code || !state || state !== cookieState) {
    return NextResponse.redirect(
      new URL(`${redirectBase}?error=discord_state_mismatch`, request.url)
    );
  }

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    client_secret: process.env.DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: `${process.env.PUBLIC_URL}`,
  }),
});
if (!tokenRes.ok) {
  const errBody = await tokenRes.text().catch(() => "");
  throw new Error(`Discord token exchange failed: ${tokenRes.status} ${errBody}`);
}
    const tokenData = await tokenRes.json();

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userRes.ok) throw new Error("Failed to fetch Discord user");
    const discordUser = await userRes.json();

    const joinedTimestamp = await fetchGuildJoinedTimestamp(discordUser.id);

    const session = getSession(request);
    session.discordId = discordUser.id;
    session.discordUsername = discordUser.username;
    session.discordAvatar = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : null;
    session.joinedTimestamp = joinedTimestamp;

    const response = NextResponse.redirect(
      new URL(`${redirectBase}?connected=discord`, request.url)
    );
    setSessionCookie(response, session);
    return response;
  } catch (err) {
  console.error("Discord OAuth error:", err);
  return NextResponse.redirect(
    new URL(`${redirectBase}?error=discord_failed&debug=${encodeURIComponent(err.message)}`, request.url)
  );
}
}
