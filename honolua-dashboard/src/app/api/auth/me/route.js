import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET(request) {
  const session = getSession(request);

  if (!session?.discordId) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let discordUsername = session.discordUsername || "";
  let avatarUrl = session.discordAvatar || null;

  // Pull the member's *current* Discord profile via the bot token, so the
  // avatar/username reflect whatever they've set right now — not whatever
  // was cached in the session at login time.
  const guildId = process.env.DISCORD_GUILD_ID;
  if (guildId && process.env.DISCORD_BOT_TOKEN) {
    try {
      const res = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${session.discordId}`,
        { headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` } }
      );

      if (res.ok) {
        const member = await res.json();
        const user = member?.user;
        if (user) {
          discordUsername = user.username || discordUsername;
          avatarUrl = user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : avatarUrl;
        }
      } else {
        console.error("auth/me: guild member lookup failed", res.status);
      }
    } catch (err) {
      // Non-fatal — fall back to whatever was cached in the session.
      console.error("auth/me: guild member lookup error:", err);
    }
  }

  return NextResponse.json({
    ok: true,
    user: {
      discordId: session.discordId,
      username: discordUsername,
      avatarUrl,
      robloxUsername: session.robloxUsername || null,
      // `robloxRank` is the human-friendly role name; `robloxRankId` is
      // the numeric group rank used for gating sections in the sidebar.
      robloxRank: session.workspaceRoleName || null,
      robloxRankId: typeof session.workspaceRank === "number" ? session.workspaceRank : null,
      robloxAvatarUrl: session.robloxAvatarUrl || null,
      staffRole: session.staffRole || null, // not populated yet — see note
    },
  });
}