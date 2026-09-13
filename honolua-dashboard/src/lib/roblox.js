// lib/roblox.js
// Talks to Roblox's public (unauthenticated) APIs. No API key needed for these two endpoints.

const USERNAME_LOOKUP_URL = "https://users.roblox.com/v1/usernames/users"
const AVATAR_URL = "https://thumbnails.roblox.com/v1/users/avatar-headshot"

// Resolves a Roblox username to { robloxId, username } (username is returned with
// Roblox's canonical casing). Returns null if no such user exists.
export async function getRobloxUserByUsername(username) {
  const res = await fetch(USERNAME_LOOKUP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
  })

  if (!res.ok) return null

  const j = await res.json().catch(() => null)
  const match = j?.data?.[0]
  if (!match) return null

  return { robloxId: match.id, username: match.name }
}

// Given an array of Roblox user IDs, returns a { [robloxId]: avatarImageUrl } map.
// Always fetched live — Roblox returns whatever the user's *current* avatar is,
// so this naturally reflects avatar changes with no caching needed on our end.
export async function getAvatarHeadshots(robloxIds) {
  const ids = [...new Set(robloxIds)].filter(Boolean)
  if (!ids.length) return {}

  const params = new URLSearchParams({
    userIds: ids.join(","),
    size: "150x150",
    format: "Png",
    isCircular: "true",
  })

  const res = await fetch(`${AVATAR_URL}?${params.toString()}`)
  if (!res.ok) return {}

  const j = await res.json().catch(() => null)
  const map = {}
  for (const entry of j?.data || []) {
    if (entry.state === "Completed") map[entry.targetId] = entry.imageUrl
  }
  return map
}