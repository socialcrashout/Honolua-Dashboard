import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { authorizeRankingRequest } from '@/lib/rankingAccess';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const guildId = searchParams.get('guildId');
  if (!guildId) return NextResponse.json({ error: 'guildId is required' }, { status: 400 });
  const access = await authorizeRankingRequest(request, guildId);
  if (access.response) return access.response;

  const client = await clientPromise;
  const db = client.db();
  const config = await db.collection('rankingconfigs').findOne({ guildId });

  return NextResponse.json({
    logChannelId: config?.logChannelId ?? null,
    departments: config?.departments ?? [],
  });
}

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  const { guildId, logChannelId } = body;
  if (!guildId) return NextResponse.json({ error: 'guildId is required' }, { status: 400 });
  const access = await authorizeRankingRequest(request, guildId);
  if (access.response) return access.response;
  if (logChannelId && !/^\d{17,20}$/.test(logChannelId)) {
    return NextResponse.json({ error: 'Choose a valid Discord channel.' }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();
  await db
    .collection('rankingconfigs')
    .updateOne({ guildId: access.guildId }, { $set: { guildId: access.guildId, logChannelId: logChannelId || null } }, { upsert: true });

  return NextResponse.json({ ok: true });
}
