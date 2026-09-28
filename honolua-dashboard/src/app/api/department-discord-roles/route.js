const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN || process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID || process.env.DISCORD_GUILD_ID;

export async function GET() {
  if (!BOT_TOKEN || !GUILD_ID) return Response.json({ error: "Discord roles are not configured." }, { status: 503 });
  const response = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/roles`, {
    headers: { Authorization: `Bot ${BOT_TOKEN}` },
    cache: "no-store",
  });
  if (!response.ok) return Response.json({ error: "Could not load Discord roles." }, { status: response.status });
  const roles = (await response.json())
    .filter((role) => role.id !== GUILD_ID && !role.managed)
    .sort((a, b) => b.position - a.position)
    .map(({ id, name }) => ({ id, name }));
  return Response.json({ roles });
}
