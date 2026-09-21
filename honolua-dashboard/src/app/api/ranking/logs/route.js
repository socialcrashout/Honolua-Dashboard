import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import RankLog from '@/model/RankLog';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const guildId = searchParams.get('guildId');
  if (!guildId) return NextResponse.json({ error: 'guildId is required' }, { status: 400 });

  const q = searchParams.get('q')?.trim();
  const type = searchParams.get('type'); // 'promote' | 'demote' | 'changerank' | null (= all)
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)));

  await dbConnect();

  const filter = { guildId };
  if (type && type !== 'all') filter.type = type;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  if (q) {
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { targetTag: regex },
      { actorTag: regex },
      { 'oldRoles': regex },
      { 'newRoles': regex },
      { department: regex },
    ];
  }

  const [logs, total] = await Promise.all([
    RankLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    RankLog.countDocuments(filter),
  ]);

  return NextResponse.json({
    logs,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
}