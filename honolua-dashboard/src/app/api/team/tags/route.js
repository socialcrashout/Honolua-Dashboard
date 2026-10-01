import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

const GROUP_ID = 743137138

export async function GET() {
  try {
    const client = await clientPromise
    const records = await client.db("honolua").collection("teamPageTags").find({ groupId: GROUP_ID }).toArray()
    const tags = Object.fromEntries(records.map((record) => [String(record.userId), (record.tags || []).map(({ id, name, icon, color }) => ({ id, name, icon, color }))]))
    return NextResponse.json({ ok: true, tags }, { headers: { "Cache-Control": "public, no-store, max-age=0" } })
  } catch (error) {
    console.error("public team tags GET error:", error)
    return NextResponse.json({ error: "Could not load team labels." }, { status: 500 })
  }
}
