import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSession } from "@/lib/session"
import clientPromise from "@/lib/mongodb"

const SETTINGS_ID = "singleton"

async function getDb() {
  const client = await clientPromise
  return client.db("honolua")
}

export async function GET() {
  try {
    const db = await getDb()
    const settings = await db.collection("siteSettings").findOne({ _id: SETTINGS_ID })

    return NextResponse.json({
      ok: true,
      maintenanceMode: settings?.maintenanceMode || false,
      maintenanceMessage: settings?.maintenanceMessage || "",
      shutdownMode: settings?.shutdownMode || false,
      shutdownMessage: settings?.shutdownMessage || "",
      announcement: settings?.announcement || { enabled: false },
    })
  } catch (err) {
    console.error("site-settings GET error:", err)
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const cookieStore = await cookies()
    const session = getSession({ cookies: cookieStore })

    // TODO: same as the page component — no permission check yet.
    // Right now anyone with a valid session can PATCH this. Add your
    // rank/role check here once ready, and return 403 like below:
    // if (!allowed) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })

    const body = await request.json()
    const db = await getDb()

    const update = { ...body, updatedAt: new Date() }

    if (body.announcement) {
      update.announcement = {
        ...body.announcement,
        publishedAt: new Date(),
        publishedByUsername: session?.username || "unknown",
      }
    }

    await db.collection("siteSettings").updateOne(
      { _id: SETTINGS_ID },
      { $set: update },
      { upsert: true }
    )

    if (body.announcement?.enabled) {
      await db.collection("announcementHistory").insertOne({
        ...update.announcement,
        isActive: true,
      })
      await db.collection("announcementHistory").updateMany(
        { isActive: true, publishedAt: { $ne: update.announcement.publishedAt } },
        { $set: { isActive: false } }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("site-settings PATCH error:", err)
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}