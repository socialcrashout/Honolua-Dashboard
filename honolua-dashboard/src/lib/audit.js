import clientPromise from "@/lib/mongodb"

const DB_NAME = "honolua"

async function lookupRobloxProfile(discordId) {
  if (!discordId) return null
  try {
    const guildId = process.env.DISCORD_GUILD_ID
    const bloxlinkRes = await fetch(
      `https://api.blox.link/v4/public/guilds/${guildId}/discord-to-roblox/${discordId}`,
      { headers: { Authorization: process.env.BLOXLINK_API_KEY } }
    )
    if (!bloxlinkRes.ok) return null
    const data = await bloxlinkRes.json()
    const robloxId = data.robloxID
    if (!robloxId) return null

    const [userRes, avatarRes] = await Promise.all([
      fetch(`https://users.roblox.com/v1/users/${robloxId}`),
      fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=150x150&format=Png`
      ),
    ])
    const userData = await userRes.json().catch(() => null)
    const avatarData = await avatarRes.json().catch(() => null)

    return {
      robloxId,
      robloxUsername: userData?.name || null,
      avatarUrl: avatarData?.data?.[0]?.imageUrl || null,
    }
  } catch (err) {
    console.error("audit: roblox lookup failed", err)
    return null
  }
}

export async function logStaffAction({ session, action, meta = {} }) {
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const roblox = await lookupRobloxProfile(session?.discordId)

    await db.collection("staffAuditLog").insertOne({
      action,
      meta,
      actorDiscordId: session?.discordId || null,
      actorDiscordUsername: session?.discordUsername || "Unknown",
      actorRobloxUsername: roblox?.robloxUsername || null,
      actorAvatarUrl: roblox?.avatarUrl || null,
      createdAt: new Date(),
    })
  } catch (err) {
    // Never let a logging failure break the actual save.
    console.error("audit: failed to write log entry", err)
  }
}