'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Check, Clock3, Users, X, ArrowUpRight, CircleCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const REASONS = {
    vacation: 'Vacation', school: 'School', exams: 'Exams', hospital: 'Medical',
    family: 'Family', work: 'Work', break: 'Personal break', other: 'Other',
};
const date = (value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const time = (value) => new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
const duration = (from, to) => Math.max(1, Math.round((new Date(to) - new Date(from)) / 86400000) + 1);

export default function ManageLeavesClient({ pending, active, history }) {
    const router = useRouter();
    const [section, setSection] = useState('requests');
    const [busyId, setBusyId] = useState('');
    const [denialTarget, setDenialTarget] = useState(null);
    const [denialReason, setDenialReason] = useState('');
    const [denialError, setDenialError] = useState('');
    const entries = section === 'requests' ? pending : section === 'active' ? active : history;

    async function decide(id, action, reason) {
        setBusyId(id);
        try {
            const response = await fetch(`/api/leaves/${id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, ...(reason ? { reason } : {}) }),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                if (action === 'deny') setDenialError(data.error || 'Could not deny this leave request.');
                else window.alert(data.error || 'Could not update this leave request.');
                return false;
            }
            if (action === 'deny') {
                setDenialTarget(null);
                setDenialReason('');
                setDenialError('');
            }
            window.dispatchEvent(new Event('loa:changed'));
            router.refresh();
            return true;
        } finally { setBusyId(''); }
    }

    async function submitDenial() {
        const reason = denialReason.trim();
        if (!reason) {
            setDenialError('Add a reason before denying this request.');
            return;
        }
        if (reason.length > 500) {
            setDenialError('Keep the reason to 500 characters or fewer.');
            return;
        }
        await decide(denialTarget._id, 'deny', reason);
    }

    const sections = [
        { id: 'requests', label: 'Requests', count: pending.length },
        { id: 'active', label: 'Currently away', count: active.length },
        { id: 'history', label: 'Past decisions' },
    ];

    return (
        <main className="min-h-screen bg-[#fffaf2] px-5 py-8 text-[#30291f] sm:px-8 lg:px-10">
            <div className="mx-auto max-w-6xl">
                <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-800">
                            <CalendarDays className="h-3.5 w-3.5" /> Leadership · People operations
                        </div>
                        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">Leave management</h1>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">Review time-off requests and keep track of who is away.</p>
                    </div>
                    <div className="rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm text-stone-600 shadow-sm">
                        <span className="font-semibold text-orange-800">{pending.length}</span> {pending.length === 1 ? 'request' : 'requests'} need review
                    </div>
                </header>

                <section className="mb-8 grid gap-3 sm:grid-cols-3" aria-label="Leave overview">
                    <Metric icon={Clock3} label="Awaiting review" value={pending.length} detail="Requests in the queue" />
                    <Metric icon={Users} label="Away today" value={active.length} detail="Approved and currently away" />
                    <Metric icon={CircleCheck} label="Recently resolved" value={history.length} detail="Decisions and completed leave" />
                </section>

                <section className="overflow-hidden rounded-2xl border border-orange-200/80 bg-white shadow-[0_12px_40px_rgba(153,91,30,0.08)]">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-orange-100 bg-gradient-to-r from-orange-50/70 to-white px-5 py-4 sm:px-6">
                        <div>
                            <h2 className="font-semibold">Team leave</h2>
                            <p className="mt-1 text-xs text-stone-500">A clear view of requests and coverage.</p>
                        </div>
                        <div className="flex gap-1 rounded-xl bg-orange-50 p-1" role="tablist" aria-label="Leave sections">
                            {sections.map((item) => (
                                <button key={item.id} role="tab" aria-selected={section === item.id} onClick={() => setSection(item.id)}
                                    className={`rounded-lg px-3 py-2 text-xs font-medium transition sm:text-sm ${section === item.id ? 'bg-white text-orange-950 shadow-sm ring-1 ring-orange-100' : 'text-stone-500 hover:text-orange-900'}`}>
                                    {item.label}{item.count > 0 && <span className="ml-2 rounded-full bg-orange-100 px-1.5 py-0.5 text-[11px] text-orange-900">{item.count}</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="hidden grid-cols-[minmax(180px,1.25fr)_minmax(150px,1fr)_minmax(130px,.8fr)_minmax(150px,1fr)_auto] gap-4 bg-[#fffaf2] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500 md:grid">
                        <span>Team member</span><span>Reason</span><span>Duration</span><span>Dates</span><span className="text-right">Action</span>
                    </div>

                    {entries.length === 0 ? (
                        <div className="px-6 py-16 text-center">
                            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-700"><Check className="h-5 w-5" /></div>
                            <p className="font-medium">{section === 'requests' ? 'All caught up' : section === 'active' ? 'No one is away today' : 'No past leave to show'}</p>
                            <p className="mt-1 text-sm text-stone-500">{section === 'requests' ? 'New requests will appear here.' : 'There are no records in this section yet.'}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-orange-100">
                            {entries.map((leave, index) => (
                                <motion.article key={leave._id}
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.24, delay: Math.min(index * 0.045, 0.27), ease: 'easeOut' }}
                                    className="grid gap-4 px-5 py-5 md:grid-cols-[minmax(180px,1.25fr)_minmax(150px,1fr)_minmax(130px,.8fr)_minmax(150px,1fr)_auto] md:items-center md:px-6">
                                    <MemberIdentity leave={leave} />
                                    <div><p className="text-sm font-medium">{leave.reasonLabel || REASONS[leave.reason] || 'Other'}</p><p className="text-xs text-stone-500 md:hidden">Reason</p></div>
                                    <div><p className="text-sm">{duration(leave.startDate, leave.endDate)} days</p><p className="text-xs text-stone-500">{leave.status === 'pending' ? 'Requested' : leave.endedEarly ? 'Ended early' : leave.status}</p></div>
                                    <div><p className="text-sm">{date(leave.startDate)} · {time(leave.startDate)}</p><p className="text-xs text-stone-500">through {date(leave.endDate)} · {time(leave.endDate)}</p></div>
                                    <div className="flex items-center justify-end gap-2">
                                        {section === 'requests' ? <>
                                            <button aria-label={`Approve ${leave.username}`} disabled={busyId === leave._id} onClick={() => decide(leave._id, 'approve')} className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-700 disabled:opacity-50"><Check className="h-3.5 w-3.5" /> Approve</button>
                                            <button aria-label={`Deny ${leave.username}`} disabled={busyId === leave._id} onClick={() => { setDenialTarget(leave); setDenialReason(''); setDenialError(''); }} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-orange-200 text-stone-500 transition hover:border-orange-400 hover:bg-orange-50 hover:text-orange-900 disabled:opacity-50"><X className="h-4 w-4" /></button>
                                        </> : section === 'active' ? <button disabled={busyId === leave._id} onClick={() => decide(leave._id, 'end')} className="inline-flex items-center gap-1 rounded-lg border border-orange-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-orange-50 disabled:opacity-50">End leave <ArrowUpRight className="h-3.5 w-3.5" /></button> : <Status value={leave.status} />}
                                    </div>
                                    {leave.note && <p className="rounded-lg bg-[#fffaf2] p-3 text-sm text-stone-600 md:col-span-5">“{leave.note}”</p>}
                                    {leave.denialReason && <p className="rounded-lg border border-orange-200 bg-orange-50/70 p-3 text-sm text-orange-950 md:col-span-5"><span className="font-semibold">Denial reason:</span> {leave.denialReason}</p>}
                                </motion.article>
                            ))}
                        </div>
                    )}
                </section>
                <p className="mt-4 text-xs text-stone-500">Dates are shown in your local timezone. Changes take effect immediately.</p>
            </div>
            {denialTarget && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/40 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget && !busyId) setDenialTarget(null); }}>
                    <section role="dialog" aria-modal="true" aria-labelledby="deny-leave-title" className="w-full max-w-md rounded-2xl border border-orange-200 bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-700"><X className="h-5 w-5" /></div>
                        <h2 id="deny-leave-title" className="text-lg font-semibold">Deny leave request?</h2>
                        <p className="mt-1 text-sm text-stone-600">Add a reason for {denialTarget.username || 'this team member'}. They’ll be able to see it in their leave history.</p>
                        <label htmlFor="denial-reason" className="mt-5 block text-sm font-medium text-stone-700">Reason</label>
                        <textarea id="denial-reason" autoFocus maxLength={500} rows={4} value={denialReason} onChange={(event) => { setDenialReason(event.target.value); setDenialError(''); }} placeholder="Explain why this request was denied…" className="mt-2 w-full resize-y rounded-xl border border-orange-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-stone-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                        <div className="mt-1 flex items-center justify-between text-xs text-stone-500"><span>{denialError || 'The reason is saved with this decision.'}</span><span>{denialReason.length}/500</span></div>
                        <div className="mt-5 flex justify-end gap-2">
                            <button type="button" disabled={Boolean(busyId)} onClick={() => setDenialTarget(null)} className="rounded-lg border border-orange-200 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-orange-50 disabled:opacity-50">Cancel</button>
                            <button type="button" disabled={Boolean(busyId)} onClick={submitDenial} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-50">{busyId === denialTarget._id ? 'Denying…' : 'Deny request'}</button>
                        </div>
                    </section>
                </div>
            )}
        </main>
    );
}


function MemberIdentity({ leave }) {
    const [profile, setProfile] = useState({
        avatarUrl: leave.avatar || '',
        robloxUsername: leave.robloxUsername || '',
        loaded: Boolean(leave.avatar && leave.robloxUsername),
    });

    useEffect(() => {
        if (!leave.userId || (leave.avatar && leave.robloxUsername)) return;
        let cancelled = false;
        fetch(`/api/bloxlink/lookup?discordId=${encodeURIComponent(leave.userId)}`)
            .then((response) => response.ok ? response.json() : null)
            .then((data) => {
                if (cancelled) return;
                setProfile((current) => ({
                    avatarUrl: current.avatarUrl || data?.discordAvatarUrl || '',
                    robloxUsername: current.robloxUsername || data?.robloxUsername || '',
                    loaded: true,
                }));
            })
            .catch(() => {
                if (!cancelled) setProfile((current) => ({ ...current, loaded: true }));
            });
        return () => { cancelled = true; };
    }, [leave.userId, leave.avatar, leave.robloxUsername]);

    return (
        <motion.div className="flex min-w-0 items-center gap-3" whileHover={{ y: -1 }} transition={{ type: 'spring', stiffness: 360, damping: 24 }}>
            <motion.div whileHover={{ scale: 1.08, rotate: 2 }} transition={{ type: 'spring', stiffness: 380, damping: 18 }}>
                <Avatar className="h-11 w-11 border border-orange-200 bg-orange-50 shadow-sm">
                    <AvatarImage src={profile.avatarUrl || undefined} alt={`${leave.username || 'Member'} Discord avatar`} />
                    <AvatarFallback className="font-semibold text-orange-800">{leave.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
            </motion.div>
            <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{leave.username || 'Unknown member'}</p>
                <p className="truncate text-xs text-stone-500">
                    {profile.robloxUsername ? `@${profile.robloxUsername}` : profile.loaded ? 'Roblox account not linked' : 'Loading Roblox profile…'}
                </p>
            </div>
        </motion.div>
    );
}

function Metric({ icon: Icon, label, value, detail }) {
    return <div className="rounded-2xl border border-orange-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(153,91,30,0.06)]">
        <div className="flex items-start justify-between"><p className="text-sm font-medium text-stone-600">{label}</p><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-700 ring-1 ring-orange-200"><Icon className="h-4 w-4" /></span></div>
        <p className="mt-4 text-3xl font-semibold tracking-tight text-stone-900">{value}</p><p className="mt-1 text-xs text-stone-500">{detail}</p>
    </div>;
}

function Status({ value }) {
    const label = value === 'denied' ? 'Denied' : value === 'cancelled' ? 'Withdrawn' : 'Completed';
    return <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium capitalize text-orange-900">{label}</span>;
}
