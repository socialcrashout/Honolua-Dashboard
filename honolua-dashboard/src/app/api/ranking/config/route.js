import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import RankingConfig from '@/model/RankingConfig';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const guildId = searchParams.get('guildId');
  if (!guildId) return NextResponse.json({ error: 'guildId is required' }, { status: 400 });

  await dbConnect();
  const config = await RankingConfig.findOne({ guildId }).lean();

  return NextResponse.json({
    logChannelId: config?.logChannelId ?? null,
    departments: config?.departments ?? [],
  });
}

export async function POST(request) {
  const body = await request.json();
  const { guildId, logChannelId } = body;
  if (!guildId) return NextResponse.json({ error: 'guildId is required' }, { status: 400 });

  await dbConnect();
  await RankingConfig.findOneAndUpdate(
    { guildId },
    { $set: { logChannelId: logChannelId || null } },
    { upsert: true, setDefaultsOnInsert: true },
  );

  return NextResponse.json({ ok: true });
}