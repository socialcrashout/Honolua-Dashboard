'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Clock3, FileClock, Palmtree, Plus, X } from 'lucide-react';

const BRAND_GRADIENT = 'linear-gradient(135deg, #F4B942, #E6736F, #F472B6)';
const EASE = [0.16, 1, 0.3, 1];

const REASON_LABEL = {
    vacation: 'Vacation', school: 'School', exams: 'Exams', hospital: 'Hospital or medical',
    family: 'Family', work: 'Work', break: 'Taking a break', other: 'Other',
};

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
        <main className="min-h-screen text-reef-navy">
            <div className={`mx-auto w-full max-w-[1440px] ${personalOnly ? 'px-5 py-7 sm:px-8 sm:py-9 xl:px-10' : 'px-8 py-10'}`}>
                <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42, ease: EASE }} className="relative overflow-hidden rounded-[28px] border border-lava/10 bg-white/90 p-6 shadow-[0_8px_28px_rgba(46,38,29,0.045)] sm:p-8">
                    <div aria-hidden className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full opacity-20 blur-3xl" style={{ background: BRAND_GRADIENT }} />
                    <div className={`relative flex flex-wrap items-center justify-between gap-5 ${revealed ? 'fade-in-visible' : ''}`}>
                      <div className="flex min-w-0 items-start gap-4">
                        <span className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F4B942]/15 text-[#C57622]"><Palmtree className="h-5 w-5" /></span>
                        <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-hibiscus">Honolua · Staff portal</p>
                        <h1 className="mt-1 text-3xl font-bold tracking-tight text-reef-navy sm:text-4xl">
                            {personalOnly
                                ? 'Your leave, at a glance'
                                : countAway === 0 ? 'Everyone is here today' : `${countAway} ${countAway === 1 ? 'person is' : 'people are'} away today`}
                        </h1>
                        <p className="mt-2 max-w-lg text-sm leading-6 text-lava/50">
                            {personalOnly
                                ? 'Keep track of your requests, approvals, and past leave.'
                                : "Request time off, or review what's waiting on you."}
                        </p>
                        </div>
                      </div>
                    <motion.button
                        onClick={() => setShowForm(s => !s)}
                        whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                        className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
                        style={{ background: BRAND_GRADIENT }}
                    >
                        {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {showForm ? 'Close' : 'Request leave'}
                    </motion.button>
                </div>
                </motion.header>

            {personalOnly && (
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <PersonalMetric label="Waiting for review" value={pendingMineCount} detail="Your pending requests" />
                    <PersonalMetric label="Approved" value={approvedMineCount} detail="Upcoming or active leave" />
                    <PersonalMetric label="Past leave" value={pastMine.length} detail="Completed or closed requests" />
                </div>
            )}

            {/* Tabs */}
            <div className="mt-5 flex flex-wrap gap-1.5 rounded-2xl border border-lava/10 bg-white/70 p-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.025)]">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${tab === t.id ? 'bg-white text-reef-navy shadow-sm' : 'text-lava/45 hover:bg-white/60 hover:text-reef-navy'}`}
                    >
                        {t.label}
                        {typeof t.count === 'number' && t.count > 0 && (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] tabular-nums ${tab === t.id ? 'bg-[#F4B942]/20 text-[#9D5C1A]' : 'bg-lava/5 text-lava/45'}`}>{t.count}</span>
                        )}
                    </button>
                ))}
            </div>

            <motion.section key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: EASE }} className="mt-4 min-h-40 rounded-[24px] border border-lava/10 bg-white/85 p-4 shadow-[0_6px_22px_rgba(46,38,29,0.035)] sm:p-6">
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
            </motion.section>
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
            <RequestPanel open={showForm} onClose={() => setShowForm(false)} onSubmitted={() => { setShowForm(false); router.refresh(); }} />
        </main>
    );
}


function PersonalMetric({ label, value, detail }) {
    return (
        <motion.article whileHover={{ y: -2 }} className="relative overflow-hidden rounded-2xl border border-lava/10 bg-white p-4 shadow-[0_6px_20px_rgba(46,38,29,0.035)] sm:p-5">
            <span className="absolute -right-5 -top-7 h-20 w-20 rounded-full bg-[#F4B942]/10 blur-2xl" />
            <div className="relative flex items-center justify-between gap-3"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-lava/40">{label}</p><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F4B942]/15 text-[#B36D20]"><FileClock className="h-4 w-4" /></span></div>
            <p className="relative mt-3 text-3xl font-bold tracking-tight text-reef-navy tabular-nums">{value}</p>
            <p className="relative mt-1 text-xs text-lava/45">{detail}</p>
        </motion.article>
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
                <motion.article key={item._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-lava/10 bg-white p-5 shadow-[0_4px_18px_rgba(46,38,29,0.035)] transition-shadow hover:shadow-md sm:p-6">
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
                </motion.article>
            ))}
        </div>
    );
}

function RequestPanel({ open, onClose, onSubmitted }) {
    const [reason, setReason] = useState('');
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
                const reasons = data.settings.customReasons || [];
                setCustomReasons(reasons);
                setReason((current) => reasons.some((item) => item.id === current) ? current : (reasons[0]?.id || ''));
                setAcceptingRequests(data.settings.acceptingRequests !== false);
                setRequestLimits({ minDays: data.settings.minDays || 1, maxDays: data.settings.maxDays || 30 });
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [open]);

    async function submit(e) {
        e.preventDefault();
        setError('');
        if (!customReasons.length) return setError('Staff have not added any leave reasons yet.');
        if (!customReasons.some((item) => item.id === reason)) return setError('Choose a leave reason.');
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
        <AnimatePresence>
        {open && <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40 bg-reef-navy/20 backdrop-blur-[2px]" />
          <motion.aside ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="leave-request-title" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: EASE }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-lava/10 bg-white shadow-[-4px_0_28px_rgba(0,0,0,0.12)]">
                <div className="flex items-center justify-between border-b border-lava/10 px-6 py-5 sm:px-8">
                  <div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4B942]/15 text-[#B36D20]"><CalendarDays className="h-5 w-5" /></span><div><h2 id="leave-request-title" className="text-lg font-bold text-reef-navy">Request leave</h2><p className="mt-0.5 text-xs text-lava/45">Share when you’ll be away with your team.</p></div></div>
                  <button type="button" onClick={onClose} aria-label="Close request form" className="flex h-9 w-9 items-center justify-center rounded-xl text-lava/45 transition hover:bg-lava/5 hover:text-reef-navy"><X className="h-4 w-4" /></button>
                </div>
                <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
                  <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5 sm:px-8">
                    {!acceptingRequests && <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">Leave requests are temporarily paused.</div>}
                    <div>
                        <p className="mb-2 text-sm font-medium text-foreground">Choose a leave reason</p>
                        {customReasons.length ? <div className="flex flex-wrap gap-2">
                            {customReasons.map(r => (
                                <button
                                    type="button"
                                    key={r.id}
                                    onClick={() => setReason(r.id)}
                                    className={`rounded-full border px-3 py-1.5 text-sm transition ${reason === r.id ? 'border-transparent bg-gradient-to-br from-gold to-hibiscus text-reef-navy-deep' : 'border-border text-muted-foreground hover:border-hibiscus/40'}`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div> : <p className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">No leave reasons have been added yet. Check back after staff adds them in Workspace leave settings.</p>}
                    </div>

                    <label className="block text-sm">
                        <span className="mb-1.5 block text-xs font-semibold text-lava/55">Anything to add <span className="font-normal text-lava/35">— optional</span></span>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            rows={2}
                            className="w-full rounded-xl border border-lava/10 bg-lava/[0.03] p-3 text-sm text-reef-navy outline-none transition placeholder:text-lava/30 focus:border-hibiscus/40"
                            placeholder="Anything staff should know."
                        />
                    </label>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="text-sm">
                            <span className="mb-1 block font-medium text-foreground">First day away</span>
                            <input type="date" value={start} onChange={e => setStart(e.target.value)}
                                className="mt-1.5 h-11 w-full rounded-xl border border-lava/10 bg-lava/[0.03] px-3 text-sm text-reef-navy outline-none focus:border-hibiscus/40" />
                        </label>
                        <label className="text-sm">
                            <span className="mb-1 block font-medium text-foreground">Start time</span>
                            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                                className="mt-1.5 h-11 w-full rounded-xl border border-lava/10 bg-lava/[0.03] px-3 text-sm text-reef-navy outline-none focus:border-hibiscus/40" />
                        </label>
                        <label className="text-sm">
                            <span className="mb-1 block font-medium text-foreground">Last day away</span>
                            <input type="date" value={end} onChange={e => setEnd(e.target.value)}
                                className="mt-1.5 h-11 w-full rounded-xl border border-lava/10 bg-lava/[0.03] px-3 text-sm text-reef-navy outline-none focus:border-hibiscus/40" />
                        </label>
                        <label className="text-sm">
                            <span className="mb-1 block font-medium text-foreground">End time</span>
                            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                                className="mt-1.5 h-11 w-full rounded-xl border border-lava/10 bg-lava/[0.03] px-3 text-sm text-reef-navy outline-none focus:border-hibiscus/40" />
                        </label>
                    </div>
                    <p className="-mt-3 inline-flex items-center gap-1.5 text-[10px] text-lava/40"><Clock3 className="h-3 w-3" />Times use your local timezone.</p>

                    {error && <p className="text-sm text-hibiscus">{error}</p>}

                  </div>
                    <div className="flex gap-3 border-t border-lava/10 bg-white px-6 py-4 sm:px-8">
                        <button type="submit" disabled={submitting || !acceptingRequests || !customReasons.length || !reason}
                            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white shadow-sm disabled:opacity-50" style={{ background: BRAND_GRADIENT }}>
                            {submitting ? 'Sending…' : `Send request · ${requestLimits.minDays}–${requestLimits.maxDays} days`}
                        </button>
                        <button type="button" onClick={onClose} className="rounded-xl border border-lava/10 px-5 py-2 text-sm font-medium text-lava/50 transition hover:bg-lava/5 hover:text-reef-navy">
                            Cancel
                        </button>
                    </div>
                </form>
          </motion.aside>
        </>}
        </AnimatePresence>
    );
}

function RequestQueue({ items, busyId, onApprove, onDeny }) {
    if (items.length === 0) {
        return <EmptyState text="Nothing waiting. Requests will land here as they come in." />;
    }
    return (
        <div className="flex flex-col divide-y divide-lava/10">
            {items.map(l => (
                <motion.div key={l._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-1 last:pb-1">
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
                </motion.div>
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
                <div key={l._id} className="flex items-center gap-3 rounded-2xl border border-lava/10 bg-white px-3 py-3 shadow-sm">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-semibold text-white" style={{ background: BRAND_GRADIENT }}>
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
        <div className="rounded-2xl border border-dashed border-lava/15 bg-[#FFFAF4] px-5 py-12 text-center">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4B942]/15 text-[#B36D20]"><CalendarDays className="h-4 w-4" /></span>
            <p className="mt-3 text-sm font-semibold text-reef-navy">{text}</p>
        </div>
    );
}
