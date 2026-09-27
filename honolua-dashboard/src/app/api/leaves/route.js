import { NextResponse } from 'next/server';
import { getLeavesCollection, REASONS } from '@/lib/leaves';
import { getSessionUser, isStaff } from '@/lib/loaAuth';

// ── ADJUST if you scope guilds differently ──
const GUILD_ID = process.env.GUILD_ID;

export async function GET(request) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

    const leaves = await getLeavesCollection();
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'mine'; // 'mine' | 'pending' | 'active' | 'history'
    const staff = isStaff(user);
    const now = new Date();

    let query = { guildId: GUILD_ID };
    let sort = { createdAt: -1 };
    let limit = 0;

    if (scope === 'mine' || !staff) {
        query.userId = user.id;
    } else if (scope === 'pending') {
        query.status = 'pending';
        sort = { createdAt: 1 };
    } else if (scope === 'active') {
        query.status = 'approved';
        query.endedEarly = false;
        query.startDate = { $lte: now };
        query.endDate = { $gte: now };
        sort = { endDate: 1 };
    } else if (scope === 'history') {
        query.$or = [
            { status: 'denied' },
            { status: 'cancelled' },
            { status: 'approved', endedEarly: true },
            { status: 'approved', endDate: { $lt: now } },
        ];
        limit = 50;
    }

    const docs = await leaves.find(query).sort(sort).limit(limit).toArray();
    return NextResponse.json({ leaves: docs });
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

    const leaves = await getLeavesCollection();
    const now = new Date();
    const doc = {
        guildId: GUILD_ID,
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        robloxUsername: user.robloxUsername || null,
        reason,
        note: note?.slice(0, 500) || '',
        startDate: start,
        endDate: end,
        status: 'pending',
        endedEarly: false,
        createdAt: now,
        updatedAt: now,
    };

    const result = await leaves.insertOne(doc);
    return NextResponse.json({ leave: { ...doc, _id: result.insertedId } }, { status: 201 });
}