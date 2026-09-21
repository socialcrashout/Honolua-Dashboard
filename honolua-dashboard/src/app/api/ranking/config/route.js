import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const guildId = searchParams.get('guildId');
  if (!guildId) return NextResponse.json({ error: 'guildId is required' }, { status: 400 });

  const client = await clientPromise;
  const db = client.db();
  const config = await db.collection('rankingconfigs').findOne({ guildId });

  return NextResponse.json({
    logChannelId: config?.logChannelId ?? null,
    departments: config?.departments ?? [],
  });
}

export async function POST(request) {
  const body = await request.json();
  const { guildId, logChannelId } = body;
  if (!guildId) return NextResponse.json({ error: 'guildId is required' }, { status: 400 });

  const client = await clientPromise;
  const db = client.db();
  await db
    .collection('rankingconfigs')
    .updateOne({ guildId }, { $set: { guildId, logChannelId: logChannelId || null } }, { upsert: true });

  return NextResponse.json({ ok: true });
}