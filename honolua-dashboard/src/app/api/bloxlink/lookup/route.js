// api/bloxlink/lookup/route.js
import { NextResponse } from "next/server";

const HONOLUA_GROUP_ID = "743137138";

export async function GET(request) {
  const discordId = request.nextUrl.searchParams.get("discordId");
  if (!discordId) {
    return NextResponse.json({ error: "Missing discordId" }, { status: 400 });
  }

  const guildId = process.env.DISCORD_GUILD_ID;

  try {
    const bloxlinkRes = await fetch(
      `https://api.blox.link/v4/public/guilds/${guildId}/discord-to-roblox/${discordId}`,
      { headers: { Authorization: process.env.BLOXLINK_API_KEY } }
    );

    if (bloxlinkRes.status === 404) {
      return NextResponse.json({ linked: false });
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