// Guessed shape: session.user.role is a string like "owner", "admin", "staff", or "member".
// If your app stores roles differently (e.g. a separate staff collection, or a list of
// Discord IDs), swap out getStaffRoleForUser's body below — everything else stays the same.

const CAN_MANAGE_UPDATES = new Set(["owner", "admin", "staff"])

export async function getStaffRoleForUser(user) {
  return user?.role || null
}

export function canManageUpdates(role) {
  return CAN_MANAGE_UPDATES.has(role)
}