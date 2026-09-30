import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

const GROUP_ID = 743137138

export async function POST(request) {
  const secret = process.env.ROBLOX_ACTIVITY_SECRET
  if (!secret) return NextResponse.json({ error: "Activity event receiver is not configured." }, { status: 503 })
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const event = body?.event
  const userId = String(body?.userId || "")
  const serverId = typeof body?.serverId === "string" ? body.serverId.trim() : ""
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId.trim() : ""
  const username = typeof body?.username === "string" ? body.username.trim().slice(0, 64) : ""
  const rank = Number(body?.rank)
  const at = body?.at ? new Date(body.at) : new Date()
  if (!new Set(["join", "leave"]).has(event) || !/^\d{1,20}$/.test(userId) || !serverId || serverId.length > 128 || !sessionId || sessionId.length > 128 || !Number.isInteger(rank) || rank < 0 || rank > 255 || Number.isNaN(at.getTime())) {
    return NextResponse.json({ error: "Invalid activity event." }, { status: 400 })
  }

  try {
    const client = await clientPromise
    const collection = client.db("honolua").collection("activitySessions")
    const id = `${sessionId}:${userId}`
    if (event === "join") {
      await collection.updateOne(
        { _id: id },
        { $setOnInsert: { groupId: GROUP_ID, userId, sessionId, serverId, startedAt: at }, $set: { username, rank, isActive: true, lastSeenAt: at } },
        { upsert: true }
      )
      return NextResponse.json({ ok: true, event: "join" })
    }

    const active = await collection.findOne({ _id: id, groupId: GROUP_ID, isActive: true })
    if (!active) return NextResponse.json({ error: "Matching active session not found." }, { status: 404 })
    const endedAt = at < new Date(active.startedAt) ? new Date(active.startedAt) : at
    await collection.updateOne(
      { _id: id, isActive: true },
      { $set: { username, rank, endedAt, isActive: false, durationMinutes: Math.floor((endedAt - new Date(active.startedAt)) / 60000), lastSeenAt: at } }
    )
    return NextResponse.json({ ok: true, event: "leave" })
  } catch (error) {
    console.error("activity ingest error:", error)
    return NextResponse.json({ error: "Could not save activity event." }, { status: 500 })
  }
}
