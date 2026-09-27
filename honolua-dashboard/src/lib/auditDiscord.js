import clientPromise from '@/lib/mongodb';

const DB_NAME = 'honolua';
const DEFAULT_EMOJIS = {
  action: '🧭',
  actor: '🪸',
  subject: '🌺',
  details: '📋',
  time: '🕰️',
};

function actionLabel(action) {
  return String(action || 'unknown_action')
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function displayValue(value) {
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === 'object') return JSON.stringify(value);
  return String(value ?? '—');
}

export async function sendAuditDiscordMessage({ action, meta = {}, actor = {}, createdAt = new Date() }) {
  try {
    const token = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN || process.env.BOT_TOKEN;
    if (!token) return;

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const guildId = process.env.GUILD_ID || process.env.DISCORD_GUILD_ID;
    const settings = await db.collection('auditLogSettings').findOne({ guildId });
    if (!settings?.channelId) return;

    const emojis = { ...DEFAULT_EMOJIS, ...(settings.emojis || {}) };
    const actorName = actor.discordUsername || actor.actorDiscordUsername || 'Unknown';
    const subjectId = meta.subjectDiscordId;
    const subjectName = meta.subjectUsername || (subjectId ? `Discord user ${subjectId}` : '—');
    const details = Object.entries(meta)
      .filter(([key]) => !['subjectDiscordId', 'subjectUsername', 'leaveId'].includes(key))
      .slice(0, 10)
      .map(([key, value]) => `**${actionLabel(key)}:** ${displayValue(value).slice(0, 240)}`);
    const recordedAt = Math.floor(new Date(createdAt).getTime() / 1000);
    const when = Number.isFinite(recordedAt) ? recordedAt : Math.floor(Date.now() / 1000);
    const memberLine = `${emojis.subject} **Member:** ${subjectId ? `<@${subjectId}>` : subjectName}${subjectId && subjectName ? ` · ${subjectName}` : ''}`;
    const section = {
      type: 9,
      components: [
        { type: 10, content: `${emojis.action} **${actionLabel(action)}**` },
        { type: 10, content: `${emojis.actor} **Staff:** ${actorName}\n${memberLine}` },
      ],
    };
    if (/^https:\/\//.test(actor.actorAvatarUrl || '')) {
      section.accessory = { type: 11, media: { url: actor.actorAvatarUrl }, description: `${actorName} avatar` };
    }
    const componentList = [
      { type: 10, content: '## Honolua · Audit activity' },
      { type: 14 },
      section,
    ];
    if (details.length) {
      componentList.push({ type: 14 }, { type: 10, content: `${emojis.details} **Activity details**\n${details.join('\n').slice(0, 2500)}` });
    }
    componentList.push(
      { type: 14 },
      { type: 10, content: `${emojis.time} Recorded <t:${when}:F>` },
    );

    const response = await fetch(`https://discord.com/api/v10/channels/${settings.channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        flags: 1 << 15,
        allowed_mentions: { parse: [], users: [], roles: [], replied_user: false },
        components: [{ type: 17, components: componentList }],
      }),
    });
    if (!response.ok) {
      console.error('[audit] Discord post failed:', response.status, (await response.text()).slice(0, 500));
    }
  } catch (error) {
    console.error('[audit] Could not post the audit message to Discord:', error.message);
  }
}

export { DEFAULT_EMOJIS as DEFAULT_AUDIT_EMOJIS };
