import { dbConnect } from "@/lib/db"
import MemberSanction from "@/model/MemberSanction"
import VerifiedAccount from "@/model/VerifiedAccount"

export async function rememberVerifiedAccount({ robloxUserId, discordId, robloxUsername, discordUsername }) {
  if (!robloxUserId || !discordId) return
  await dbConnect()
  await VerifiedAccount.updateOne(
    { robloxUserId: String(robloxUserId) },
    { $set: { discordId: String(discordId), robloxUsername: String(robloxUsername || ""), discordUsername: String(discordUsername || ""), lastVerifiedAt: new Date() } },
    { upsert: true }
  )
}

export async function findMemberAccessBlock({ discordId, robloxUserId, surface }) {
  const identities = []
  if (discordId) identities.push({ discordId: String(discordId) })
  if (robloxUserId) identities.push({ robloxUserId: String(robloxUserId) })
  if (!identities.length) return null

  await dbConnect()
  const now = new Date()
  const sanctions = await MemberSanction.find({
    $and: [
      { $or: identities },
      { status: "active" },
      { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
    ],
  }).sort({ createdAt: -1 }).lean()

  const applicable = sanctions.find((sanction) => {
    if (sanction.action === "ban" || sanction.action === "suspension") return true
    return sanction.action === "restriction" && (sanction.restrictions || []).includes(surface)
  })
  if (!applicable) return null

  return {
    action: applicable.action,
    reason: applicable.reason,
    expiresAt: applicable.expiresAt || null,
  }
}

export function isMemberSanctionActive(sanction, now = new Date()) {
  return sanction?.status === "active" && (!sanction.expiresAt || new Date(sanction.expiresAt) > now)
}

export function serializeMemberSanction(sanction) {
  return {
    id: sanction.id,
    robloxUserId: sanction.robloxUserId,
    username: sanction.username,
    action: sanction.action,
    category: sanction.category,
    reason: sanction.reason,
    details: sanction.details || "",
    restrictions: sanction.restrictions || [],
    days: sanction.days || 0,
    expiresAt: sanction.expiresAt || null,
    status: sanction.status,
    createdAt: sanction.createdAt,
    createdByName: sanction.createdByName || "",
    revokedAt: sanction.revokedAt || null,
  }
}
