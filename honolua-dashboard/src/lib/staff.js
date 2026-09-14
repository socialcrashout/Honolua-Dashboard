// lib/staff.js
const MIN_MANAGE_RANK = 169; // same threshold as workspace/status

export async function getStaffRoleForUser(user) {
  return user?.workspaceRank ?? 0;
}

export function canManageUpdates(rank) {
  return (rank ?? 0) > MIN_MANAGE_RANK;
}