import { getLeavesCollection } from '@/lib/leaves';
import { getSessionUser, isStaff } from '@/lib/loaAuth';
import LeaveClient from './LeaveClient';

const GUILD_ID = process.env.GUILD_ID; // ── ADJUST if you scope guilds differently

export const dynamic = 'force-dynamic'; // this page reflects live approval state

export default async function LeavesPage() {
    const user = await getSessionUser();
    if (!user) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
                Sign in to manage leave.
            </div>
        );
    }

    const leaves = await getLeavesCollection();
    const staff = isStaff(user);
    const now = new Date();

    const [pending, active, history, mine] = await Promise.all([
        staff
            ? leaves.find({ guildId: GUILD_ID, status: 'pending' }).sort({ createdAt: 1 }).toArray()
            : [],
        leaves.find({
            guildId: GUILD_ID, status: 'approved', endedEarly: false,
            startDate: { $lte: now }, endDate: { $gte: now },
        }).sort({ endDate: 1 }).toArray(),
        leaves.find({
            guildId: GUILD_ID,
            $or: [
                { status: 'denied' },
                { status: 'cancelled' },
                { status: 'approved', endedEarly: true },
                { status: 'approved', endDate: { $lt: now } },
            ],
        }).sort({ createdAt: -1 }).limit(50).toArray(),
        leaves.find({ guildId: GUILD_ID, userId: user.id }).sort({ createdAt: -1 }).toArray(),
    ]);

    // ObjectId/Date instances don't survive the server->client boundary as-is.
    const clean = (arr) => JSON.parse(JSON.stringify(arr));

    return (
        <LeaveClient
            user={{ id: user.id, username: user.username, avatar: user.avatar }}
            isStaff={staff}
            pending={clean(pending)}
            active={clean(active)}
            history={clean(history)}
            mine={clean(mine)}
        />
    );
}