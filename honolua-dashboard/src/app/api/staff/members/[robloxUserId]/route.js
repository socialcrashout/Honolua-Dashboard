import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { getUserFromSession } from "@/lib/auth"
import { dbConnect } from "@/lib/db"
import StaffMemberRecord from "@/model/StaffMemberRecord"

async function requireOwner() {
  const session = await getUserFromSession()
  if (!session?.discordId) {
    return { error: NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 }) }
  }
  if ((session.workspaceRank ?? 0) < 255) {
    return { error: NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 }) }
  }
  await dbConnect()
  return { session }
}

async function getMemberId(params) {
  const { robloxUserId } = await params
  const normalized = String(robloxUserId || "").trim()
  if (!/^\d{1,20}$/.test(normalized)) return null
  return normalized
}

function serializeEntries(record) {
  return (record?.entries || []).map((entry) => ({
    id: entry.id,
    kind: entry.kind,
    content: entry.content,
    createdAt: entry.createdAt,
    createdByName: entry.createdByName,
  }))
}

export async function GET(_request, { params }) {
  const { error } = await requireOwner()
  if (error) return error

  const robloxUserId = await getMemberId(params)
  if (!robloxUserId) return NextResponse.json({ ok: false, error: "invalid_member_id" }, { status: 400 })

  const record = await StaffMemberRecord.findOne({ robloxUserId }).lean()
  return NextResponse.json({ ok: true, entries: serializeEntries(record) }, { headers: { "Cache-Control": "private, no-store" } })
}

export async function POST(request, { params }) {
  const { error, session } = await requireOwner()
  if (error) return error

  const robloxUserId = await getMemberId(params)
  if (!robloxUserId) return NextResponse.json({ ok: false, error: "invalid_member_id" }, { status: 400 })

  const payload = await request.json().catch(() => null)
  const kind = payload?.kind
  const content = typeof payload?.content === "string" ? payload.content.trim() : ""
  if (!["note", "warning", "suspension"].includes(kind)) {
    return NextResponse.json({ ok: false, error: "invalid_record_type" }, { status: 400 })
  }
  if (!content) return NextResponse.json({ ok: false, error: "content_required" }, { status: 400 })
  if (content.length > 1200) return NextResponse.json({ ok: false, error: "content_too_long" }, { status: 400 })

  const entry = {
    id: randomUUID(),
    kind,
    content,
    createdAt: new Date(),
    createdById: String(session.discordId),
    createdByName: session.discordUsername || session.username || "Owner",
  }

  const record = await StaffMemberRecord.findOneAndUpdate(
    { robloxUserId },
    { $setOnInsert: { username: String(payload?.username || "").slice(0, 64) }, $push: { entries: entry } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean()

  return NextResponse.json({ ok: true, entries: serializeEntries(record) }, { headers: { "Cache-Control": "private, no-store" } })
}
