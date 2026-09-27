import { NextResponse } from 'next/server';
import { getSessionUser, isStaff } from '@/lib/loaAuth';

const CONFIGURED_GUILD_ID = process.env.GUILD_ID || process.env.DISCORD_GUILD_ID;

export async function authorizeRankingRequest(request, submittedGuildId) {
  const user = await getSessionUser();
  if (!user) return { response: NextResponse.json({ error: 'Sign in to view ranking activity.' }, { status: 401 }) };
  if (!isStaff(user)) return { response: NextResponse.json({ error: 'You do not have access to ranking activity.' }, { status: 403 }) };
  if (!CONFIGURED_GUILD_ID) {
    return { response: NextResponse.json({ error: 'Ranking logs need a Discord guild ID configured.' }, { status: 503 }) };
  }

  const requestedGuildId = submittedGuildId ?? new URL(request.url).searchParams.get('guildId');
  if (requestedGuildId && requestedGuildId !== CONFIGURED_GUILD_ID) {
    return { response: NextResponse.json({ error: 'That server is not available here.' }, { status: 403 }) };
  }

  return { user, guildId: CONFIGURED_GUILD_ID };
}
