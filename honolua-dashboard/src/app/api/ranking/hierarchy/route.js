import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import RankingConfig from '@/model/RankingConfig';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const guildId = searchParams.get('guildId');
  if (!guildId) return NextResponse.json({ error: 'guildId is required' }, { status: 400 });

  await dbConnect();
  const config = await RankingConfig.findOne({ guildId }).lean();
  return NextResponse.json({ departments: config?.departments ?? [] });
}

/**
 * Full-replace save: the client sends the complete departments array
 * (add/remove/reorder all happen client-side first), we just persist
 * it. Simple, and matches how the settings modal below works.
 *
 * Body: { guildId, departments: [{ name, emoji, roles: [{roleId, name}] }] }
 */
export async function POST(request) {
  const body = await request.json();
  const { guildId, departments } = body;
  if (!guildId) return NextResponse.json({ error: 'guildId is required' }, { status: 400 });
  if (!Array.isArray(departments)) return NextResponse.json({ error: 'departments must be an array' }, { status: 400 });

  await dbConnect();
  await RankingConfig.findOneAndUpdate(
    { guildId },
    { $set: { departments } },
    { upsert: true, setDefaultsOnInsert: true },
  );

  return NextResponse.json({ ok: true });
}