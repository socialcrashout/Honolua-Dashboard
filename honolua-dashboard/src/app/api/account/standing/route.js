import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { dbConnect } from "@/lib/db"
import MemberSanction from "@/model/MemberSanction"
import VerifiedAccount from "@/model/VerifiedAccount"
import { serializeMemberSanction } from "@/lib/memberSanctions"

export async function GET(request) {
  const session = getSession(request)
  if (!session?.discordId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })

  await dbConnect()
  const linkedAccount = await VerifiedAccount.findOne({ discordId: String(session.discordId) }).lean()
  const robloxUserId = session.robloxId || linkedAccount?.robloxUserId || ""
  const identities = [{ discordId: String(session.discordId) }]
  if (robloxUserId) identities.push({ robloxUserId: String(robloxUserId) })

  const records = await MemberSanction.find({ $or: identities }).sort({ createdAt: -1 }).limit(100).lean()
  return NextResponse.json({
    ok: true,
    username: session.robloxUsername || linkedAccount?.robloxUsername || session.discordUsername || "Member",
    records: records.map(serializeMemberSanction),
  }, { headers: { "Cache-Control": "private, no-store" } })
}
