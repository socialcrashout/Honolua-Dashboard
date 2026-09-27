import RankingLogsClient from '@/components/ranking/RankingLogsClient';
import { getSessionUser, isStaff } from '@/lib/loaAuth';

const GUILD_ID = process.env.GUILD_ID || process.env.DISCORD_GUILD_ID;
export const dynamic = 'force-dynamic';

export default async function RankingLogsPage() {
    const user = await getSessionUser();
    if (!user) {
        return <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center px-6 text-stone-500">Sign in to view ranking logs.</div>;
    }
    if (!isStaff(user)) {
        return <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center px-6 text-stone-500">You don’t have access to ranking logs.</div>;
    }
    if (!GUILD_ID) {
        return <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center px-6 text-stone-500">Ranking logs need a Discord guild ID configured.</div>;
    }

    return <RankingLogsClient guildId={GUILD_ID} />;
}
