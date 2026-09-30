import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getUserFromSession } from "@/lib/auth"
import { canManageUpdates } from "@/lib/staff"
import { logStaffAction } from "@/lib/audit"

const GROUP_ID = 743137138
const DB_NAME = "honolua"

async function requireActivityManager() {
  const session = await getUserFromSession()
  if (!session?.discordId) return { response: NextResponse.json({ error: "Sign in to manage activity settings." }, { status: 401 }) }
  if (!canManageUpdates(session.workspaceRank)) return { response: NextResponse.json({ error: "You do not have access to activity settings." }, { status: 403 }) }
  return { session }
}

export async function GET() {
  const { response } = await requireActivityManager()
  if (response) return response
  try {
    const client = await clientPromise
    const [rolesResponse, settings] = await Promise.all([
      fetch(`https://groups.roblox.com/v1/groups/${GROUP_ID}/roles`, { cache: "no-store" }),
      client.db(DB_NAME).collection("activitySettings").findOne({ groupId: GROUP_ID }),
    ])
    if (!rolesResponse.ok) throw new Error("Roblox roles unavailable")
    const data = await rolesResponse.json()
    const roles = (data.roles || []).map((role) => ({ id: role.id, name: role.name, rank: role.rank }))
    return NextResponse.json({ ok: true, roles, quotas: settings?.quotas || {} }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("activity settings GET error:", error)
    return NextResponse.json({ error: "Could not load rank quotas. Try again shortly." }, { status: 502 })
  }
}

export async function PUT(request) {
  const { session, response } = await requireActivityManager()
  if (response) return response
  const body = await request.json().catch(() => null)
  if (!body?.quotas || typeof body.quotas !== "object" || Array.isArray(body.quotas)) {
    return NextResponse.json({ error: "Choose a weekly quota for each group rank." }, { status: 400 })
  }

  const quotas = {}
  for (const [rank, rawMinutes] of Object.entries(body.quotas)) {
    const minutes = Number(rawMinutes)
    if (!/^\d{1,3}$/.test(rank) || Number(rank) > 255 || !Number.isInteger(minutes) || minutes < 0 || minutes > 10080) {
      return NextResponse.json({ error: "Rank quotas must be whole minutes from 0 to 10,080." }, { status: 400 })
    }
    quotas[rank] = minutes
  }

  try {
    const client = await clientPromise
    await client.db(DB_NAME).collection("activitySettings").updateOne(
      { groupId: GROUP_ID },
      { $set: { quotas, updatedAt: new Date(), updatedBy: String(session.discordId) }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    )
    await logStaffAction({
      session: { discordId: session.discordId, discordUsername: session.discordUsername || session.username },
      action: "activity_quotas_updated",
      meta: { groupId: GROUP_ID, ranksConfigured: Object.keys(quotas).length },
    })
    return NextResponse.json({ ok: true, quotas })
  } catch (error) {
    console.error("activity settings PUT error:", error)
    return NextResponse.json({ error: "Could not save rank quotas." }, { status: 500 })
  }
}
