import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getSessionUser, isStaff } from '@/lib/loaAuth';
import { DEFAULT_LOA_SETTINGS, getLoaSettings } from '@/lib/loaSettings';
import { logStaffAction } from '@/lib/audit';

const GUILD_ID = process.env.GUILD_ID || process.env.DISCORD_GUILD_ID;

export async function GET() {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
    return NextResponse.json({ settings: await getLoaSettings(GUILD_ID) });
}

export async function PUT(request) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
    if (!isStaff(user)) return NextResponse.json({ error: "You don't have permission to change leave settings." }, { status: 403 });

    const body = await request.json().catch(() => null);
    const settings = body?.settings;
    if (!settings || typeof settings.acceptingRequests !== 'boolean') {
        return NextResponse.json({ error: 'Invalid leave settings.' }, { status: 400 });
    }
    const minDays = Number(settings.minDays);
    const maxDays = Number(settings.maxDays);
    if (!Number.isInteger(minDays) || !Number.isInteger(maxDays) || minDays < 1 || maxDays > 365 || minDays > maxDays) {
        return NextResponse.json({ error: 'Choose a valid leave length between 1 and 365 days.' }, { status: 400 });
    }
    const discordRoleId = typeof settings.discordRoleId === 'string' ? settings.discordRoleId.trim() : '';
    if (discordRoleId && !/^\d{17,20}$/.test(discordRoleId)) {
        return NextResponse.json({ error: 'Choose a valid Discord role.' }, { status: 400 });
    }
    if (!Array.isArray(settings.customReasons) || settings.customReasons.length > 8) {
        return NextResponse.json({ error: 'Add up to 8 custom reasons.' }, { status: 400 });
    }
    const seen = new Set();
    const customReasons = [];
    for (const reason of settings.customReasons) {
        const id = typeof reason?.id === 'string' ? reason.id.trim() : '';
        const label = typeof reason?.label === 'string' ? reason.label.trim() : '';
        if (!/^[a-z0-9_-]{1,40}$/.test(id) || !label || label.length > 40 || seen.has(id)) {
            return NextResponse.json({ error: 'Each custom reason needs a unique name of 1–40 characters.' }, { status: 400 });
        }
        seen.add(id);
        customReasons.push({ id, label });
    }

    const nextSettings = {
        acceptingRequests: settings.acceptingRequests,
        minDays,
        maxDays,
        discordRoleId,
        customReasons,
        guildId: GUILD_ID,
        updatedAt: new Date(),
        updatedBy: user.id,
    };
    const client = await clientPromise;
    await client.db().collection('loaSettings').updateOne(
        { guildId: GUILD_ID },
        { $set: nextSettings, $setOnInsert: { createdAt: new Date() } },
        { upsert: true },
    );
    await logStaffAction({
        session: { discordId: user.id, discordUsername: user.username },
        action: 'loa_settings_updated',
        meta: {
            acceptingRequests: nextSettings.acceptingRequests,
            minDays,
            maxDays,
            discordRoleId: discordRoleId || null,
            customReasonCount: customReasons.length,
        },
    });
    return NextResponse.json({ settings: { ...DEFAULT_LOA_SETTINGS, ...nextSettings } });
}
