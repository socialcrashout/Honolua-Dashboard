import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getSessionUser, isStaff } from '@/lib/loaAuth';
import { logStaffAction } from '@/lib/audit';
import { ObjectId } from 'mongodb';

const DB_NAME = 'honolua';
const GUILD_ID = process.env.GUILD_ID || process.env.DISCORD_GUILD_ID;
const TOKEN = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN || process.env.BOT_TOKEN;

async function authorized() {
  const user = await getSessionUser();
  return user && isStaff(user) ? user : null;
}

export async function GET() {
  const user = await authorized();
  if (!user) return NextResponse.json({ error: 'You do not have access to audit settings.' }, { status: 403 });

  const client = await clientPromise;
  const settings = await client.db(DB_NAME).collection('auditLogSettings').findOne({ guildId: GUILD_ID });
  let channels = [];
  let channelError = null;
  if (TOKEN && GUILD_ID) {
    try {
      const response = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/channels`, {
        headers: { Authorization: `Bot ${TOKEN}` },
        next: { revalidate: 30 },
      });
      if (response.ok) {
        channels = (await response.json())
          .filter((channel) => channel.type === 0 || channel.type === 5)
          .map(({ id, name, type, parent_id: parentId }) => ({ id, name, type, parentId }));
      } else {
        channelError = `Discord could not load channels (${response.status}).`;
      }
    } catch {
      channelError = 'Could not reach Discord to load channels.';
    }
  } else {
    channelError = !TOKEN ? 'The Discord bot token is not configured on the dashboard.' : 'The Discord server is not configured.';
  }

  return NextResponse.json({
    guildId: GUILD_ID || null,
    channels,
    channelError,
    settings: {
      channelId: settings?.channelId || '',
    },
  });
}

export async function PUT(request) {
  const user = await authorized();
  if (!user) return NextResponse.json({ error: 'You do not have access to audit settings.' }, { status: 403 });
  if (!GUILD_ID) return NextResponse.json({ error: 'The Discord server is not configured.' }, { status: 500 });

  const body = await request.json().catch(() => null);
  const channelId = typeof body?.channelId === 'string' ? body.channelId.trim() : '';
  if (channelId && !/^\d{17,20}$/.test(channelId)) {
    return NextResponse.json({ error: 'Choose a valid Discord channel.' }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection('auditLogSettings');
  const existing = await collection.findOne({ guildId: GUILD_ID });
  const set = { guildId: GUILD_ID, channelId, updatedAt: new Date(), updatedBy: user.id };
  if (existing?.channelId !== channelId) {
    const latestLog = await db.collection('staffAuditLog').find({}).sort({ _id: -1 }).limit(1).next();
    set.discordAfterId = latestLog?._id || new ObjectId();
  }
  await collection.updateOne(
    { guildId: GUILD_ID },
    { $set: set, $unset: { emojis: 1 } },
    { upsert: true },
  );
  await logStaffAction({
    session: { discordId: user.id, discordUsername: user.username },
    action: 'audit_settings_updated',
    meta: { channelId: channelId || null },
  });

  return NextResponse.json({ ok: true, settings: { channelId } });
}
