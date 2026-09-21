import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const guildId = searchParams.get('guildId');
  if (!guildId) return NextResponse.json({ error: 'guildId is required' }, { status: 400 });

  const client = await clientPromise;
  const db = client.db();
  const config = await db.collection('rankingconfigs').findOne({ guildId });

  return NextResponse.json({ departments: config?.departments ?? [] });
}

/**
 * Full-replace save: the client sends the complete departments array
 * (add/remove/reorder all happen client-side first), we just persist it.
 *
 * Body: { guildId, departments: [{ name, emoji, roles: [{roleId, name}] }] }
 */
export async function POST(request) {
  const body = await request.json();
  const { guildId, departments } = body;
  if (!guildId) return NextResponse.json({ error: 'guildId is required' }, { status: 400 });
  if (!Array.isArray(departments)) return NextResponse.json({ error: 'departments must be an array' }, { status: 400 });

  const client = await clientPromise;
  const db = client.db();
  await db.collection('rankingconfigs').updateOne({ guildId }, { $set: { guildId, departments } }, { upsert: true });

  return NextResponse.json({ ok: true });
}