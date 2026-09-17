const BOT_TOKEN =
  process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN || process.env.BOT_TOKEN;

// Category channels (type 4) so we can attach a readable parentName to
// each channel instead of just a parent_id.
function buildCategoryNameMap(rawChannels) {
  const map = new Map();
  for (const c of rawChannels) {
    if (c.type === 4) map.set(c.id, c.name);
  }
  return map;
}

export async function GET(request, { params }) {
  const { guildId } = params;

  if (!BOT_TOKEN) {
    return Response.json(
      { ok: false, error: "Missing bot token — set DISCORD_BOT_TOKEN in your environment." },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
      // Channels don't change every second — a light cache keeps this
      // snappy without hammering Discord's rate limits.
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return Response.json(
        { ok: false, error: `Discord API responded ${res.status}`, detail: text.slice(0, 300) },
        { status: res.status }
      );
    }

    const raw = await res.json();
    const categoryNames = buildCategoryNameMap(raw);

    const channels = raw
      .filter((c) => c.type !== 4) // drop categories themselves from the list
      .sort((a, b) => a.position - b.position)
      .map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        parentId: c.parent_id || null,
        parentName: c.parent_id ? categoryNames.get(c.parent_id) || null : null,
      }));

    return Response.json({ ok: true, channels });
  } catch (err) {
    console.error("Failed to fetch guild channels", err);
    return Response.json({ ok: false, error: "Failed to reach Discord" }, { status: 502 });
  }
}