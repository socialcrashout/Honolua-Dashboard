import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import RankLog from '@/model/RankLog';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const guildId = searchParams.get('guildId');
  if (!guildId) return NextResponse.json({ error: 'guildId is required' }, { status: 400 });

  const from = searchParams.get('from');
  const to = searchParams.get('to');

  await dbConnect();

  const match = { guildId };
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }

  const results = await RankLog.aggregate([
    { $match: match },
    { $group: { _id: '$type', count: { $sum: 1 } } },
  ]);

  const counts = { promote: 0, demote: 0, changerank: 0 };
  for (const r of results) counts[r._id] = r.count;

  return NextResponse.json({
    total: counts.promote + counts.demote + counts.changerank,
    promotions: counts.promote,
    demotions: counts.demote,
    rankChanges: counts.changerank,
  });
}