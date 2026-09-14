// app/api/departments/route.js
import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth"
import { canManageUpdates, getStaffRoleForUser } from "@/lib/staff"
import Department from "@/model/Department"
import { getAvatarHeadshots } from "@/lib/roblox"

async function requireStaff() {
  const session = await getUserFromSession()
  if (!session) {
    return { error: NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 }) }
  }
  if (session.blocked) {
    return { error: NextResponse.json({ ok: false, error: "account_unavailable" }, { status: 403 }) }
  }
  await dbConnect()
  // getUserFromSession() returns the session payload directly (see lib/auth.js),
  // not wrapped in a `.user` key — pass `session` itself, not `session.user`.
  /*const role = await getStaffRoleForUser(session)
  if (!canManageUpdates(role)) {
    return { error: NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 }) }
  }*/
  return { session }
}

export async function GET() {
  const { error } = await requireStaff()
  if (error) return error

  const departments = await Department.find({ status: { $ne: "Archived" } })
    .sort({ createdAt: 1 })
    .lean()

  // Batch every member's Roblox ID across all departments into one avatar request
  const allRobloxIds = departments.flatMap((d) => d.members.map((m) => m.robloxId))
  const avatarMap = await getAvatarHeadshots(allRobloxIds)

  return NextResponse.json({
    ok: true,
    departments: departments.map((d) => ({
      id: String(d._id),
      name: d.name,
      description: d.description,
      icon: d.icon,
      color: d.color,
      status: d.status,
      permissions: d.permissions,
      members: d.members.map((m) => ({
        username: m.username,
        robloxId: m.robloxId,
        avatarUrl: avatarMap[m.robloxId] || null,
      })),
    })),
  })
}

export async function POST(request) {
  const { error } = await requireStaff()
  if (error) return error

  const payload = await request.json().catch(() => null)
  const name = payload?.name?.trim()
  if (!name) {
    return NextResponse.json({ ok: false, error: "name_required" }, { status: 400 })
  }

  const created = await Department.create({
    name,
    description: payload?.description?.trim() || "",
    icon: payload?.icon || "Users",
    color: payload?.color || "#E6736F",
  })

  return NextResponse.json({
    ok: true,
    department: {
      id: String(created._id),
      name: created.name,
      description: created.description,
      icon: created.icon,
      color: created.color,
      status: created.status,
      permissions: created.permissions,
      members: [],
    },
  })
}