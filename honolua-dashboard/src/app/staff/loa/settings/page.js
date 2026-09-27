import { getSessionUser, isStaff } from '@/lib/loaAuth';
import { getLoaSettings } from '@/lib/loaSettings';
import LeaveSettingsClient from './SettingsClient';

const GUILD_ID = process.env.GUILD_ID || process.env.DISCORD_GUILD_ID;
export const dynamic = 'force-dynamic';

export default async function LeaveSettingsPage() {
    const user = await getSessionUser();
    if (!user) return <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center px-6 text-stone-500">Sign in to manage leave settings.</div>;
    if (!isStaff(user)) return <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center px-6 text-stone-500">You don’t have access to leave settings.</div>;

    return <LeaveSettingsClient initialSettings={await getLoaSettings(GUILD_ID)} guildId={GUILD_ID || ''} />;
}
