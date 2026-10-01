import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { getUserFromSession } from "@/lib/auth"
import { dbConnect } from "@/lib/db"
import MemberSanction from "@/model/MemberSanction"
import VerifiedAccount from "@/model/VerifiedAccount"
import { serializeMemberSanction } from "@/lib/memberSanctions"
import { logStaffAction } from "@/lib/audit"

const ACTIONS = ["notice", "warning", "restriction", "suspension", "ban"]
const CATEGORIES = ["conduct", "safety", "integrity", "community", "other"]
const RESTRICTIONS = ["verification", "workspace"]

async function authorize() {
  const session = await getUserFromSession()
  if (!session?.discordId) return { error: NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 }) }
  if ((session.workspaceRank ?? 0) < 255) return { error: NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 }) }
  await dbConnect()
  return { session }
}

async function memberIdFrom(params) {
  const { robloxUserId } = await params
  const id = String(robloxUserId || "").trim()
  return /^\d{1,20}$/.test(id) ? id : null
}

export async function GET(_request, { params }) {
  const { error } = await authorize()
  if (error) return error
  const robloxUserId = await memberIdFrom(params)
  if (!robloxUserId) return NextResponse.json({ ok: false, error: "invalid_member_id" }, { status: 400 })
  const sanctions = await MemberSanction.find({ robloxUserId }).sort({ createdAt: -1 }).lean()
  return NextResponse.json({ ok: true, sanctions: sanctions.map(serializeMemberSanction) }, { headers: { "Cache-Control": "private, no-store" } })
}

export async function POST(request, { params }) {
  const { error, session } = await authorize()
  if (error) return error
  const robloxUserId = await memberIdFrom(params)
  if (!robloxUserId) return NextResponse.json({ ok: false, error: "invalid_member_id" }, { status: 400 })

  const payload = await request.json().catch(() => null)
  const action = String(payload?.action || "")
  const category = String(payload?.category || "")
  const reason = typeof payload?.reason === "string" ? payload.reason.trim() : ""
  const details = typeof payload?.details === "string" ? payload.details.trim() : ""
  const username = typeof payload?.username === "string" ? payload.username.trim().slice(0, 64) : ""
  const restrictions = Array.isArray(payload?.restrictions) ? [...new Set(payload.restrictions)] : []
  const days = Number(payload?.days)

  if (!ACTIONS.includes(action)) return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 })
  if (!CATEGORIES.includes(category)) return NextResponse.json({ ok: false, error: "invalid_category" }, { status: 400 })
  if (!reason || reason.length > 500) return NextResponse.json({ ok: false, error: "reason_required_or_too_long" }, { status: 400 })
  if (details.length > 2000) return NextResponse.json({ ok: false, error: "details_too_long" }, { status: 400 })
  if (!Number.isInteger(days) || days < 0 || days > 3650) return NextResponse.json({ ok: false, error: "invalid_duration" }, { status: 400 })
  if (restrictions.some((restriction) => !RESTRICTIONS.includes(restriction))) return NextResponse.json({ ok: false, error: "invalid_restriction" }, { status: 400 })
  if (action === "restriction" && restrictions.length === 0) return NextResponse.json({ ok: false, error: "choose_a_restriction" }, { status: 400 })

  const now = new Date()
  const verifiedAccount = action === "ban" ? await VerifiedAccount.findOne({ robloxUserId }).lean() : null
  const sanction = await MemberSanction.create({
    id: randomUUID(),
    robloxUserId,
    discordId: verifiedAccount?.discordId || "",
    username,
    action,
    category,
    reason,
    details,
    restrictions: action === "restriction" ? restrictions : [],
    days,
    expiresAt: days > 0 ? new Date(now.getTime() + days * 86400000) : null,
    status: "active",
    createdById: String(session.discordId),
    createdByName: session.discordUsername || session.username || "Owner",
  })

  let discordRoleRemoved = null
  if (action === "ban" && verifiedAccount?.discordId) {
    const guildId = process.env.DISCORD_GUILD_ID
    const roleId = process.env.DISCORD_VERIFIED_ROLE_ID
    if (guildId && roleId && process.env.DISCORD_BOT_TOKEN) {
      try {
        const discordResponse = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${verifiedAccount.discordId}/roles/${roleId}`, {
          method: "DELETE",
          headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
        })
        discordRoleRemoved = discordResponse.ok || discordResponse.status === 404
        if (!discordRoleRemoved) console.error("Could not remove verified role for banned member:", discordResponse.status, await discordResponse.text().catch(() => ""))
      } catch (error) {
        discordRoleRemoved = false
        console.error("Could not remove verified role for banned member:", error)
      }
    } else discordRoleRemoved = false
  }

  await logStaffAction({ session, action: "member_sanction_created", meta: { robloxUserId, username, sanctionId: sanction.id, sanctionType: action, category, discordRoleRemoved } })
  return NextResponse.json({ ok: true, sanction: serializeMemberSanction(sanction.toObject()), discordRoleRemoved }, { status: 201, headers: { "Cache-Control": "private, no-store" } })
}

export async function PATCH(request, { params }) {
  const { error, session } = await authorize()
  if (error) return error
  const robloxUserId = await memberIdFrom(params)
  if (!robloxUserId) return NextResponse.json({ ok: false, error: "invalid_member_id" }, { status: 400 })
  const payload = await request.json().catch(() => null)
  const id = typeof payload?.id === "string" ? payload.id : ""
  if (!id || id.length > 64) return NextResponse.json({ ok: false, error: "invalid_sanction_id" }, { status: 400 })

  const sanction = await MemberSanction.findOneAndUpdate(
    { id, robloxUserId, status: "active" },
    { $set: { status: "revoked", revokedAt: new Date(), revokedById: String(session.discordId) } },
    { new: true }
  ).lean()
  if (!sanction) return NextResponse.json({ ok: false, error: "active_sanction_not_found" }, { status: 404 })

  let discordRoleRestored = null
  if (sanction.action === "ban") {
    const verifiedAccount = await VerifiedAccount.findOne({ robloxUserId }).lean()
    if (verifiedAccount?.discordId) {
      const guildId = process.env.DISCORD_GUILD_ID
      const roleId = process.env.DISCORD_VERIFIED_ROLE_ID
      if (guildId && roleId && process.env.DISCORD_BOT_TOKEN) {
        try {
          const discordResponse = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${verifiedAccount.discordId}/roles/${roleId}`, {
            method: "PUT",
            headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
          })
          discordRoleRestored = discordResponse.ok
          if (!discordRoleRestored) console.error("Could not restore verified role after lifting member ban:", discordResponse.status, await discordResponse.text().catch(() => ""))
        } catch (error) {
          discordRoleRestored = false
          console.error("Could not restore verified role after lifting member ban:", error)
        }
      } else discordRoleRestored = false
    }
  }

  await logStaffAction({ session, action: "member_sanction_revoked", meta: { robloxUserId, username: sanction.username, sanctionId: sanction.id, sanctionType: sanction.action, discordRoleRestored } })
  return NextResponse.json({ ok: true, sanction: serializeMemberSanction(sanction), discordRoleRestored }, { headers: { "Cache-Control": "private, no-store" } })
}
