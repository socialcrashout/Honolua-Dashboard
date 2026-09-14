const MIN_MANAGE_RANK = 169; // same threshold as workspace/status — adjust if roles should differ

export async function getStaffRoleForUser(user) {
  return user?.workspaceRoleName || null;
}

export function canManageUpdates(session) {
  return (session?.workspaceRank ?? 0) > MIN_MANAGE_RANK;
}