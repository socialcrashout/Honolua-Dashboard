import { getLeavesCollection } from '@/lib/leaves';
import { getSessionUser, isStaff } from '@/lib/loaAuth';
import ManageLeavesClient from './ManageLeavesClient';

const GUILD_ID = process.env.GUILD_ID || process.env.DISCORD_GUILD_ID;
export const dynamic = 'force-dynamic';

export default async function ManageLeavesPage() {
    const user = await getSessionUser();
    if (!user) {
        return <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center px-6 text-slate-500">Sign in to manage leave.</div>;
    }
    if (!isStaff(user)) {
        return <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center px-6 text-slate-500">You don’t have access to leave management.</div>;
    }

    const leaves = await getLeavesCollection();
    const now = new Date();
    const [pending, active, history] = await Promise.all([
        leaves.find({ guildId: GUILD_ID, status: 'pending' }).sort({ createdAt: 1 }).toArray(),
        leaves.find({ guildId: GUILD_ID, status: 'approved', endedEarly: false, startDate: { $lte: now }, endDate: { $gte: now } }).sort({ endDate: 1 }).toArray(),
        leaves.find({ guildId: GUILD_ID, $or: [
            { status: 'denied' }, { status: 'cancelled' },
            { status: 'approved', endedEarly: true }, { status: 'approved', endDate: { $lt: now } },
        ] }).sort({ createdAt: -1 }).limit(100).toArray(),
    ]);
    const clean = (items) => JSON.parse(JSON.stringify(items));
    return <ManageLeavesClient pending={clean(pending)} active={clean(active)} history={clean(history)} />;
}
