import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getUserFromSession } from "@/lib/auth"

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

// Allowlist of actions the UI is allowed to log. Keeps this endpoint from
// becoming a place any client script can write arbitrary strings into your
// audit trail. Extend this as you wire up more logged actions.
const ALLOWED_ACTIONS = new Set([
  "department_created",
  "department_archived",
  "permission_updated",
  "member_added",
  "member_removed",
])

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { action, meta } = body || {}

    if (!action || typeof action !== "string" || !ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 })
    }

    // Identify the actor server-side — never trust an actor identity sent
    // from the client, or anyone could write audit entries under someone
    // else's name.
    const session = await getServerSession(authOptions).catch(() => null)
    if (!session?.user) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db(DB_NAME)

    const doc = {
      action,
      meta: meta && typeof meta === "object" ? meta : {},
      actorDiscordUsername: session.user.discordUsername || session.user.name || "Unknown",
      actorRobloxUsername: session.user.robloxUsername || null,
      actorAvatarUrl: session.user.avatarUrl || session.user.image || null,
      createdAt: new Date(),
    }

    const result = await db.collection("staffAuditLog").insertOne(doc)

    return NextResponse.json({
      ok: true,
      log: {
        id: result.insertedId.toString(),
        action: doc.action,
        createdAt: doc.createdAt,
        meta: doc.meta,
        actor: {
          discordUsername: doc.actorDiscordUsername,
          robloxUsername: doc.actorRobloxUsername,
          avatarUrl: doc.actorAvatarUrl,
        },
      },
    })
  } catch (err) {
    console.error("audit-log POST error:", err)
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}