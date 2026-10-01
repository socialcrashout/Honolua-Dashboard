import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getUserFromSession } from "@/lib/auth"
import { normalizeTeamTag } from "@/lib/teamPageTags"
import { logStaffAction } from "@/lib/audit"

const GROUP_ID = 743137138
const COLLECTION = "teamPageTags"

async function requireOwner() {
  const session = await getUserFromSession()
  if (!session?.discordId) return { response: NextResponse.json({ error: "Sign in to manage the team page." }, { status: 401 }) }
  if ((session.workspaceRank ?? 0) < 255) return { response: NextResponse.json({ error: "Only the workspace owner can manage team page tags." }, { status: 403 }) }
  return { session }
}

function serialize(record) {
  return {
    userId: String(record.userId),
    tags: (record.tags || []).map(({ id, name, icon, color }) => ({ id, name, icon, color })),
  }
}

export async function GET() {
  const { response } = await requireOwner()
  if (response) return response
  try {
    const client = await clientPromise
    const records = await client.db("honolua").collection(COLLECTION).find({ groupId: GROUP_ID }).toArray()
    return NextResponse.json({ ok: true, members: records.map(serialize) }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("team page tags GET error:", error)
    return NextResponse.json({ error: "Could not load team page tags." }, { status: 500 })
  }
}

export async function POST(request) {
  const { response, session } = await requireOwner()
  if (response) return response
  const body = await request.json().catch(() => null)
  const userId = String(body?.userId || "").trim()
  const username = typeof body?.username === "string" ? body.username.trim().slice(0, 64) : ""
  const tag = normalizeTeamTag(body?.tag)
  if (!/^\d{1,20}$/.test(userId) || !tag) return NextResponse.json({ error: "Choose a valid member and tag." }, { status: 400 })

  try {
    const client = await clientPromise
    const collection = client.db("honolua").collection(COLLECTION)
    const current = await collection.findOne({ groupId: GROUP_ID, userId })
    const tags = current?.tags || []
    if (tags.length >= 10) return NextResponse.json({ error: "Each member can have up to 10 tags." }, { status: 400 })
    if (tags.some((item) => item.name.toLowerCase() === tag.name.toLowerCase())) return NextResponse.json({ error: "That tag is already on this member." }, { status: 409 })

    const savedTag = { id: randomUUID(), ...tag }
    await collection.updateOne(
      { groupId: GROUP_ID, userId },
      { $setOnInsert: { groupId: GROUP_ID, userId, username }, $push: { tags: savedTag }, $set: { updatedAt: new Date(), updatedBy: String(session.discordId) } },
      { upsert: true }
    )
    await logStaffAction({ session, action: "team_page_tag_added", meta: { groupId: GROUP_ID, userId, username, tagId: savedTag.id, tagName: tag.name } })
    return NextResponse.json({ ok: true, tag: savedTag }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("team page tag POST error:", error)
    return NextResponse.json({ error: "Could not add this tag." }, { status: 500 })
  }
}

export async function DELETE(request) {
  const { response, session } = await requireOwner()
  if (response) return response
  const body = await request.json().catch(() => null)
  const userId = String(body?.userId || "").trim()
  const tagId = typeof body?.tagId === "string" ? body.tagId : ""
  if (!/^\d{1,20}$/.test(userId) || !tagId || tagId.length > 64) return NextResponse.json({ error: "Choose a valid member and tag." }, { status: 400 })

  try {
    const client = await clientPromise
    const collection = client.db("honolua").collection(COLLECTION)
    const existing = await collection.findOne({ groupId: GROUP_ID, userId, "tags.id": tagId })
    if (!existing) return NextResponse.json({ error: "That tag is no longer on this member." }, { status: 404 })
    const removed = existing.tags.find((tag) => tag.id === tagId)
    await collection.updateOne({ groupId: GROUP_ID, userId }, { $pull: { tags: { id: tagId } }, $set: { updatedAt: new Date(), updatedBy: String(session.discordId) } })
    await logStaffAction({ session, action: "team_page_tag_removed", meta: { groupId: GROUP_ID, userId, username: existing.username || "", tagId, tagName: removed?.name || "" } })
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("team page tag DELETE error:", error)
    return NextResponse.json({ error: "Could not remove this tag." }, { status: 500 })
  }
}
