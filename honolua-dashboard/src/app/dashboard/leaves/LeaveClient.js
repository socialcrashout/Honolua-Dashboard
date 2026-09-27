'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const REASONS = [
    { id: 'vacation', label: 'Vacation' },
    { id: 'school', label: 'School' },
    { id: 'exams', label: 'Exams' },
    { id: 'hospital', label: 'Hospital or medical' },
    { id: 'family', label: 'Family' },
    { id: 'work', label: 'Work' },
    { id: 'break', label: 'Taking a break' },
    { id: 'other', label: 'Other' },
];
const REASON_LABEL = Object.fromEntries(REASONS.map(r => [r.id, r.label]));

function fmt(d) {
    return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function fmtTime(d) {
    return new Date(d).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function daysAway(start, end) {
    const from = new Date(start);
    const to = new Date(end);
    const firstDay = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
    const lastDay = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
    return Math.max(1, Math.round((lastDay - firstDay) / 86400000) + 1);
}

// The one deliberate motion moment on this page — everything else only
// animates in response to a click.
function useCountUp(value, duration = 700) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        let raf;
        const start = performance.now();
        const tick = (now) => {
            const p = Math.min(1, (now - start) / duration);
            setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [value, duration]);
    return display;
}

export default function LeaveClient({ user, isStaff, personalOnly = false, pending, active, history, mine }) {
    const router = useRouter();
    const [tab, setTab] = useState(isStaff ? 'requests' : personalOnly ? 'current' : 'mine');
    const [showForm, setShowForm] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [denialTarget, setDenialTarget] = useState(null);
    const [denialReason, setDenialReason] = useState('');
    const [denialError, setDenialError] = useState('');
    const [revealed, setRevealed] = useState(false);
    const countAway = useCountUp(active.length);
    const now = new Date();
    const currentMine = mine.filter(item =>
        item.status === 'pending' ||
        (item.status === 'approved' && !item.endedEarly && new Date(item.endDate) >= now)
    );
    const pastMine = mine.filter(item => !currentMine.includes(item));
    const pendingMineCount = currentMine.filter(item => item.status === 'pending').length;
    const approvedMineCount = currentMine.length - pendingMineCount;

    useEffect(() => {
        const t = requestAnimationFrame(() => setRevealed(true));
        return () => cancelAnimationFrame(t);
    }, []);

    const tabs = personalOnly
        ? [
            { id: 'current', label: 'Current requests', count: currentMine.length },
            { id: 'history', label: 'Past leave', count: pastMine.length },
        ]
        : isStaff
            ? [
                { id: 'requests', label: 'Waiting for you', count: pending.length },
                { id: 'away', label: 'Away now', count: active.length },
                { id: 'history', label: 'History' },
                { id: 'mine', label: 'My leave' },
            ]
            : [
                { id: 'mine', label: 'My leave' },
                { id: 'away', label: 'Away now', count: active.length },
            ];

    async function act(id, action, reason) {
        setBusyId(id);
        try {
            const res = await fetch(`/api/leaves/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, ...(reason ? { reason } : {}) }),
            });
            if (!res.ok) {
                const { error } = await res.json().catch(() => ({}));
                alert(error || 'Something went wrong.');
            } else {
                if (action === 'deny') {
                    setDenialTarget(null);
                    setDenialReason('');
                    setDenialError('');
                }
                window.dispatchEvent(new Event('loa:changed'));
                router.refresh();
            }
        } finally {
            setBusyId(null);
        }
    }

    async function submitDenial() {
        const reason = denialReason.trim();
        if (!reason) return setDenialError('Add a reason before denying this request.');
        if (reason.length > 500) return setDenialError('Keep the reason to 500 characters or fewer.');
        await act(denialTarget._id, 'deny', reason);
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Hero */}
            <div className={`relative overflow-hidden border-b border-border ${personalOnly ? 'px-5 py-8 sm:px-8 sm:py-10' : 'px-8 py-14'}`}>
                <div
                    aria-hidden
                    className="animate-drift pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full opacity-25 blur-3xl"
                    style={{ background: 'radial-gradient(circle at 30% 30%, var(--color-gold), var(--color-hibiscus) 60%, transparent 70%)' }}
                />
                <div className={`fade-in relative flex flex-wrap items-end justify-between gap-6 ${revealed ? 'fade-in-visible' : ''}`}>
                    <div>
                        <p className="font-medium text-hibiscus">Honolua</p>
                        <h1 className="mt-1 font-serif text-4xl tracking-tight text-foreground">
                            {personalOnly
                                ? 'Your leave, at a glance'
                                : countAway === 0 ? 'Everyone is here today' : `${countAway} ${countAway === 1 ? 'person is' : 'people are'} away today`}
                        </h1>
                        <p className="mt-2 max-w-md text-muted-foreground">
                            {personalOnly
                                ? 'Keep track of your requests, approvals, and past leave.'
                                : "Request time off, or review what's waiting on you."}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowForm(s => !s)}
                        className="rounded-full bg-gradient-to-br from-gold to-hibiscus px-6 py-3 font-medium text-reef-navy-deep shadow-sm transition hover:shadow-md active:scale-[0.98]"
                    >
                        {showForm ? 'Close' : 'Request leave'}
                    </button>
                </div>

                <RequestPanel open={showForm} onClose={() => setShowForm(false)} onSubmitted={() => { setShowForm(false); router.refresh(); }} />
            </div>

            {personalOnly && (
                <div className="grid gap-3 border-b border-border px-5 py-5 sm:grid-cols-3 sm:px-8">
                    <PersonalMetric label="Waiting for review" value={pendingMineCount} detail="Your pending requests" />
                    <PersonalMetric label="Approved" value={approvedMineCount} detail="Upcoming or active leave" />
                    <PersonalMetric label="Past leave" value={pastMine.length} detail="Completed or closed requests" />
                </div>
            )}

            {/* Tabs */}
            <div className="sticky top-0 z-10 flex gap-1 border-b border-border bg-background/90 px-5 backdrop-blur sm:px-8">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`relative px-4 py-4 text-sm font-medium transition-colors ${tab === t.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {t.label}
                        {typeof t.count === 'number' && t.count > 0 && (
                            <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-xs text-reef-navy-deep">{t.count}</span>
                        )}
                        {tab === t.id && <span className="absolute inset-x-4 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-gold to-hibiscus" />}
                    </button>
                ))}
            </div>

            <div className={personalOnly ? 'px-5 py-6 sm:px-8 sm:py-8' : 'px-8 py-10'}>
                {personalOnly && tab === 'current' && (
                    <PersonalLeaveList
                        items={currentMine}
                        emptyTitle="Nothing in progress"
                        emptyText="Your pending and approved leave requests will appear here."
                        onCancel={id => act(id, 'cancel')}
                        busyId={busyId}
                    />
                )}
                {personalOnly && tab === 'history' && (
                    <PersonalLeaveList
                        items={pastMine}
                        emptyTitle="No past leave yet"
                        emptyText="Completed, denied, and withdrawn requests will be saved here."
                    />
                )}
                {!personalOnly && tab === 'requests' && (
                    <RequestQueue items={pending} busyId={busyId} onApprove={id => act(id, 'approve')} onDeny={id => { const leave = pending.find(item => item._id === id); setDenialTarget(leave); setDenialReason(''); setDenialError(''); }} />
                )}
                {!personalOnly && tab === 'away' && <AwayChips items={active} busyId={busyId} isStaff={isStaff} onEnd={id => act(id, 'end')} />}
                {!personalOnly && tab === 'history' && <HistoryTimeline items={history} />}
                {!personalOnly && tab === 'mine' && (
                    <HistoryTimeline
                        items={mine}
                        empty="You haven't requested any leave yet."
                        onCancel={id => act(id, 'cancel')}
                        busyId={busyId}
                    />
                )}
            </div>
            {denialTarget && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget && !busyId) setDenialTarget(null); }}>
                    <section role="dialog" aria-modal="true" aria-labelledby="leave-denial-title" className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl">
                        <h2 id="leave-denial-title" className="text-lg font-semibold text-foreground">Deny leave request?</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Add a reason for {denialTarget.username || 'this team member'}. They can read it in their leave history.</p>
                        <label htmlFor="leave-denial-reason" className="mt-5 block text-sm font-medium text-foreground">Reason</label>
                        <textarea id="leave-denial-reason" autoFocus maxLength={500} rows={4} value={denialReason} onChange={event => { setDenialReason(event.target.value); setDenialError(''); }} placeholder="Explain why this request was denied…" className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-gold/40" />
                        <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>{denialError || 'This reason is saved with the decision.'}</span><span>{denialReason.length}/500</span></div>
                        <div className="mt-5 flex justify-end gap-2">
                            <button type="button" disabled={Boolean(busyId)} onClick={() => setDenialTarget(null)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-sand/50 disabled:opacity-50">Cancel</button>
                            <button type="button" disabled={Boolean(busyId)} onClick={submitDenial} className="rounded-lg bg-hibiscus px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">{busyId === denialTarget._id ? 'Denying…' : 'Deny request'}</button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}


function PersonalMetric({ label, value, detail }) {
    return (
        <div className="rounded-2xl border border-border bg-background/80 px-5 py-4 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
    );
}

function PersonalLeaveList({ items, emptyTitle, emptyText, onCancel, busyId }) {
    if (!items.length) {
        return (
            <div className="rounded-2xl border border-dashed border-border bg-background/70 px-6 py-14 text-center">
                <p className="font-medium text-foreground">{emptyTitle}</p>
                <p className="mt-1 text-sm text-muted-foreground">{emptyText}</p>
            </div>
        );
    }

    return (
        <div className="mx-auto flex max-w-5xl flex-col gap-3">
            {items.map(item => (
                <article key={item._id} className="rounded-2xl border border-border bg-background/85 p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dotColor(item)}`} />
                            <div className="min-w-0">
                                <h3 className="font-semibold text-foreground">
                                    {item.reasonLabel || REASON_LABEL[item.reason] || 'Leave'}
                                    <span className="ml-2 font-normal text-muted-foreground">{fmt(item.startDate)} – {fmt(item.endDate)}</span>
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground">{outcomeText(item)} · {daysAway(item.startDate, item.endDate)} {daysAway(item.startDate, item.endDate) === 1 ? 'day' : 'days'}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{fmt(item.startDate)} at {fmtTime(item.startDate)} – {fmt(item.endDate)} at {fmtTime(item.endDate)}</p>
                            </div>
                        </div>
                        {onCancel && item.status === 'pending' && (
                            <button
                                disabled={busyId === item._id}
                                onClick={() => onCancel(item._id)}
                                className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-sand/60 hover:text-foreground disabled:opacity-50"
                            >
                                Withdraw request
                            </button>
                        )}
                    </div>
                    {item.note && <p className="mt-4 rounded-xl bg-sand/45 px-4 py-3 text-sm leading-6 text-muted-foreground">{item.note}</p>}
                    {item.denialReason && <p className="mt-3 text-sm text-hibiscus">Reason: {item.denialReason}</p>}
                </article>
            ))}
        </div>
    );
}

function RequestPanel({ open, onClose, onSubmitted }) {
    const [reason, setReason] = useState('vacation');
    const [note, setNote] = useState('');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [customReasons, setCustomReasons] = useState([]);
    const [acceptingRequests, setAcceptingRequests] = useState(true);
    const [requestLimits, setRequestLimits] = useState({ minDays: 1, maxDays: 30 });
    const panelRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        fetch('/api/loa-settings', { cache: 'no-store' })
            .then(response => response.ok ? response.json() : null)
            .then(data => {
                if (cancelled || !data?.settings) return;
                setCustomReasons(data.settings.customReasons || []);
                setAcceptingRequests(data.settings.acceptingRequests !== false);
                setRequestLimits({ minDays: data.settings.minDays || 1, maxDays: data.settings.maxDays || 30 });
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [open]);

    async function submit(e) {
        e.preventDefault();
        setError('');
        if (!start || !end) return setError('Pick your first and last day away.');
        const startAt = new Date(`${start}T${startTime}`);
        const endAt = new Date(`${end}T${endTime}`);
        if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) return setError('The end date and time must be after the start.');
        setSubmitting(true);
        try {
            const res = await fetch('/api/leaves', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason, note, startDate: startAt.toISOString(), endDate: endAt.toISOString(), startLocalDate: start, endLocalDate: end, timezoneOffset: new Date().getTimezoneOffset() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Could not send that request.');
            setNote(''); setStart(''); setEnd(''); setStartTime('09:00'); setEndTime('17:00');
            onSubmitted();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div
            ref={panelRef}
            className="relative mt-8 grid overflow-hidden rounded-2xl border border-border bg-sand/40 transition-[grid-template-rows] duration-300 ease-out"
            style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
        >
            <div className="min-h-0">
                <form onSubmit={submit} className="flex flex-col gap-5 p-6">
                    {!acceptingRequests && <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">Leave requests are temporarily paused.</div>}
                    <div>
                        <p className="mb-2 text-sm font-medium text-foreground">Why are you away?</p>
                        <div className="flex flex-wrap gap-2">
                            {[...REASONS, ...customReasons].map(r => (
                                <button
                                    type="button"
                                    key={r.id}
                                    onClick={() => setReason(r.id)}
                                    className={`rounded-full border px-3 py-1.5 text-sm transition ${reason === r.id ? 'border-transparent bg-gradient-to-br from-gold to-hibiscus text-reef-navy-deep' : 'border-border text-muted-foreground hover:border-hibiscus/40'}`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <label className="text-sm">
                        <span className="mb-1 block font-medium text-foreground">Anything to add — optional</span>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            rows={2}
                            className="w-full rounded-lg border border-input bg-background p-3 text-sm outline-none focus:border-hibiscus"
                            placeholder="Anything staff should know."
                        />
                    </label>

                    <div className="flex flex-wrap gap-4">
                        <label className="text-sm">
                            <span className="mb-1 block font-medium text-foreground">First day away</span>
                            <input type="date" value={start} onChange={e => setStart(e.target.value)}
                                className="rounded-lg border border-input bg-background p-2 text-sm outline-none focus:border-hibiscus" />
                        </label>
                        <label className="text-sm">
                            <span className="mb-1 block font-medium text-foreground">Start time</span>
                            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                                className="rounded-lg border border-input bg-background p-2 text-sm outline-none focus:border-hibiscus" />
                        </label>
                        <label className="text-sm">
                            <span className="mb-1 block font-medium text-foreground">Last day away</span>
                            <input type="date" value={end} onChange={e => setEnd(e.target.value)}
                                className="rounded-lg border border-input bg-background p-2 text-sm outline-none focus:border-hibiscus" />
                        </label>
                        <label className="text-sm">
                            <span className="mb-1 block font-medium text-foreground">End time</span>
                            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                                className="rounded-lg border border-input bg-background p-2 text-sm outline-none focus:border-hibiscus" />
                        </label>
                    </div>
                    <p className="-mt-3 text-xs text-muted-foreground">Times use your local timezone.</p>

                    {error && <p className="text-sm text-hibiscus">{error}</p>}

                    <div className="flex gap-3">
                        <button type="submit" disabled={submitting || !acceptingRequests}
                            className="rounded-full bg-gradient-to-br from-gold to-hibiscus px-5 py-2 text-sm font-medium text-reef-navy-deep disabled:opacity-60">
                            {submitting ? 'Sending…' : `Send request · ${requestLimits.minDays}–${requestLimits.maxDays} days`}
                        </button>
                        <button type="button" onClick={onClose} className="rounded-full px-5 py-2 text-sm text-muted-foreground hover:text-foreground">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function RequestQueue({ items, busyId, onApprove, onDeny }) {
    if (items.length === 0) {
        return <EmptyState text="Nothing waiting. Requests will land here as they come in." />;
    }
    return (
        <div className="flex flex-col divide-y divide-border">
            {items.map(l => (
                <div key={l._id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                    <div>
                        <p className="font-medium text-foreground">{l.username} <span className="font-normal text-muted-foreground">· {l.reasonLabel || REASON_LABEL[l.reason] || l.reason}</span></p>
                        <p className="text-sm text-muted-foreground">{fmt(l.startDate)} – {fmt(l.endDate)} · {daysAway(l.startDate, l.endDate)}d</p>
                        {l.note && <p className="mt-1 text-sm text-muted-foreground">“{l.note}”</p>}
                    </div>
                    <div className="flex overflow-hidden rounded-full border border-border">
                        <button
                            disabled={busyId === l._id}
                            onClick={() => onApprove(l._id)}
                            className="px-4 py-2 text-sm font-medium text-lagoon transition hover:bg-lagoon-soft/40 disabled:opacity-50"
                        >
                            Approve
                        </button>
                        <div className="w-px bg-border" />
                        <button
                            disabled={busyId === l._id}
                            onClick={() => onDeny(l._id)}
                            className="px-4 py-2 text-sm font-medium text-hibiscus transition hover:bg-hibiscus/10 disabled:opacity-50"
                        >
                            Deny
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

function AwayChips({ items, busyId, isStaff, onEnd }) {
    if (items.length === 0) {
        return <EmptyState text="Nobody is away right now." />;
    }
    return (
        <div className="flex flex-wrap gap-3">
            {items.map(l => (
                <div key={l._id} className="flex items-center gap-3 rounded-full border border-lagoon/30 bg-lagoon-soft/30 py-2 pl-2 pr-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gold to-hibiscus text-xs font-semibold text-reef-navy-deep">
                        {l.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="leading-tight">
                        <p className="text-sm font-medium text-foreground">{l.username}</p>
                        <p className="text-xs text-muted-foreground">{l.reasonLabel || REASON_LABEL[l.reason] || l.reason} · back {fmt(l.endDate)}</p>
                    </div>
                    {isStaff && (
                        <button
                            disabled={busyId === l._id}
                            onClick={() => onEnd(l._id)}
                            className="ml-1 text-xs font-medium text-muted-foreground hover:text-hibiscus disabled:opacity-50"
                        >
                            End
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}

function HistoryTimeline({ items, empty = 'No leave on record yet.', onCancel, busyId }) {
    if (items.length === 0) {
        return <EmptyState text={empty} />;
    }
    return (
        <div className="relative pl-6">
            <div className="absolute left-[3px] top-1 bottom-1 w-px bg-gradient-to-b from-gold to-hibiscus opacity-40" />
            <div className="flex flex-col gap-6">
                {items.map(l => (
                    <div key={l._id} className="relative">
                        <span className={`absolute -left-6 top-1.5 h-2 w-2 rounded-full ${dotColor(l)}`} />
                        <p className="font-medium text-foreground">
                            {l.reasonLabel || REASON_LABEL[l.reason] || l.reason} <span className="font-normal text-muted-foreground">· {fmt(l.startDate)} at {fmtTime(l.startDate)} – {fmt(l.endDate)} at {fmtTime(l.endDate)}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">{outcomeText(l)}</p>
                        {l.note && <p className="mt-1 text-sm text-muted-foreground">“{l.note}”</p>}
                        {l.denialReason && <p className="mt-1 text-sm text-hibiscus">Reason: {l.denialReason}</p>}
                        {onCancel && l.status === 'pending' && (
                            <button
                                disabled={busyId === l._id}
                                onClick={() => onCancel(l._id)}
                                className="mt-1 text-xs font-medium text-muted-foreground hover:text-hibiscus disabled:opacity-50"
                            >
                                Withdraw request
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function dotColor(l) {
    if (l.status === 'denied' || l.status === 'cancelled') return 'bg-muted-foreground/40';
    if (l.status === 'pending') return 'bg-gold';
    if (l.endedEarly) return 'bg-hibiscus';
    return 'bg-lagoon';
}

function outcomeText(l) {
    if (l.status === 'pending') return 'Waiting for a decision';
    if (l.status === 'denied') return `Denied${l.decidedByName ? ` by ${l.decidedByName}` : ''}`;
    if (l.status === 'cancelled') return 'Withdrawn';
    if (l.endedEarly) return 'Ended early';
    return new Date(l.endDate) < new Date() ? 'Completed' : 'Approved · upcoming';
}

function EmptyState({ text }) {
    return (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
            {text}
        </div>
    );
}
