// api/bloxlink/lookup.js
export default async function handler(req, res) {
  const { discordId } = req.query;
  if (!discordId) {
    return res.status(400).json({ error: "Missing discordId" });
  }

  const guildId = process.env.DISCORD_GUILD_ID;

  try {
    const bloxlinkRes = await fetch(
      `https://api.blox.link/v4/public/guilds/${guildId}/discord-to-roblox/${discordId}`,
      { headers: { Authorization: process.env.BLOXLINK_API_KEY } }
    );

    if (bloxlinkRes.status === 404) {
      return res.status(200).json({ linked: false });
    }
    if (!bloxlinkRes.ok) throw new Error("Bloxlink lookup failed");

    const data = await bloxlinkRes.json();
    const robloxId = data.robloxID;

    // Get username/avatar for display
    const [userRes, avatarRes] = await Promise.all([
      fetch(`https://users.roblox.com/v1/users/${robloxId}`),
      fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=150x150&format=Png`
      ),
    ]);
    const userData = await userRes.json();
    const avatarData = await avatarRes.json();

    res.status(200).json({
      linked: true,
      robloxId,
      robloxUsername: userData.name,
      robloxDisplayName: userData.displayName,
      avatarUrl: avatarData.data?.[0]?.imageUrl || null,
    });
  } catch (err) {
    console.error("Bloxlink lookup error:", err);
    res.status(500).json({ error: "Lookup failed" });
  }
}