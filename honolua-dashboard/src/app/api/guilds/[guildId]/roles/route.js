const BOT_TOKEN =
  process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN || process.env.BOT_TOKEN;

export async function GET(request, { params }) {
  const { guildId } = params;

  if (!BOT_TOKEN) {
    return Response.json(
      { ok: false, error: "Missing bot token — set DISCORD_BOT_TOKEN in your environment." },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
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

    const roles = raw
      // The @everyone role's id always equals the guild id — the picker
      // already has its own dedicated "Everyone" option, so skip it here.
      .filter((r) => r.id !== guildId && !r.managed)
      .sort((a, b) => b.position - a.position)
      .map((r) => ({
        id: r.id,
        name: r.name,
        color: r.color, // decimal int, e.g. 0 for "no color" — the picker handles this
      }));

    return Response.json({ ok: true, roles });
  } catch (err) {
    console.error("Failed to fetch guild roles", err);
    return Response.json({ ok: false, error: "Failed to reach Discord" }, { status: 502 });
  }
}