import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { getUserFromSession } from "@/lib/auth"
import { canManageUpdates, getStaffRoleForUser } from "@/lib/staff"

// Soft delete: the GET handler only returns { active: true } updates, so
// flipping this to false is enough to remove it from the list without
// destroying the record. Set active: false again here if you'd rather
// hard-delete instead (use deleteOne).
export async function DELETE(request, { params }) {
  const session = await getUserFromSession()
  if (!session) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 })
  if (session.blocked) return NextResponse.json({ ok: false, error: "account_unavailable" }, { status: 403 })

  const role = await getStaffRoleForUser(session.user)
  if (!canManageUpdates(role)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
  }

  const { id } = params
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 })
  }

  const client = await clientPromise
  const db = client.db() // uses the db name from your MONGODB_URI
  const result = await db.collection("productUpdates").findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { active: false } },
    { returnDocument: "after" }
  )

  if (!result?.value && !result) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}