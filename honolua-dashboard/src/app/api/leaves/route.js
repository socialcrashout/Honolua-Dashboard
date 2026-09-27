import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb'; // swap for your existing db helper if you have one
import Leave, { REASONS } from '@/model/Leave';
import { getSessionUser, isStaff } from '@/lib/loaAuth';

// ── ADJUST THIS ────────────────────────────────────────────────────────
// Every guild-scoped query needs the Discord server id. If your dashboard
// already tracks "the current guild" some other way (a param, a cookie,
// a single-guild env var), swap this for that instead.
const GUILD_ID = process.env.GUILD_ID;

export async function GET(request) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'mine'; // 'mine' | 'pending' | 'active' | 'history'
    const staff = isStaff(user);
    const now = new Date();

    let query = { guildId: GUILD_ID };

    if (scope === 'mine' || !staff) {
        query.userId = user.id;
    } else if (scope === 'pending') {
        query.status = 'pending';
    } else if (scope === 'active') {
        query.status = 'approved';
        query.endedEarly = false;
        query.startDate = { $lte: now };
        query.endDate = { $gte: now };
    } else if (scope === 'history') {
        query.$or = [
            { status: 'denied' },
            { status: 'cancelled' },
            { status: 'approved', endedEarly: true },
            { status: 'approved', endDate: { $lt: now } },
        ];
    }

    const leaves = await Leave.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ leaves });
}

export async function POST(request) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

    const body = await request.json();
    const { reason, note, startDate, endDate } = body;

    if (!REASONS.includes(reason)) {
        return NextResponse.json({ error: 'Pick a valid reason.' }, { status: 400 });
    }
    if (!startDate || !endDate) {
        return NextResponse.json({ error: 'First and last day away are required.' }, { status: 400 });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
        return NextResponse.json({ error: "Last day can't be before the first day." }, { status: 400 });
    }

    await dbConnect();

    const leave = await Leave.create({
        guildId: GUILD_ID,
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        reason,
        note: note?.slice(0, 500) || '',
        startDate: start,
        endDate: end,
        status: 'pending',
    });

    return NextResponse.json({ leave }, { status: 201 });
}