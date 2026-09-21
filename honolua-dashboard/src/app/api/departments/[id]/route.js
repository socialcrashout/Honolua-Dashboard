// app/api/departments/[id]/route.js
import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth"
import { canManageUpdates, getStaffRoleForUser } from "@/lib/staff"
import { logStaffAction } from "@/lib/audit"
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
  /*const role = await getStaffRoleForUser(session)
  if (!canManageUpdates(role)) {
    return { error: NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 }) }
  }*/
  return { session }
}

function actorFromSession(session) {
  return { discordId: session?.discordId, discordUsername: session?.username || session?.discordUsername }
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
  const { error, session } = await requireStaff()
  if (error) return error

  const { id } = await params
  const payload = await request.json().catch(() => null)

  const department = await Department.findById(id)
  if (!department) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
  }

  const actor = actorFromSession(session)

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

      await logStaffAction({
        session: actor,
        action: "member_added",
        meta: { departmentId: id, department: department.name, username: robloxUser.username },
      })
    }
  } else if (payload?.action === "removeMember") {
    const removed = department.members.find((m) => m.robloxId === payload.robloxId)
    department.members = department.members.filter((m) => m.robloxId !== payload.robloxId)
    await department.save()

    await logStaffAction({
      session: actor,
      action: "member_removed",
      meta: { departmentId: id, department: department.name, username: removed?.username },
    })
  } else if (payload?.action === "togglePermission") {
    const perm = department.permissions[payload.index]
    if (perm) {
      perm.enabled = !perm.enabled
      await department.save()

      await logStaffAction({
        session: actor,
        action: "permission_updated",
        meta: { departmentId: id, department: department.name, permission: perm.label, enabled: perm.enabled },
      })
    }
  } else {
    const changedFields = []
    if (payload?.name !== undefined && payload.name.trim() !== department.name) {
      department.name = payload.name.trim()
      changedFields.push("name")
    }
    if (payload?.description !== undefined && payload.description.trim() !== department.description) {
      department.description = payload.description.trim()
      changedFields.push("description")
    }
    if (payload?.status !== undefined && payload.status !== department.status) {
      department.status = payload.status
      changedFields.push("status")
    }
    if (changedFields.length > 0) {
      await department.save()

      await logStaffAction({
        session: actor,
        action: "department_updated",
        meta: { departmentId: id, department: department.name, fields: changedFields },
      })
    }
  }

  return NextResponse.json({ ok: true, department: await serialize(department) })
}

// Soft delete — matches the pattern used for updates (sets status to Archived).
export async function DELETE(request, { params }) {
  const { error, session } = await requireStaff()
  if (error) return error

  const { id } = await params
  const updated = await Department.findByIdAndUpdate(id, { status: "Archived" }, { new: true })
  if (!updated) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
  }

  await logStaffAction({
    session: actorFromSession(session),
    action: "department_archived",
    meta: { departmentId: id, department: updated.name },
  })

  return NextResponse.json({ ok: true })
}