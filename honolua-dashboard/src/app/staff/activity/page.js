"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Activity, CalendarDays, Clock3, Flame, MessageCircle, Radio, RefreshCw, Sparkles } from "lucide-react"

const EASE = [0.16, 1, 0.3, 1]
const reduceDuration = (reduceMotion, duration) => reduceMotion ? 0.01 : duration

function timeLabel(minutes) {
  const safe = Math.max(0, Math.floor(Number(minutes) || 0))
  const hours = Math.floor(safe / 60)
  const rest = safe % 60
  return hours ? `${hours}h ${rest}m` : `${rest}m`
}

function dateLabel(value, options = { dateStyle: "medium" }) {
  if (!value) return "Recently"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "Recently" : new Intl.DateTimeFormat(undefined, options).format(date)
}

function SummaryCard({ icon: Icon, label, value, note, tint, index, reduceMotion }) {
  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceDuration(reduceMotion, 0.42), delay: reduceMotion ? 0 : index * 0.07, ease: EASE }}
      whileHover={reduceMotion ? undefined : { y: -4, transition: { duration: 0.18 } }}
      className="relative overflow-hidden rounded-[22px] border border-[#E9DFD1] bg-white p-4 shadow-[0_8px_24px_rgba(46,38,29,0.045)] sm:p-5"
    >
      <span className="pointer-events-none absolute -right-6 -top-7 h-24 w-24 rounded-full blur-2xl" style={{ background: `${tint}22` }} />
      <div className="relative flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.17em] text-lava/40">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${tint}17`, color: tint }}><Icon className="h-4 w-4" /></span>
      </div>
      <motion.div initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : 0.12 + index * 0.07, duration: 0.28 }} className="relative mt-3 truncate text-3xl font-bold tracking-tight text-reef-navy tabular-nums sm:text-4xl">{value}</motion.div>
      <p className="relative mt-1 truncate text-xs text-lava/45">{note}</p>
    </motion.article>
  )
}

function contributionColor(minutes) {
  if (minutes >= 180) return "#C7551F"
  if (minutes >= 90) return "#E67336"
  if (minutes >= 30) return "#F4A261"
  if (minutes > 0) return "#F9D7B2"
  return "#F3F0EC"
}

function ActivityCalendar({ days, reduceMotion }) {
  const cells = useMemo(() => {
    if (!days.length) return []
    const first = new Date(`${days[0].date}T00:00:00Z`)
    const mondayOffset = (first.getUTCDay() + 6) % 7
    return [...Array(mondayOffset).fill(null), ...days]
  }, [days])
  const monthLabels = useMemo(() => {
    const columns = []
    for (let start = 0; start < cells.length; start += 7) {
      const week = cells.slice(start, start + 7)
      const firstOfMonth = week.find((day) => day && Number(day.date.slice(-2)) <= 7)
      columns.push(firstOfMonth ? new Intl.DateTimeFormat(undefined, { month: "short", timeZone: "UTC" }).format(new Date(`${firstOfMonth.date}T00:00:00Z`)) : "")
    }
    return columns
  }, [cells])

  return (
    <section className="overflow-hidden rounded-[26px] border border-[#E9DFD1] bg-white p-5 shadow-[0_8px_24px_rgba(46,38,29,0.04)] sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B36D20]">Your rhythm</div><h2 className="mt-1 text-lg font-bold tracking-tight text-reef-navy">Six months, one small square at a time</h2></div>
        <span className="text-[10px] font-medium text-lava/40">Minutes played each day</span>
      </div>
      <div className="mt-5 overflow-x-auto pb-1">
        <div className="min-w-[660px]">
          <div className="grid gap-[5px] pl-8 text-[9px] font-medium text-lava/40" style={{ gridTemplateColumns: `repeat(${monthLabels.length}, minmax(0, 1fr))` }}>
            {monthLabels.map((month, index) => <span key={`${month}-${index}`}>{month}</span>)}
          </div>
          <div className="mt-2 grid grid-flow-col grid-rows-7 gap-[5px]">
            {["M", "", "W", "", "F", "", ""].map((label, index) => <span key={`weekday-${index}`} className="flex h-3.5 w-5 items-center text-[9px] font-medium text-lava/35">{label}</span>)}
            {cells.map((day, index) => day ? (
              <motion.div key={day.date} initial={reduceMotion ? false : { opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: reduceMotion ? 0 : Math.min(index * 0.0015, 0.2), duration: 0.22 }} title={`${dateLabel(day.date, { month: "short", day: "numeric", timeZone: "UTC" })} · ${timeLabel(day.minutes)}`} className="h-3.5 w-3.5 rounded-[4px] ring-1 ring-black/[0.025] transition-transform hover:z-10 hover:scale-125" style={{ backgroundColor: contributionColor(day.minutes) }} />
            ) : <span key={`pad-${index}`} className="h-3.5 w-3.5" />)}
          </div>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#F0E8DE] pt-4">
        <p className="text-[10px] text-lava/40">A day counts toward your streak after {10} minutes in-game.</p>
        <div className="flex items-center gap-1.5 text-[9px] font-medium text-lava/40"><span>Quiet</span>{["#F3F0EC", "#F9D7B2", "#F4A261", "#E67336", "#C7551F"].map((color) => <span key={color} className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: color }} />)}<span>More time</span></div>
      </div>
    </section>
  )
}

function FourteenDayPulse({ days, reduceMotion }) {
  const lastDays = days.slice(-14)
  const max = Math.max(30, ...lastDays.map((day) => day.minutes))
  return (
    <section className="rounded-[26px] border border-[#E9DFD1] bg-[#FFF9F1] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B36D20]">Two week pulse</div><h2 className="mt-1 text-lg font-bold tracking-tight text-reef-navy">Small steps add up</h2></div><Activity className="h-5 w-5 text-[#D8792B]" /></div>
      <div className="mt-6 flex h-36 items-end gap-2">
        {lastDays.map((day, index) => {
          const height = day.minutes ? Math.max(7, Math.round((day.minutes / max) * 100)) : 4
          return <div key={day.date} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
            <motion.div initial={reduceMotion ? false : { height: 0 }} animate={{ height: `${height}%` }} transition={{ duration: reduceDuration(reduceMotion, 0.55), delay: reduceMotion ? 0 : index * 0.035, ease: EASE }} title={`${timeLabel(day.minutes)} on ${dateLabel(day.date, { month: "short", day: "numeric", timeZone: "UTC" })}`} className={`w-full max-w-7 rounded-t-lg ${day.minutes ? "bg-gradient-to-t from-[#D66527] to-[#F4B942]" : "bg-[#EAE0D4]"}`} />
            <span className="text-[9px] font-medium text-lava/45">{new Date(`${day.date}T00:00:00Z`).getUTCDate()}</span>
          </div>
        })}
      </div>
      <p className="mt-3 text-[10px] text-lava/40">Each bar is one day. Hover to see your time.</p>
    </section>
  )
}

function SessionList({ sessions, reduceMotion }) {
  return (
    <section className="rounded-[26px] border border-[#E9DFD1] bg-white p-5 shadow-[0_8px_24px_rgba(46,38,29,0.04)] sm:p-6">
      <div className="flex items-center justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B36D20]">Recent visits</div><h2 className="mt-1 text-lg font-bold tracking-tight text-reef-navy">Your time in Honolua</h2></div><CalendarDays className="h-5 w-5 text-[#D8792B]" /></div>
      {sessions.length ? <div className="mt-4 divide-y divide-[#F0E8DE]">{sessions.slice(0, 6).map((session, index) => (
        <motion.article key={`${session.startedAt}-${index}`} initial={reduceMotion ? false : { opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: reduceMotion ? 0 : index * 0.045, duration: 0.28 }} className="flex items-center gap-3 py-3.5">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${session.isActive ? "bg-[#EAF5EA] text-[#4B9461]" : "bg-[#FFF3E1] text-[#B36D20]"}`}><Clock3 className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold text-reef-navy">{dateLabel(session.startedAt, { weekday: "short", month: "short", day: "numeric" })}</div><div className="mt-0.5 text-[10px] text-lava/40">{dateLabel(session.startedAt, { hour: "numeric", minute: "2-digit" })}{session.isActive ? " · In game now" : " · Visit"}</div></div>
          <span className="shrink-0 text-xs font-bold tabular-nums text-reef-navy">{timeLabel(session.minutes)}</span>
        </motion.article>
      ))}</div> : <div className="mt-5 rounded-2xl bg-[#FFFAF4] px-4 py-8 text-center"><Radio className="mx-auto h-5 w-5 text-[#D8792B]" /><p className="mt-2 text-xs font-semibold text-reef-navy">Your first visit will show up here</p><p className="mt-1 text-[10px] text-lava/45">Join the Honolua game to start your activity trail.</p></div>}
    </section>
  )
}

function MessageList({ messages, reduceMotion }) {
  return (
    <section className="relative overflow-hidden rounded-[26px] border border-[#E9DFD1] bg-white p-5 shadow-[0_8px_24px_rgba(46,38,29,0.04)] sm:p-6">
      <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-[#F4B942]/15 blur-3xl" />
      <div className="relative flex items-center justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B36D20]">From the island chat</div><h2 className="mt-1 text-lg font-bold tracking-tight text-reef-navy">Your in-game messages</h2></div><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF2DF] text-[#C36722]"><MessageCircle className="h-5 w-5" /></span></div>
      <p className="relative mt-1 text-[10px] text-lava/40">Only your own filtered messages appear here · last 30 days</p>
      {messages.length ? <div className="relative mt-4 max-h-[440px] divide-y divide-[#F0E8DE] overflow-y-auto pr-1">{messages.map((message, index) => (
        <motion.article key={message.id} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : Math.min(index * 0.025, 0.22), duration: 0.26 }} className="py-3.5 first:pt-2">
          <div className="mb-1.5 flex items-center justify-between gap-3"><span className="rounded-full bg-[#FFF5E8] px-2.5 py-1 text-[9px] font-semibold text-[#A76425]">{message.channel}</span><time className="shrink-0 text-[9px] text-lava/40">{dateLabel(message.createdAt, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time></div>
          <p className="whitespace-pre-wrap break-words text-xs leading-5 text-reef-navy/85">{message.text}</p>
        </motion.article>
      ))}</div> : <div className="relative mt-5 rounded-2xl border border-dashed border-[#EADBC7] bg-[#FFFAF4] px-4 py-10 text-center"><motion.span animate={reduceMotion ? undefined : { y: [0, -4, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#D8792B] shadow-sm"><MessageCircle className="h-5 w-5" /></motion.span><p className="mt-3 text-xs font-semibold text-reef-navy">Your chat trail starts with a hello</p><p className="mx-auto mt-1 max-w-[230px] text-[10px] leading-5 text-lava/45">Messages you send in the Honolua game will appear here after Roblox filters them.</p></div>}
    </section>
  )
}

export default function StaffActivityPage() {
  const reduceMotion = useReducedMotion()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async (background = false) => {
    if (background) setRefreshing(true)
    else setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/staff/activity", { cache: "no-store" })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || "Could not load your activity.")
      setData(result)
    } catch (loadError) {
      setError(loadError.message || "Could not load your activity.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0)
    const interval = window.setInterval(() => void load(true), 60000)
    return () => { window.clearTimeout(timer); window.clearInterval(interval) }
  }, [load])

  const days = data?.days || []
  const messages = data?.messages || []
  const sessions = data?.sessions || []
  const stats = data?.stats

  return (
    <main className="min-h-screen px-4 pb-12 pt-6 sm:px-6 sm:pt-9">
      <div className="mx-auto max-w-7xl">
        <motion.header initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceDuration(reduceMotion, 0.48), ease: EASE }} className="relative isolate overflow-hidden rounded-[30px] border border-[#E7D4BD] bg-gradient-to-br from-white via-[#FFFCF7] to-[#FFF0DB] px-5 py-6 shadow-[0_20px_55px_rgba(125,78,27,0.09)] sm:px-8 sm:py-8">
          <motion.div aria-hidden="true" animate={reduceMotion ? undefined : { rotate: 360 }} transition={{ duration: 52, repeat: Infinity, ease: "linear" }} className="pointer-events-none absolute -right-16 -top-40 h-[28rem] w-[28rem] rounded-full border border-[#E6B978]/30" />
          <motion.div aria-hidden="true" animate={reduceMotion ? undefined : { scale: [0.92, 1.08, 0.92], opacity: [0.45, 0.8, 0.45] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="pointer-events-none absolute right-24 top-10 h-40 w-40 rounded-full bg-[#F4B942]/25 blur-[60px]" />
          <div className="relative flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E9C994] bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.17em] text-[#A9631F]"><Sparkles className="h-3.5 w-3.5" />A little rhythm, every day</div>
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-reef-navy sm:text-4xl">{data?.member?.username ? `Welcome back, ${data.member.username}.` : "Your island activity"}</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-lava/55">Your game time, your streak, and a trail of moments from the Honolua chat.</p>
            </div>
            <button type="button" onClick={() => void load(true)} disabled={loading || refreshing} className="relative inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#E6D5C1] bg-white/90 px-4 text-xs font-semibold text-reef-navy shadow-sm transition hover:border-[#E1A34D] hover:bg-white disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${refreshing && !reduceMotion ? "animate-spin" : ""}`} />Refresh</button>
          </div>
          <div className="relative mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#E7D9C7] pt-4 text-[10px] text-lava/45"><span className="inline-flex items-center gap-1.5"><Radio className="h-3.5 w-3.5 text-[#BA7024]" />Honolua group activity</span><span className="inline-flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-[#D96F35]" />10 minutes keeps a day in your streak</span><span className="ml-auto">Private to your account</span></div>
        </motion.header>

        {error ? <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-2xl border border-[#E9B8A8] bg-white p-4 text-sm text-reef-navy"><p className="font-semibold">{error}</p><button onClick={() => void load()} className="mt-2 text-xs font-semibold text-[#B45B25] underline underline-offset-2">Try again</button></motion.div> : null}
        {!loading && data?.linked === false ? <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-[24px] border border-[#E7D4BD] bg-white p-6 text-center shadow-sm"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF1DC] text-[#B36D20]"><Activity className="h-5 w-5" /></span><h2 className="mt-3 text-base font-bold text-reef-navy">Link your Roblox account to see your rhythm</h2><p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-lava/50">Connect your Roblox account through the Honolua Discord verification flow, then refresh this page.</p></motion.section> : null}

        {loading ? <section className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-[22px] bg-white/80" />)}</section> : data?.linked ? <>
          <section className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <SummaryCard icon={Clock3} label="Last 30 days" value={timeLabel(stats?.last30DaysMinutes)} note="Time in-game" tint="#D7792A" index={0} reduceMotion={reduceMotion} />
            <SummaryCard icon={CalendarDays} label="Visits" value={stats?.visits || 0} note="Game sessions this month" tint="#B98736" index={1} reduceMotion={reduceMotion} />
            <SummaryCard icon={Activity} label="Average visit" value={timeLabel(stats?.averageVisitMinutes)} note="Per session" tint="#5FA678" index={2} reduceMotion={reduceMotion} />
            <SummaryCard icon={Flame} label="Current streak" value={`${stats?.currentStreakDays || 0} days`} note="Consecutive active days" tint="#E67336" index={3} reduceMotion={reduceMotion} />
          </section>

          <div className="mt-4"><ActivityCalendar days={days} reduceMotion={reduceMotion} /></div>
          <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
            <div className="grid gap-4"><FourteenDayPulse days={days} reduceMotion={reduceMotion} /><SessionList sessions={sessions} reduceMotion={reduceMotion} /></div>
            <MessageList messages={messages} reduceMotion={reduceMotion} />
          </div>
        </> : null}
      </div>
    </main>
  )
}
