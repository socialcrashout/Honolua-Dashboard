// api/verify/status/route.js
import { NextResponse } from "next/server";
import { getSession, setSessionCookie } from "@/lib/session.js";

export async function GET(request) {
  const session = getSession(request);
  const forceRefresh = request.nextUrl.searchParams.get("refresh") === "true";

  if (!session.discordId) {
    return NextResponse.json({
      discordConnected: false,
      robloxLinked: false,
    });
  }

  if (session.robloxLinked === undefined || (forceRefresh && !session.robloxLinked)) {
    try {
      const guildId = process.env.DISCORD_GUILD_ID;
      const bloxlinkRes = await fetch(
        `https://api.blox.link/v4/public/guilds/${guildId}/discord-to-roblox/${session.discordId}`,
        { headers: { Authorization: process.env.BLOXLINK_API_KEY } }
      );

      if (bloxlinkRes.status === 404) {
        session.robloxLinked = false;
      } else if (bloxlinkRes.ok) {
        const data = await bloxlinkRes.json();
        const robloxId = data.robloxID;

        const [userRes, avatarRes] = await Promise.all([
          fetch(`https://users.roblox.com/v1/users/${robloxId}`),
          fetch(
            `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=150x150&format=Png`
          ),
        ]);
        const userData = await userRes.json();
        const avatarData = await avatarRes.json();

        session.robloxLinked = true;
        session.robloxId = robloxId;
        session.robloxUsername = userData.name;
        session.robloxDisplayName = userData.displayName;
        session.robloxAvatarUrl = avatarData.data?.[0]?.imageUrl || null;
      } else {
        const text = await bloxlinkRes.text().catch(() => "");
        console.error("Bloxlink lookup failed:", bloxlinkRes.status, text);
        session.robloxLinked = false;
      }
    } catch (err) {
      console.error("Bloxlink lookup error:", err);
      session.robloxLinked = false;
    }
  }

  const response = NextResponse.json({
    discordConnected: true,
    discordId: session.discordId,
    discordUsername: session.discordUsername,
    discordAvatar: session.discordAvatar,
    robloxLinked: !!session.robloxLinked,
    robloxId: session.robloxId || null,
    robloxUsername: session.robloxUsername || null,
    robloxDisplayName: session.robloxDisplayName || null,
    robloxAvatarUrl: session.robloxAvatarUrl || null,
  });

  setSessionCookie(response, session);

  return response;
}