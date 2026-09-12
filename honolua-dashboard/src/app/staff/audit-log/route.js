import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

const DB_NAME = "honolua"
const MAX_LIMIT = 100
const DEFAULT_LIMIT = 50

export async function GET(request) {
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)

    const { searchParams } = new URL(request.url)
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get("limit"), 10) || DEFAULT_LIMIT)
    )
    const cursor = searchParams.get("cursor")

    const query = {}
    if (cursor) {
      const cursorDate = new Date(cursor)
      if (!isNaN(cursorDate.getTime())) {
        query.createdAt = { $lt: cursorDate }
      }
    }

    const docs = await db
      .collection("staffAuditLog")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .toArray()

    const hasMore = docs.length > limit
    const pageLogs = hasMore ? docs.slice(0, limit) : docs

    const logs = pageLogs.map((log) => ({
      id: log._id.toString(),
      action: log.action,
      createdAt: log.createdAt,
      meta: log.meta || {},
      actor: {
        discordUsername: log.actorDiscordUsername || "Unknown",
        robloxUsername: log.actorRobloxUsername || null,
        avatarUrl: log.actorAvatarUrl || null,
      },
    }))

    return NextResponse.json({
      ok: true,
      logs,
      nextCursor: hasMore ? pageLogs[pageLogs.length - 1].createdAt : null,
    })
  } catch (err) {
    console.error("audit-log GET error:", err)
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}