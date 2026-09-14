import { NextResponse } from "next/server"
import { dbConnect } from "@/lib/db"
import { getUserFromSession } from "@/lib/auth"
import { canManageUpdates, getStaffRoleForUser } from "@/lib/staff"
import ProductUpdate from "@/model/ProductUpdate"

// Soft delete: the GET handler only returns { active: true } updates, so
// flipping this to false is enough to remove it from the list without
// destroying the record. Switch to findByIdAndDelete if you'd rather
// hard-delete instead.
export async function DELETE(request, { params }) {
  const session = await getUserFromSession()
  if (!session) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  if (session.blocked) return NextResponse.json({ ok: false, error: "account_unavailable" }, { status: 403 })

  await dbConnect()
  const role = await getStaffRoleForUser(session.user)
  if (!canManageUpdates(role)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
  }

  const { id } = params
  const updated = await ProductUpdate.findByIdAndUpdate(id, { active: false }, { new: true })
  if (!updated) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}