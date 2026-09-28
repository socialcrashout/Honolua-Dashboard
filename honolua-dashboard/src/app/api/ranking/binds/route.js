import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { authorizeRankingRequest } from '@/lib/rankingAccess';
import { logStaffAction } from '@/lib/audit';

const validRoleId = (value) => /^\d{17,20}$/.test(String(value || ''));

export async function GET(request) {
  const guildId = new URL(request.url).searchParams.get('guildId');
  if (!guildId) return NextResponse.json({ error: 'guildId is required' }, { status: 400 });
  const access = await authorizeRankingRequest(request, guildId);
  if (access.response) return access.response;

  const client = await clientPromise;
  const db = client.db('honolua');
  const [config, departments] = await Promise.all([
    db.collection('rolebinds').findOne({ guildId: access.guildId }),
    db.collection('departments').find({ status: 'Active' }, { projection: { name: 1 } }).sort({ name: 1 }).toArray(),
  ]);
  return NextResponse.json({
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

  const cleanBindings = (rows, key) => rows.map((row) => ({
    [key]: String(row?.[key] || '').trim().slice(0, 80),
    roleId: String(row?.roleId || '').trim(),
  }));
  const rankBindings = cleanBindings(body.rankBindings, 'rankName').filter((row) => row.rankName || row.roleId);
  const departmentBindings = cleanBindings(body.departmentBindings, 'departmentId').filter((row) => row.departmentId || row.roleId);
  const invalid = [...rankBindings, ...departmentBindings].some((row) => {
    const name = row.rankName ?? row.departmentId;
    return !name || !validRoleId(row.roleId) || (row.departmentId && !/^[a-f0-9]{24}$/i.test(row.departmentId));
  });
  if (invalid) return NextResponse.json({ error: 'Every saved bind needs a name and valid Discord role.' }, { status: 400 });

  const client = await clientPromise;
  const db = client.db('honolua');
  const previous = await db.collection('rolebinds').findOne({ guildId: access.guildId });
  const managedRankRoleIds = [...new Set([...(previous?.managedRankRoleIds || []), ...rankBindings.map((row) => row.roleId)])];
  const managedDepartmentRoleIds = [...new Set([...(previous?.managedDepartmentRoleIds || []), ...departmentBindings.map((row) => row.roleId)])];
  await db.collection('rolebinds').updateOne(
    { guildId: access.guildId },
    { $set: { guildId: access.guildId, rankBindings, departmentBindings, managedRankRoleIds, managedDepartmentRoleIds, updatedAt: new Date() } },
    { upsert: true },
  );
  await logStaffAction({
    session: { discordId: access.user.id, discordUsername: access.user.username },
    action: 'role_binds_updated',
    meta: {
      rankBindings,
      departmentBindings,
      rankBindingCount: rankBindings.length,
      departmentBindingCount: departmentBindings.length,
    },
  });
  return NextResponse.json({ ok: true });
}
