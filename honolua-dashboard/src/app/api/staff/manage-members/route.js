import { NextResponse } from "next/server"
import { getUserFromSession } from "@/lib/auth"
import { dbConnect } from "@/lib/db"
import MemberSanction from "@/model/MemberSanction"
import { serializeMemberSanction } from "@/lib/memberSanctions"

async function requireOwner() {
  const session = await getUserFromSession()
  if (!session?.discordId) return { error: NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 }) }
  if ((session.workspaceRank ?? 0) < 255) return { error: NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 }) }
  await dbConnect()
  return { session }
}

export async function GET() {
  const { error } = await requireOwner()
  if (error) return error

  const sanctions = await MemberSanction.find({}).sort({ createdAt: -1 }).limit(2000).lean()
  return NextResponse.json({ ok: true, sanctions: sanctions.map(serializeMemberSanction) }, { headers: { "Cache-Control": "private, no-store" } })
}
