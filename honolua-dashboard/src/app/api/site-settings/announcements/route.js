import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("honolua")

    const docs = await db
      .collection("announcementHistory")
      .find({})
      .sort({ publishedAt: -1 })
      .limit(20)
      .toArray()

    const history = docs.map((d) => ({
      id: d._id.toString(),
      message: d.message,
      emoji: d.emoji,
      color: d.color,
      link: d.link,
      linkText: d.linkText,
      publishedByUsername: d.publishedByUsername,
      publishedAt: d.publishedAt,
      isActive: d.isActive || false,
    }))

    return NextResponse.json({ ok: true, history })
  } catch (err) {
    console.error("announcements GET error:", err)
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}