import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth"
import { canManageUpdates, getStaffRoleForUser } from "@/lib/staff"
import ProductUpdate from "@/model/ProductUpdate"

export async function GET() {
  const session = await getUserFromSession()
  if (!session) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  if (session.blocked) return NextResponse.json({ ok: false, error: "account_unavailable" }, { status: 403 })

  await dbConnect()
  const role = await getStaffRoleForUser(session)
  if (!canManageUpdates(role)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
  }

  const updates = await ProductUpdate.find({ active: true }).sort({ createdAt: -1 }).limit(100).lean()
  return NextResponse.json({
    ok: true,
    updates: updates.map((u) => ({
      id: String(u._id),
      title: u.title,
      body: u.body,
      mediaUrl: u.mediaUrl || "",
      ctaLabel: u.ctaLabel || "",
      ctaUrl: u.ctaUrl || "",
      active: !!u.active,
      createdAt: u.createdAt,
    })),
  })
}

export async function POST(request) {
  const session = await getUserFromSession()
  if (!session) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  if (session.blocked) return NextResponse.json({ ok: false, error: "account_unavailable" }, { status: 403 })

  await dbConnect()
  const role = await getStaffRoleForUser(session.user)
  if (!canManageUpdates(role)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
  }

  const payload = await request.json().catch(() => null)
  const title = payload?.title?.trim()
  const body = payload?.body?.trim()

  if (!title || !body) {
    return NextResponse.json({ ok: false, error: "title_and_body_required" }, { status: 400 })
  }

  const created = await ProductUpdate.create({
    title,
    body,
    mediaUrl: payload?.mediaUrl?.trim() || "",
    ctaLabel: payload?.ctaLabel?.trim() || "",
    ctaUrl: payload?.ctaUrl?.trim() || "",
    active: true,
    createdBy: session.user?._id,
  })

  return NextResponse.json({
    ok: true,
    update: {
      id: String(created._id),
      title: created.title,
      body: created.body,
      mediaUrl: created.mediaUrl || "",
      ctaLabel: created.ctaLabel || "",
      ctaUrl: created.ctaUrl || "",
      active: created.active,
      createdAt: created.createdAt,
    },
  })
}