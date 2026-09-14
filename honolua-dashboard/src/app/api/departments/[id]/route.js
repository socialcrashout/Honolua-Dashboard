// app/api/departments/[id]/route.js
import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth"
import { canManageUpdates, getStaffRoleForUser } from "@/lib/staff"
import Department from "@/model/Department"
import { getRobloxUserByUsername, getAvatarHeadshots } from "@/lib/roblox"

async function requireStaff() {
  const session = await getUserFromSession()
  if (!session) {
    return { error: NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 }) }
  }
  if (session.blocked) {
    return { error: NextResponse.json({ ok: false, error: "account_unavailable" }, { status: 403 }) }
  }
  await dbConnect()
  const role = await getStaffRoleForUser(session.user)
  if (!canManageUpdates(role)) {
    return { error: NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 }) }
  }
  return { session }
}

async function serialize(department) {
  const avatarMap = await getAvatarHeadshots(department.members.map((m) => m.robloxId))
  return {
    id: String(department._id),
    name: department.name,
    description: department.description,
    icon: department.icon,
    color: department.color,
    status: department.status,
    permissions: department.permissions,
    members: department.members.map((m) => ({
      username: m.username,
      robloxId: m.robloxId,
      avatarUrl: avatarMap[m.robloxId] || null,
    })),
  }
}

// Supports payload.action: "addMember" | "removeMember" | "togglePermission" | (default: field edit)
export async function PATCH(request, { params }) {
  const { error } = await requireStaff()
  if (error) return error

  const { id } = params
  const payload = await request.json().catch(() => null)

  const department = await Department.findById(id)
  if (!department) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
  }

  if (payload?.action === "addMember") {
    const username = payload.username?.trim()
    if (!username) {
      return NextResponse.json({ ok: false, error: "username_required" }, { status: 400 })
    }

    const robloxUser = await getRobloxUserByUsername(username)
    if (!robloxUser) {
      return NextResponse.json({ ok: false, error: "roblox_user_not_found" }, { status: 404 })
    }

    const alreadyMember = department.members.some((m) => m.robloxId === robloxUser.robloxId)
    if (!alreadyMember) {
      department.members.push({ username: robloxUser.username, robloxId: robloxUser.robloxId })
      await department.save()
    }
  } else if (payload?.action === "removeMember") {
    department.members = department.members.filter((m) => m.robloxId !== payload.robloxId)
    await department.save()
  } else if (payload?.action === "togglePermission") {
    const perm = department.permissions[payload.index]
    if (perm) {
      perm.enabled = !perm.enabled
      await department.save()
    }
  } else {
    if (payload?.name !== undefined) department.name = payload.name.trim()
    if (payload?.description !== undefined) department.description = payload.description.trim()
    if (payload?.status !== undefined) department.status = payload.status
    await department.save()
  }

  return NextResponse.json({ ok: true, department: await serialize(department) })
}

// Soft delete — matches the pattern used for updates (sets status to Archived).
export async function DELETE(request, { params }) {
  const { error } = await requireStaff()
  if (error) return error

  const { id } = params
  const updated = await Department.findByIdAndUpdate(id, { status: "Archived" }, { new: true })
  if (!updated) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}