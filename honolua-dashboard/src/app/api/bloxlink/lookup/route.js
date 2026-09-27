// api/bloxlink/lookup/route.js
import { NextResponse } from "next/server";

const HONOLUA_GROUP_ID = "743137138";

function defaultDiscordAvatar(discordId) {
  if (!/^\d+$/.test(discordId)) return null;
  const index = Number((BigInt(discordId) >> 22n) % 6n);
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

async function getDiscordAvatar(discordId) {
  const fallback = defaultDiscordAvatar(discordId);
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return fallback;

  try {
    const response = await fetch(`https://discord.com/api/v10/users/${discordId}`, {
      headers: { Authorization: `Bot ${token}` },
      cache: 'no-store',
    });
    if (!response.ok) return fallback;
    const user = await response.json();
    if (!user.avatar) return fallback;
    const format = user.avatar.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${discordId}/${user.avatar}.${format}?size=128`;
  } catch {
    return fallback;
  }
}

export async function GET(request) {
  const discordId = request.nextUrl.searchParams.get("discordId");
  if (!discordId) {
    return NextResponse.json({ error: "Missing discordId" }, { status: 400 });
  }

  const guildId = process.env.DISCORD_GUILD_ID;

  try {
    const discordAvatarPromise = getDiscordAvatar(discordId);
    const bloxlinkRes = await fetch(
      `https://api.blox.link/v4/public/guilds/${guildId}/discord-to-roblox/${discordId}`,
      { headers: { Authorization: process.env.BLOXLINK_API_KEY } }
    );

    if (bloxlinkRes.status === 404) {
      return NextResponse.json({ linked: false, discordAvatarUrl: await discordAvatarPromise });
    }
    if (!bloxlinkRes.ok) throw new Error("Bloxlink lookup failed");

    const data = await bloxlinkRes.json();
    const robloxId = data.robloxID;

    // Get username/avatar/group rank for display
    const [userRes, avatarRes, rolesRes] = await Promise.all([
      fetch(`https://users.roblox.com/v1/users/${robloxId}`),
      fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=150x150&format=Png`
      ),
      fetch(`https://groups.roblox.com/v1/users/${robloxId}/groups/roles`),
    ]);
    const userData = await userRes.json();
    const avatarData = await avatarRes.json();
    const rolesData = await rolesRes.json().catch(() => ({}));

    const membership = (rolesData?.data || []).find(
      (g) => String(g.group?.id) === HONOLUA_GROUP_ID
    );

    return NextResponse.json({
      linked: true,
      discordAvatarUrl: await discordAvatarPromise,
      robloxId,
      robloxUsername: userData.name,
      robloxDisplayName: userData.displayName,
      avatarUrl: avatarData.data?.[0]?.imageUrl || null,
      inGroup: Boolean(membership),
      groupName: membership?.group?.name || null,
      rankName: membership?.role?.name || null,
      rankNumber: membership?.role?.rank ?? null,
    });
  } catch (err) {
    console.error("Bloxlink lookup error:", err);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}