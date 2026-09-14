// api/workspace/status/route.js
import { NextResponse } from "next/server";
import { getSession, setSessionCookie } from "@/lib/session.js";

const GROUP_ID = "743137138";
const MIN_RANK = 169; // strictly above this passes — 216 itself does NOT

export async function GET(request) {
  const session = getSession(request) || {};
  const forceRefresh = request.nextUrl.searchParams.get("refresh") === "true";

  if (!session.discordId) {
    return NextResponse.json({
      discordConnected: false,
      robloxLinked: false,
      workspaceAllowed: false,
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

  if (session.robloxLinked && (session.workspaceRank === undefined || forceRefresh)) {
    try {
      const groupRes = await fetch(
        `https://groups.roblox.com/v2/users/${session.robloxId}/groups/roles`
      );

      if (groupRes.ok) {
        const groupData = await groupRes.json();
        const membership = groupData.data?.find(
          (g) => String(g.group.id) === GROUP_ID
        );
        session.workspaceRank = membership ? membership.role.rank : 0;
        session.workspaceRoleName = membership ? membership.role.name : null;
      } else {
        const text = await groupRes.text().catch(() => "");
        console.error("Roblox group lookup failed:", groupRes.status, text);
        session.workspaceRank = 0;
      }
    } catch (err) {
      console.error("Roblox group lookup error:", err);
      session.workspaceRank = 0;
    }
  }

  const rank = session.workspaceRank ?? null;
  const allowed = rank !== null && rank > MIN_RANK;

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
    workspaceRank: rank,
    workspaceRoleName: session.workspaceRoleName || null,
    workspaceAllowed: allowed,
  });

  setSessionCookie(response, session);

  return response;
}