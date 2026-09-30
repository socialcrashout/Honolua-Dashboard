import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getUserFromSession } from "@/lib/auth"
import { canManageUpdates } from "@/lib/staff"
import { logStaffAction } from "@/lib/audit"

const GROUP_ID = 743137138
const DB_NAME = "honolua"
const ACTIVE_WINDOW_MS = 2 * 60 * 1000

async function requireStaff() {
  const session = await getUserFromSession()
  if (!session?.discordId) return { response: NextResponse.json({ error: "Sign in to view activity." }, { status: 401 }) }
  if (!canManageUpdates(session.workspaceRank)) return { response: NextResponse.json({ error: "You do not have access to staff activity." }, { status: 403 }) }
  return { session }
}

function mondayStart(date) {
  const start = new Date(date)
  start.setUTCHours(0, 0, 0, 0)
  const daysSinceMonday = (start.getUTCDay() + 6) % 7
  start.setUTCDate(start.getUTCDate() - daysSinceMonday)
  return start
}

export async function GET() {
  const { response } = await requireStaff()
  if (response) return response

  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const now = new Date()
    const weekStart = mondayStart(now)
    const [rolesResponse, settings, sessions] = await Promise.all([
      fetch(`https://groups.roblox.com/v1/groups/${GROUP_ID}/roles`, { cache: "no-store" }),
      db.collection("activitySettings").findOne({ groupId: GROUP_ID }),
      db.collection("activitySessions").find({
        groupId: GROUP_ID,
        startedAt: { $lt: now },
        $or: [{ endedAt: { $gte: weekStart } }, { isActive: true }],
      }).sort({ startedAt: -1 }).limit(5000).toArray(),
    ])

    if (!rolesResponse.ok) throw new Error("Roblox role list unavailable")
    const rolesData = await rolesResponse.json()
    const roles = (rolesData.roles || []).map((role) => ({ id: role.id, name: role.name, rank: role.rank }))
    const activity = sessions.map((session) => {
      const startedAt = new Date(session.startedAt)
      const lastSeenAt = new Date(session.lastSeenAt || session.endedAt || session.startedAt)
      const isActive = Boolean(session.isActive) && now - lastSeenAt <= ACTIVE_WINDOW_MS
      const endedAt = isActive ? now : new Date(session.endedAt || lastSeenAt)
      const overlapStart = startedAt > weekStart ? startedAt : weekStart
      const minutes = Math.max(0, Math.floor((endedAt - overlapStart) / 60000))
      return {
        userId: String(session.userId), username: session.username || "Unknown", rank: Number(session.rank) || 0,
        minutes, isActive, startedAt: session.startedAt, endedAt: session.endedAt || (isActive ? null : lastSeenAt), lastSeenAt,
        serverId: session.serverId || "",
      }
    })

    return NextResponse.json({
      ok: true, group: { id: GROUP_ID, name: "Honolua" }, roles,
      quotas: settings?.quotas || {}, activity, weekStartsAt: weekStart,
      lastEventAt: activity.reduce((latest, session) => {
        const timestamp = new Date(session.lastSeenAt || session.endedAt || session.startedAt).getTime()
        return timestamp > latest ? timestamp : latest
      }, 0) || null,
    }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("staff activity GET error:", error)
    return NextResponse.json({ error: "Could not load activity. Try again shortly." }, { status: 502 })
  }
}

export async function PUT(request) {
  const { session, response } = await requireStaff()
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
}
