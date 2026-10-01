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
  const experienceName = typeof body?.experienceName === "string" ? body.experienceName.trim().slice(0, 100) : "Honolua"
  const rank = Number(body?.rank)
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, 500) : ""
  const messageId = typeof body?.messageId === "string" ? body.messageId.trim().slice(0, 128) : ""
  const channel = typeof body?.channel === "string" ? body.channel.trim().slice(0, 48) : ""
  const at = body?.at ? new Date(body.at) : new Date()
  if (!new Set(["join", "heartbeat", "leave", "chat", "afk_start", "afk_end"]).has(event) || !/^\d{1,20}$/.test(userId) || !serverId || serverId.length > 128 || !sessionId || sessionId.length > 128 || !username || !Number.isInteger(rank) || rank < 0 || rank > 255 || Number.isNaN(at.getTime())) {
    return NextResponse.json({ error: "Invalid activity event." }, { status: 400 })
  }
  if (event === "chat" && (!message || !messageId)) return NextResponse.json({ error: "A filtered chat message and message ID are required." }, { status: 400 })

  try {
    const client = await clientPromise
    const collection = client.db("honolua").collection("activitySessions")
    const id = `${sessionId}:${userId}`
    if (event === "chat") {
      const active = await collection.findOne({ _id: id, groupId: GROUP_ID, serverId, isActive: true })
      if (!active) return NextResponse.json({ error: "Matching active session not found." }, { status: 404 })

      const messages = client.db("honolua").collection("activityMessages")
      await messages.createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 })
      await messages.updateOne(
        { _id: `${id}:${messageId}` },
        { $setOnInsert: { groupId: GROUP_ID, userId, sessionId, serverId, username, message, channel: channel || "Experience chat", createdAt: at } },
        { upsert: true }
      )
      console.info("[activity] filtered chat stored")
      return NextResponse.json({ ok: true, event: "chat" })
    }
    if (event === "join") {
      await collection.updateOne(
        { _id: id },
        { $setOnInsert: { groupId: GROUP_ID, userId, sessionId, serverId, startedAt: at }, $set: { username, rank, experienceName, isActive: true, lastSeenAt: at } },
        { upsert: true }
      )
      return NextResponse.json({ ok: true, event: "join" })
    }

    if (event === "heartbeat") {
      const result = await collection.updateOne(
        { _id: id, groupId: GROUP_ID, serverId, isActive: true },
        { $set: { username, rank, experienceName, lastSeenAt: at } }
      )
      if (!result.matchedCount) return NextResponse.json({ error: "Matching active session not found." }, { status: 404 })
      return NextResponse.json({ ok: true, event: "heartbeat" })
    }

    if (event === "afk_start") {
      const result = await collection.updateOne(
        { _id: id, groupId: GROUP_ID, serverId, isActive: true, afkStartedAt: { $exists: false } },
        { $set: { afkStartedAt: at } }
      )
      if (!result.matchedCount) {
        const active = await collection.findOne({ _id: id, groupId: GROUP_ID, serverId, isActive: true })
        if (!active) return NextResponse.json({ error: "Matching active session not found." }, { status: 404 })
      }
      return NextResponse.json({ ok: true, event: "afk_start" })
    }

    if (event === "afk_end") {
      const active = await collection.findOne({ _id: id, groupId: GROUP_ID, serverId, isActive: true, afkStartedAt: { $type: "date" } })
      if (!active) return NextResponse.json({ ok: true, event: "afk_end" })
      const startedAt = new Date(active.afkStartedAt)
      const endedAt = at > startedAt ? at : startedAt
      const periodEnd = new Date(Math.min(endedAt.getTime(), startedAt.getTime() + 20 * 60 * 1000))
      await collection.updateOne(
        { _id: id, groupId: GROUP_ID, serverId, isActive: true, afkStartedAt: active.afkStartedAt },
        { $push: { afkPeriods: { startedAt, endedAt: periodEnd } }, $unset: { afkStartedAt: "" } }
      )
      return NextResponse.json({ ok: true, event: "afk_end" })
    }

    const active = await collection.findOne({ _id: id, groupId: GROUP_ID, serverId, isActive: true })
    if (!active) return NextResponse.json({ error: "Matching active session not found." }, { status: 404 })
    const endedAt = at < new Date(active.startedAt) ? new Date(active.startedAt) : at
    const updates = { username, rank, experienceName, endedAt, isActive: false, durationMinutes: Math.floor((endedAt - new Date(active.startedAt)) / 60000), lastSeenAt: at }
    const afkStartedAt = active.afkStartedAt ? new Date(active.afkStartedAt) : null
    if (afkStartedAt && endedAt > afkStartedAt) {
      updates.afkPeriods = [...(active.afkPeriods || []), { startedAt: afkStartedAt, endedAt: new Date(Math.min(endedAt.getTime(), afkStartedAt.getTime() + 20 * 60 * 1000)) }]
      updates.afkStartedAt = null
    }
    await collection.updateOne(
      { _id: id, isActive: true },
      { $set: updates }
    )
    return NextResponse.json({ ok: true, event: "leave" })
  } catch (error) {
    console.error("activity ingest error:", error)
    return NextResponse.json({ error: "Could not save activity event." }, { status: 500 })
  }
}
