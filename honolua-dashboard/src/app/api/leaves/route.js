import { NextResponse } from 'next/server';
import { getLeavesCollection, REASONS } from '@/lib/leaves';
import { getSessionUser, isStaff } from '@/lib/loaAuth';
import { logStaffAction } from '@/lib/audit';
import { getLoaSettings } from '@/lib/loaSettings';

// ── ADJUST if you scope guilds differently ──
const GUILD_ID = process.env.GUILD_ID || process.env.DISCORD_GUILD_ID;
const REASON_LABELS = {
    vacation: 'Vacation', school: 'School', exams: 'Exams', hospital: 'Hospital or medical',
    family: 'Family', work: 'Work', break: 'Taking a break', other: 'Other',
};

export async function GET(request) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

    const leaves = await getLeavesCollection();
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'mine'; // 'mine' | 'pending' | 'active' | 'history'
    const staff = isStaff(user);
    const now = new Date();

    if (scope === 'pending' && !staff) {
        return NextResponse.json({ error: "You don't have permission to view the request queue." }, { status: 403 });
    }

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
    const { reason, note, startDate, endDate, timezoneOffset } = body;

    const loaSettings = await getLoaSettings(GUILD_ID);
    if (!loaSettings.acceptingRequests) {
        return NextResponse.json({ error: 'Leave requests are currently paused.' }, { status: 403 });
    }
    const reasonChoice = [...REASONS.map((id) => ({ id, label: REASON_LABELS[id] })), ...loaSettings.customReasons]
        .find((choice) => choice.id === reason);
    if (!reasonChoice) {
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
    const offset = Number.isInteger(timezoneOffset) && Math.abs(timezoneOffset) <= 840 ? timezoneOffset : 0;
    const localStart = new Date(start.getTime() - offset * 60000);
    const localEnd = new Date(end.getTime() - offset * 60000);
    const startDay = Date.UTC(localStart.getUTCFullYear(), localStart.getUTCMonth(), localStart.getUTCDate());
    const endDay = Date.UTC(localEnd.getUTCFullYear(), localEnd.getUTCMonth(), localEnd.getUTCDate());
    const requestedDays = Math.floor((endDay - startDay) / 86400000) + 1;
    if (requestedDays < loaSettings.minDays || requestedDays > loaSettings.maxDays) {
        return NextResponse.json({ error: `Requests must be between ${loaSettings.minDays} and ${loaSettings.maxDays} days.` }, { status: 400 });
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
        reasonLabel: reasonChoice.label,
        note: note?.slice(0, 500) || '',
        startDate: start,
        endDate: end,
        status: 'pending',
        endedEarly: false,
        createdAt: now,
        updatedAt: now,
    };

    const result = await leaves.insertOne(doc);
    await logStaffAction({
        session: { discordId: user.id, discordUsername: user.username },
        action: 'leave_requested',
        meta: {
            leaveId: String(result.insertedId),
            subjectDiscordId: user.id,
            subjectUsername: user.username,
            reason,
            reasonLabel: reasonChoice.label,
            startDate: start,
            endDate: end,
        },
    });
    return NextResponse.json({ leave: { ...doc, _id: result.insertedId } }, { status: 201 });
}
