import RankingLogsClient from '@/components/ranking/RankingLogsClient';

/**
 * Route: /dashboard/[guildId]/ranking
 *
 * Adjust the param name if your existing dashboard routes key off
 * something other than `guildId` (e.g. `serverId`) - check how your
 * other pages under src/app/dashboard/ read their guild context and
 * match that instead of hardcoding this.
 */
export default async function RankingPage({ params }) {
  const { guildId } = await params;
  return <RankingLogsClient guildId={guildId} />;
}