"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Activity, ArrowDownRight, ArrowUpRight, Check, ChevronDown, Clock3, Crown, LoaderCircle, Radio, RefreshCw, Save, Settings2, Shield, Users, Wifi, X } from "lucide-react"

const EASE = [0.16, 1, 0.3, 1]
const reduceDuration = (reduceMotion, duration) => reduceMotion ? 0.01 : duration

function minutesLabel(minutes) {
  const safeMinutes = Math.max(0, Math.floor(minutes || 0))
  const hours = Math.floor(safeMinutes / 60)
  const remaining = safeMinutes % 60
  return hours ? `${hours}h ${remaining}m` : `${remaining}m`
}

function relativeTime(value) {
  if (!value) return "No sessions yet"
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000))
  if (elapsedMinutes < 1) return "Just now"
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`
  const hours = Math.floor(elapsedMinutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function MetricCard({ icon: Icon, eyebrow, value, detail, index, reduceMotion, accent = "#E6736F" }) {
  return (
    <motion.section initial={reduceMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceDuration(reduceMotion, 0.42), delay: reduceMotion ? 0 : 0.07 * index, ease: EASE }} className="relative min-w-0 overflow-hidden rounded-[22px] border border-lava/[0.07] bg-white p-4 shadow-[0_8px_26px_rgba(34,52,39,0.04)] sm:p-5">
      <div className="pointer-events-none absolute -right-7 -top-8 h-24 w-24 rounded-full blur-2xl" style={{ background: `${accent}18` }} />
      <div className="relative flex items-center justify-between gap-3"><div className="text-[10px] font-bold uppercase tracking-[0.17em] text-lava/40">{eyebrow}</div><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `${accent}14`, color: accent }}><Icon className="h-4 w-4" /></span></div>
      <div className="relative mt-2 truncate text-3xl font-bold tracking-tight text-reef-navy tabular-nums sm:text-4xl">{value}</div>
      <p className="relative mt-1 truncate text-xs text-lava/45">{detail}</p>
    </motion.section>
  )
}

function RankProgress({ role, index, activity, quota, reduceMotion }) {
  const count = activity.filter((session) => session.rank === role.rank).length
  const trackedMinutes = activity.filter((session) => session.rank === role.rank).reduce((sum, session) => sum + session.minutes, 0)
  const progress = quota > 0 ? Math.min(100, Math.round((trackedMinutes / quota) * 100)) : 0
  const fulfilled = quota > 0 && trackedMinutes >= quota
  return (
    <motion.article layout initial={reduceMotion ? false : { opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: reduceMotion ? 0 : Math.min(index * 0.025, 0.25), duration: reduceDuration(reduceMotion, 0.32), ease: EASE }} className="group rounded-2xl border border-lava/[0.065] bg-white p-4 transition hover:border-[#E6736F]/20 hover:shadow-[0_10px_25px_rgba(34,52,39,0.045)] sm:p-5">
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ${role.rank >= 240 ? "bg-[#FFF3D6] text-[#A87419]" : "bg-[#EEF5EE] text-[#52775A]"}`}>{role.rank >= 240 ? <Crown className="h-4 w-4" /> : <Shield className="h-4 w-4" />}</span>
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-bold text-reef-navy">{role.name}</h3><span className="rounded-full bg-lava/[0.045] px-2 py-0.5 text-[10px] font-semibold text-lava/45">Rank {role.rank}</span></div><p className="mt-1 text-xs text-lava/45">{count} {count === 1 ? "session" : "sessions"} · {minutesLabel(trackedMinutes)} tracked</p></div>
        {fulfilled ? <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><Check className="h-4 w-4" /></span> : null}
      </div>
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-3 text-[10px]"><span className="font-semibold uppercase tracking-[0.13em] text-lava/35">Weekly quota</span><span className="font-bold tabular-nums text-reef-navy">{quota > 0 ? `${minutesLabel(trackedMinutes)} / ${minutesLabel(quota)}` : "Not set"}</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-[#EEF2EB]"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: reduceDuration(reduceMotion, 0.7), delay: reduceMotion ? 0 : 0.08, ease: EASE }} className="h-full rounded-full" style={{ background: fulfilled ? "linear-gradient(90deg,#73B48A,#55A779)" : "linear-gradient(90deg,#F4B942,#E6736F,#F472B6)" }} /></div>
      </div>
    </motion.article>
  )
}

export default function StaffActivityPage() {
  const reduceMotion = useReducedMotion()
  const [roles, setRoles] = useState([])
  const [quotas, setQuotas] = useState({})
  const [draftQuotas, setDraftQuotas] = useState({})
  const [activity, setActivity] = useState([])
  const [lastEventAt, setLastEventAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [editingQuotas, setEditingQuotas] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const load = useCallback(async ({ background = false } = {}) => {
    if (background) setRefreshing(true)
    else setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/staff/activity", { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Could not load staff activity.")
      setRoles(Array.isArray(data.roles) ? data.roles : [])
      setQuotas(data.quotas || {})
      setDraftQuotas(Object.fromEntries(Object.entries(data.quotas || {}).map(([rank, minutes]) => [rank, String(minutes / 60)])))
      setActivity(Array.isArray(data.activity) ? data.activity : [])
      setLastEventAt(data.lastEventAt || null)
    } catch (loadError) {
      setError(loadError.message || "Could not load staff activity.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0)
    const interval = window.setInterval(() => void load({ background: true }), 45000)
    return () => { window.clearTimeout(timer); window.clearInterval(interval) }
  }, [load])

  const memberActivity = useMemo(() => {
    const byUser = new Map()
    activity.forEach((session) => {
      const existing = byUser.get(session.userId) || { ...session, minutes: 0, sessionCount: 0, isActive: false }
      existing.minutes += session.minutes
      existing.sessionCount += 1
      existing.isActive ||= session.isActive
      if (new Date(session.startedAt) > new Date(existing.startedAt)) {
        existing.startedAt = session.startedAt
        existing.username = session.username
        existing.rank = session.rank
      }
      byUser.set(session.userId, existing)
    })
    return [...byUser.values()].sort((a, b) => Number(b.isActive) - Number(a.isActive) || b.minutes - a.minutes)
  }, [activity])

  const onlineCount = activity.filter((session) => session.isActive).length
  const weeklyMinutes = activity.reduce((total, session) => total + session.minutes, 0)
  const activeRanks = roles.filter((role) => memberActivity.some((member) => member.rank === role.rank)).length
  const orderedRoles = [...roles].sort((a, b) => b.rank - a.rank)
  const shownRoles = showAll ? orderedRoles : orderedRoles.slice(0, 8)
  const loggedSessions = activity.length > 0

  async function saveQuotas() {
    setSaving(true)
    setNotice("")
    try {
      const nextQuotas = Object.fromEntries(roles.map((role) => {
        const hours = Number(draftQuotas[role.rank] || 0)
        return [String(role.rank), Math.round(hours * 60)]
      }))
      const response = await fetch("/api/staff/activity", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quotas: nextQuotas }) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Could not save rank quotas.")
      setQuotas(data.quotas || nextQuotas)
      setEditingQuotas(false)
      setNotice("Weekly rank quotas saved.")
    } catch (saveError) {
      setNotice(saveError.message || "Could not save rank quotas.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen px-4 pb-10 pt-6 sm:px-6 sm:pt-9">
      <div className="mx-auto max-w-7xl">
        <motion.header initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceDuration(reduceMotion, 0.5), ease: EASE }} className="relative isolate overflow-hidden rounded-[28px] bg-reef-navy px-5 py-6 text-white shadow-[0_18px_55px_rgba(18,52,42,0.16)] sm:px-8 sm:py-8">
          <motion.div aria-hidden="true" animate={reduceMotion ? undefined : { rotate: 360 }} transition={{ duration: 42, repeat: Infinity, ease: "linear" }} className="pointer-events-none absolute -right-20 -top-36 h-[27rem] w-[27rem] rounded-full border border-white/[0.09]" />
          <motion.div aria-hidden="true" animate={reduceMotion ? undefined : { x: [0, 18, 0], y: [0, 12, 0] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} className="pointer-events-none absolute right-8 top-3 h-48 w-48 rounded-full bg-[#E6736F]/20 blur-[70px]" />
          <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="min-w-0"><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F8D57C]"><Activity className="h-3.5 w-3.5" />Staff rhythm · one group</div><h1 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">See the week<br className="hidden sm:block" /> take shape.</h1><p className="mt-3 max-w-lg text-sm leading-6 text-white/60">A live pulse of Honolua sessions, with a fair weekly target for every rank.</p></div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:justify-end">
              <div className="inline-flex min-h-11 items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.07] px-3.5"><span className={`relative h-2.5 w-2.5 rounded-full ${loggedSessions ? "bg-emerald-400" : "bg-[#F4B942]"}`}><span className={`absolute inset-0 rounded-full ${loggedSessions ? "animate-ping bg-emerald-400/60" : ""}`} /></span><span className="text-xs font-semibold text-white/75">{loggedSessions ? "Receiving game activity" : "Waiting for game activity"}</span></div>
              <button type="button" onClick={() => void load({ background: true })} disabled={refreshing || loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.08] px-4 text-xs font-semibold text-white transition hover:bg-white/[0.15] disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${refreshing && !reduceMotion ? "animate-spin" : ""}`} />Refresh</button>
            </div>
          </div>
          <div className="relative mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-4 text-[11px] text-white/45"><span className="inline-flex items-center gap-1.5"><Wifi className="h-3.5 w-3.5" />Roblox group 743137138</span><span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />Week resets Monday</span><span className="inline-flex items-center gap-1.5"><Radio className="h-3.5 w-3.5" />Last game event {relativeTime(lastEventAt)}</span></div>
        </motion.header>

        <section className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <MetricCard icon={Clock3} eyebrow="This week" value={loading ? "—" : minutesLabel(weeklyMinutes)} detail="Total tracked play time" index={0} reduceMotion={reduceMotion} accent="#E6736F" />
          <MetricCard icon={Users} eyebrow="In game now" value={loading ? "—" : onlineCount} detail="Live staff sessions" index={1} reduceMotion={reduceMotion} accent="#5FA678" />
          <MetricCard icon={Shield} eyebrow="Ranks active" value={loading ? "—" : `${activeRanks}/${roles.length || 0}`} detail="Ranks with play time this week" index={2} reduceMotion={reduceMotion} accent="#A87419" />
          <MetricCard icon={Activity} eyebrow="Staff tracked" value={loading ? "—" : memberActivity.length} detail="Unique members this week" index={3} reduceMotion={reduceMotion} accent="#A967A3" />
        </section>

        <div className="mt-7 grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
          <section className="min-w-0">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#A87419]">Rank by rank</div><h2 className="mt-1 text-xl font-bold tracking-tight text-reef-navy">Quota current</h2><p className="mt-1 text-xs text-lava/45">Each Roblox rank keeps its own weekly target.</p></div><button type="button" onClick={() => { setEditingQuotas((value) => !value); setNotice("") }} className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-lava/10 bg-white px-3.5 text-xs font-semibold text-reef-navy shadow-sm transition hover:border-[#E6736F]/30 hover:bg-[#FFF9F1] sm:self-auto"><Settings2 className="h-4 w-4" />{editingQuotas ? "Close quota editor" : "Set rank quotas"}<ChevronDown className={`h-3.5 w-3.5 transition-transform ${editingQuotas ? "rotate-180" : ""}`} /></button></div>

            <AnimatePresence initial={false}>
              {editingQuotas ? <motion.section initial={reduceMotion ? false : { opacity: 0, height: 0, y: -8 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0, y: -8 }} transition={{ duration: reduceDuration(reduceMotion, 0.24), ease: EASE }} className="mb-4 overflow-hidden rounded-[24px] border border-[#F4B942]/25 bg-[#FFFDF8] shadow-[0_12px_32px_rgba(175,133,48,0.07)]"><div className="flex flex-col gap-3 border-b border-[#F4B942]/15 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><h3 className="text-sm font-bold text-reef-navy">Weekly targets by Roblox rank</h3><p className="mt-1 text-xs text-lava/45">Enter hours. Set 0 to leave a rank without a quota.</p></div><button type="button" onClick={() => setEditingQuotas(false)} aria-label="Close quota editor" className="absolute right-5 hidden h-8 w-8 items-center justify-center rounded-lg text-lava/45 hover:bg-lava/5 sm:flex"><X className="h-4 w-4" /></button></div><div className="grid gap-2 p-3 sm:grid-cols-2 sm:p-4">{orderedRoles.map((role) => <label key={role.id} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-lava/[0.06] bg-white px-3 py-2.5"><span className="min-w-0"><span className="block truncate text-xs font-semibold text-reef-navy">{role.name}</span><span className="text-[10px] text-lava/40">Rank {role.rank}</span></span><span className="flex shrink-0 items-center gap-2"><input aria-label={`${role.name} weekly quota in hours`} type="number" min="0" max="168" step="0.5" value={draftQuotas[role.rank] ?? "0"} onChange={(event) => setDraftQuotas((current) => ({ ...current, [role.rank]: event.target.value }))} className="h-10 w-20 rounded-lg border border-lava/10 bg-[#FBFCF9] px-2 text-right text-sm font-bold tabular-nums text-reef-navy outline-none focus:border-[#E6736F]/50 focus:ring-2 focus:ring-[#E6736F]/10" /><span className="text-[10px] text-lava/40">hrs</span></span></label>)}</div><div className="flex flex-col gap-2 border-t border-[#F4B942]/15 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"><p className="text-[10px] leading-4 text-lava/40">Saved to Honolua and recorded in Audit Logs.</p><button type="button" onClick={() => void saveQuotas()} disabled={saving || !roles.length} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-reef-navy px-4 text-xs font-semibold text-white transition hover:bg-reef-navy/90 disabled:opacity-50">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? "Saving…" : "Save quotas"}</button></div></motion.section> : null}
            </AnimatePresence>
            {notice ? <p role="status" className="mb-3 rounded-xl border border-lava/[0.07] bg-white px-4 py-3 text-xs font-medium text-reef-navy/70">{notice}</p> : null}

            {error ? <div className="rounded-[24px] border border-[#E6736F]/20 bg-white px-5 py-12 text-center"><p className="text-sm font-semibold text-reef-navy">{error}</p><button type="button" onClick={() => void load()} className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-reef-navy px-4 text-xs font-semibold text-white">Try again</button></div> : loading ? <div className="grid gap-2.5 sm:grid-cols-2">{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/80" />)}</div> : roles.length ? <motion.div layout className="grid gap-2.5 sm:grid-cols-2">{shownRoles.map((role, index) => <RankProgress key={role.id} role={role} index={index} activity={activity} quota={Number(quotas[role.rank]) || 0} reduceMotion={reduceMotion} />)}</motion.div> : <div className="rounded-2xl border border-dashed border-lava/15 bg-white/70 px-5 py-10 text-center text-sm text-lava/45">No Roblox group ranks were returned.</div>}
            {orderedRoles.length > 8 ? <button type="button" onClick={() => setShowAll((value) => !value)} className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-lava/[0.07] bg-white text-xs font-semibold text-lava/55 transition hover:border-[#E6736F]/25 hover:text-reef-navy">{showAll ? "Show top ranks" : `Show all ${orderedRoles.length} ranks`}<ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAll ? "rotate-180" : ""}`} /></button> : null}
          </section>

          <aside className="min-w-0">
            <div className="mb-3 flex items-end justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#A87419]">The roster pulse</div><h2 className="mt-1 text-xl font-bold tracking-tight text-reef-navy">Who’s showing up</h2></div><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-lava/45">This week</span></div>
            <section className="overflow-hidden rounded-[24px] border border-lava/[0.07] bg-white shadow-[0_8px_26px_rgba(34,52,39,0.04)]">
              <div className="flex items-center justify-between border-b border-lava/[0.06] px-4 py-3.5"><span className="text-[10px] font-bold uppercase tracking-[0.15em] text-lava/40">Member sessions</span><span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-lava/40"><span className="h-1.5 w-1.5 rounded-full bg-[#5FA678]" />{onlineCount} active</span></div>
              {loading ? <div className="space-y-3 p-4">{[0, 1, 2, 3].map((n) => <div key={n} className="h-14 animate-pulse rounded-xl bg-lava/[0.035]" />)}</div> : memberActivity.length ? <div className="divide-y divide-lava/[0.055]">{memberActivity.slice(0, 10).map((member, index) => <motion.article key={member.userId} initial={reduceMotion ? false : { opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: reduceMotion ? 0 : Math.min(index * 0.04, 0.24), duration: reduceDuration(reduceMotion, 0.3) }} className="flex items-center gap-3 px-4 py-3.5"><div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FFF3D6] to-[#FCE6E4] text-xs font-bold text-reef-navy">{member.username.slice(0, 2).toUpperCase()}<span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${member.isActive ? "bg-emerald-500" : "bg-[#D6D8D2]"}`} /></div><div className="min-w-0 flex-1"><div className="truncate text-xs font-bold text-reef-navy">{member.username}</div><div className="mt-0.5 truncate text-[10px] text-lava/40">Rank {member.rank} · {member.isActive ? "In game now" : `${member.sessionCount} sessions`}</div></div><div className="shrink-0 text-right"><div className="text-xs font-bold tabular-nums text-reef-navy">{minutesLabel(member.minutes)}</div><div className="mt-0.5 inline-flex items-center gap-0.5 text-[9px] text-lava/40">{member.isActive ? <ArrowUpRight className="h-3 w-3 text-emerald-600" /> : <ArrowDownRight className="h-3 w-3" />}{member.isActive ? "live" : "this week"}</div></div></motion.article>)}</div> : <div className="px-5 py-12 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF5E1] text-[#AD7D23]"><Radio className="h-5 w-5" /></div><p className="mt-3 text-sm font-bold text-reef-navy">Quiet before the first session</p><p className="mx-auto mt-1 max-w-[250px] text-xs leading-5 text-lava/45">Member sessions will appear here as soon as the game starts sending activity.</p></div>}
              <div className="border-t border-lava/[0.06] bg-[#FBFCF9] px-4 py-3 text-[10px] text-lava/40">Refreshes automatically every 45 seconds</div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
