import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { authorizeRankingRequest } from '@/lib/rankingAccess';
import { logStaffAction } from '@/lib/audit';

const GROUP_ID = process.env.ROBLOX_GROUP_ID || process.env.GROUP_ID || '743137138';
const validDiscordRoleId = (value) => /^\d{17,20}$/.test(String(value || ''));

async function fetchGroupRoles() {
  const response = await fetch(`https://groups.roblox.com/v1/groups/${GROUP_ID}/roles`, { next: { revalidate: 300 } });
  if (!response.ok) throw new Error(`Roblox group roles returned ${response.status}.`);
  const data = await response.json();
  return (data.roles || [])
    .map((role) => ({ id: String(role.id), rank: Number(role.rank), name: String(role.name || `Rank ${role.rank}`) }))
    .filter((role) => /^\d+$/.test(role.id) && Number.isInteger(role.rank))
    .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
}

export async function GET(request) {
  const guildId = new URL(request.url).searchParams.get('guildId');
  if (!guildId) return NextResponse.json({ error: 'guildId is required' }, { status: 400 });
  const access = await authorizeRankingRequest(request, guildId);
  if (access.response) return access.response;

  const client = await clientPromise;
  const db = client.db('honolua');
  const [config, departments, groupRolesResult] = await Promise.all([
    db.collection('rolebinds').findOne({ guildId: access.guildId }),
    db.collection('departments').find({ status: 'Active' }, { projection: { name: 1 } }).sort({ name: 1 }).toArray(),
    fetchGroupRoles().then((groupRoles) => ({ groupRoles })).catch((error) => ({ groupRoles: [], groupRolesError: error.message })),
  ]);
  return NextResponse.json({
    groupId: GROUP_ID,
    groupRoles: groupRolesResult.groupRoles,
    groupRolesError: groupRolesResult.groupRolesError || null,
    rankBindings: config?.rankBindings ?? [],
    departmentBindings: config?.departmentBindings ?? [],
    departments: departments.map(({ _id, name }) => ({ id: String(_id), name })),
  });
}

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body || !body.guildId) return NextResponse.json({ error: 'guildId is required' }, { status: 400 });
  const access = await authorizeRankingRequest(request, body.guildId);
  if (access.response) return access.response;
  if (!Array.isArray(body.rankBindings) || !Array.isArray(body.departmentBindings)) {
    return NextResponse.json({ error: 'Both binding lists are required.' }, { status: 400 });
  }

  const rankBindings = body.rankBindings.map((row) => ({
    rankId: String(row?.rankId || '').trim(),
    rank: Number(row?.rank),
    rankName: String(row?.rankName || '').trim().slice(0, 80),
    roleIds: [...new Set((Array.isArray(row?.roleIds) ? row.roleIds : []).map(String).filter(validDiscordRoleId))],
    nicknameTemplate: String(row?.nicknameTemplate || '').trim().slice(0, 80),
    enabled: row?.enabled !== false,
  })).filter((row) => row.rankId || row.rankName || row.roleIds.length);
  const departmentBindings = body.departmentBindings.map((row) => ({
    departmentId: String(row?.departmentId || '').trim(),
    roleId: String(row?.roleId || '').trim(),
  })).filter((row) => row.departmentId || row.roleId);

  const invalidRank = rankBindings.some((row) => !/^\d+$/.test(row.rankId) || !Number.isInteger(row.rank) || row.rank < 0 || row.rank > 255 || !row.rankName || !row.roleIds.length);
  const invalidDepartment = departmentBindings.some((row) => !/^[a-f0-9]{24}$/i.test(row.departmentId) || !validDiscordRoleId(row.roleId));
  if (invalidRank || invalidDepartment) {
    return NextResponse.json({ error: 'Each bind needs a valid Roblox rank and at least one Discord role.' }, { status: 400 });
  }
  if (new Set(rankBindings.map((row) => row.rankId)).size !== rankBindings.length) {
    return NextResponse.json({ error: 'A Roblox rank can only have one bind. Add multiple Discord roles to that bind.' }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db('honolua');
  const previous = await db.collection('rolebinds').findOne({ guildId: access.guildId });
  const previousRankRoleIds = (previous?.rankBindings || []).flatMap((row) => row.roleIds || (row.roleId ? [row.roleId] : []));
  const previousDepartmentRoleIds = (previous?.departmentBindings || []).flatMap((row) => row.roleIds || (row.roleId ? [row.roleId] : []));
  const managedRankRoleIds = [...new Set([...(previous?.managedRankRoleIds || []), ...previousRankRoleIds, ...rankBindings.flatMap((row) => row.roleIds)])];
  const managedDepartmentRoleIds = [...new Set([...(previous?.managedDepartmentRoleIds || []), ...previousDepartmentRoleIds, ...departmentBindings.map((row) => row.roleId)])];
  await db.collection('rolebinds').updateOne(
    { guildId: access.guildId },
    { $set: { guildId: access.guildId, groupId: GROUP_ID, rankBindings, departmentBindings, managedRankRoleIds, managedDepartmentRoleIds, updatedAt: new Date() } },
    { upsert: true },
  );
  await logStaffAction({
    session: { discordId: access.user.id, discordUsername: access.user.username },
    action: 'role_binds_updated',
    meta: { groupId: GROUP_ID, rankBindings, departmentBindings, rankBindingCount: rankBindings.length, departmentBindingCount: departmentBindings.length },
  });
  return NextResponse.json({ ok: true });
}
