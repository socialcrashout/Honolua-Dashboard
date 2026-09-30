"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Activity, CalendarDays, Clock3, Flame, Gamepad2, MessageCircle, Radio, RefreshCw, Sparkles } from "lucide-react"

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

function CurrentSession({ session, now, trackingReady, reduceMotion }) {
  const elapsed = session?.startedAt ? Math.max(0, Math.floor((now - new Date(session.startedAt).getTime()) / 60000)) : 0
  const active = Boolean(session?.isActive)
  return (
    <motion.section initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceDuration(reduceMotion, 0.4), ease: EASE }} className={`relative mt-4 overflow-hidden rounded-[28px] border p-5 shadow-[0_12px_36px_rgba(125,78,27,0.07)] sm:flex sm:items-center sm:gap-6 sm:px-7 ${active ? "border-[#E8B970]/50 bg-[linear-gradient(105deg,#fff_0%,#FFF5E5_50%,#FFE9CE_100%)]" : "border-[#E9DFD1] bg-white"}`}>
      {active ? <motion.span aria-hidden="true" animate={reduceMotion ? undefined : { scale: [1, 1.2, 1], opacity: [0.18, 0.38, 0.18] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} className="pointer-events-none absolute -right-3 -top-20 h-56 w-56 rounded-full bg-[#F4B942] blur-[55px]" /> : null}
      <span className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] ${active ? "bg-[#D96E2A] text-white shadow-[0_10px_22px_rgba(217,110,42,0.25)]" : "bg-[#FFF3E2] text-[#B36D20]"}`}>
        {active ? <motion.span aria-hidden="true" animate={reduceMotion ? undefined : { scale: [1, 1.35, 1], opacity: [0.55, 0, 0.55] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 rounded-[20px] border-2 border-[#E67336]" /> : null}
        <Gamepad2 className="relative h-6 w-6" />
      </span>
      <div className="relative mt-4 min-w-0 flex-1 sm:mt-0">
        <div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#A9631F]">{active ? "Live session" : "Now playing"}</span>{active ? <span className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#A9631F]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#E67336]" />Live</span> : null}</div>
        <h2 className="mt-1 truncate text-xl font-bold tracking-tight text-reef-navy">{active ? `Playing ${session.experienceName || "Honolua"}` : trackingReady ? "No active game session" : "Activity tracker needs setup"}</h2>
        <p className="mt-1 text-xs leading-5 text-lava/50">{active ? `Joined at ${dateLabel(session.startedAt, { hour: "numeric", minute: "2-digit" })} · this time is updating live` : trackingReady ? "When you join the Honolua experience, your current session will appear here." : "Roblox cannot send activity until the experience secret and HTTP requests are configured."}</p>
      </div>
      {active ? <div className="relative mt-4 flex shrink-0 items-baseline gap-2 sm:mt-0 sm:pl-6 sm:text-right"><motion.span key={elapsed} initial={reduceMotion ? false : { opacity: 0.4, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold tabular-nums tracking-tight text-reef-navy">{timeLabel(elapsed)}</motion.span><span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A9631F]">in game</span></div> : null}
    </motion.section>
  )
}

function SixMonthVoyage({ days, reduceMotion }) {
  const months = useMemo(() => {
    const monthMap = new Map()
    for (const day of days) {
      const date = new Date(`${day.date}T00:00:00Z`)
      const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}`
      if (!monthMap.has(key)) monthMap.set(key, { key, date, weeks: [0, 0, 0, 0, 0], minutes: 0 })
      const month = monthMap.get(key)
      month.weeks[Math.min(4, Math.floor((date.getUTCDate() - 1) / 7))] += day.minutes
      month.minutes += day.minutes
    }
    return Array.from(monthMap.values()).slice(-6)
  }, [days])
  const maxWeek = Math.max(30, ...months.flatMap((month) => month.weeks))
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-[#E9D7C0] bg-[#FFF9F1] p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B36D20]">Long view · six months</div><h2 className="mt-1 text-lg font-bold tracking-tight text-reef-navy">Little visits, gathered into seasons</h2></div><span className="text-[10px] text-lava/40">Each curve marks a week</span></div>
      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        {months.map((month, monthIndex) => (
          <motion.article key={month.key} initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : monthIndex * 0.04, duration: 0.28 }} className="rounded-[20px] border border-[#E8DFD2] bg-white/85 p-3.5 sm:p-4">
            <div className="flex items-baseline justify-between gap-2"><h3 className="text-xs font-bold text-reef-navy">{new Intl.DateTimeFormat(undefined, { month: "short", timeZone: "UTC" }).format(month.date)}</h3><span className="truncate text-[10px] font-semibold tabular-nums text-[#A9631F]">{timeLabel(month.minutes)}</span></div>
            <div className="mt-4 flex h-16 items-end gap-1.5 border-b border-dashed border-[#E8DCCB] pb-1">
              {month.weeks.map((minutes, weekIndex) => {
                const height = minutes ? Math.max(5, (minutes / maxWeek) * 58) : 3
                return <motion.span key={weekIndex} initial={reduceMotion ? false : { scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: reduceMotion ? 0 : monthIndex * 0.04 + weekIndex * 0.025, duration: 0.38, ease: EASE }} title={`Week ${weekIndex + 1}: ${timeLabel(minutes)}`} className={`min-w-0 flex-1 origin-bottom rounded-t-md ${minutes ? "bg-gradient-to-t from-[#D66527] to-[#F4B942]" : "bg-[#F0E8DC]"}`} style={{ height }} />
              })}
            </div>
            <div className="mt-1.5 flex justify-between text-[8px] font-medium text-lava/35"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div>
          </motion.article>
        ))}
      </div>
      <p className="mt-4 border-t border-[#E9DDCE] pt-3 text-[10px] text-lava/45">A streak day begins at 10 minutes of play. Hover a weekly bar to see its total.</p>
    </section>
  )
}

function curveThrough(points) {
  if (!points.length) return ""
  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`
    const previous = points[index - 1]
    const before = points[index - 2] || previous
    const after = points[index + 1] || point
    const c1x = previous.x + (point.x - before.x) / 6
    const c1y = previous.y + (point.y - before.y) / 6
    const c2x = point.x - (after.x - previous.x) / 6
    const c2y = point.y - (after.y - previous.y) / 6
    return `${path} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${point.x} ${point.y}`
  }, "")
}

function ThirtyDayTide({ days, reduceMotion }) {
  const chartDays = days.slice(-30)
  const max = Math.max(30, ...chartDays.map((day) => day.minutes))
  const points = chartDays.map((day, index) => ({
    ...day,
    x: chartDays.length <= 1 ? 400 : 24 + (index / (chartDays.length - 1)) * 752,
    y: 156 - Math.min(112, (day.minutes / max) * 112),
  }))
  const line = curveThrough(points)
  const area = points.length ? `${line} L ${points.at(-1).x} 164 L ${points[0].x} 164 Z` : ""
  const ticks = points.filter((_, index) => index % 5 === 0 || index === points.length - 1)
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-[#E8D7C1] bg-[linear-gradient(135deg,#fff_0%,#FFFBF5_55%,#FFF2E1_100%)] p-5 shadow-[0_12px_34px_rgba(125,78,27,0.055)] sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border border-[#E8AA5D]/20" />
      <div className="relative flex flex-wrap items-end justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B36D20]">The island tide · 30 days</div><h2 className="mt-1 text-lg font-bold tracking-tight text-reef-navy">Your playtime, in waves</h2></div><span className="rounded-full border border-[#EAD6B9] bg-white/80 px-3 py-1.5 text-[9px] font-semibold text-lava/50">Daily minutes</span></div>
      <div className="relative mt-4 overflow-hidden">
        {points.length ? <svg viewBox="0 0 800 204" role="img" aria-label="A wave chart of your daily minutes in game for the last 30 days" className="h-[190px] w-full overflow-visible sm:h-[220px]">
          <defs><linearGradient id="activity-tide-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#E87932" stopOpacity="0.34" /><stop offset="100%" stopColor="#F4B942" stopOpacity="0.015" /></linearGradient><linearGradient id="activity-tide-line" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#F4B942" /><stop offset="52%" stopColor="#E87932" /><stop offset="100%" stopColor="#D85648" /></linearGradient></defs>
          {[44, 100, 156].map((y) => <line key={y} x1="20" x2="780" y1={y} y2={y} stroke="#E8DCCB" strokeDasharray="3 8" />)}
          <path d={area} fill="url(#activity-tide-fill)" />
          <motion.path d={line} fill="none" stroke="url(#activity-tide-line)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" initial={reduceMotion ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduceDuration(reduceMotion, 1.15), ease: EASE }} />
          {points.map((point, index) => <circle key={point.date} cx={point.x} cy={point.y} r={index === points.length - 1 ? 5 : point.minutes ? 2.5 : 1.5} fill={index === points.length - 1 ? "#D85648" : point.minutes ? "#E87932" : "#D9CDBD"}><title>{`${dateLabel(point.date, { month: "short", day: "numeric", timeZone: "UTC" })}: ${timeLabel(point.minutes)}`}</title></circle>)}
          {ticks.map((point) => <text key={`tick-${point.date}`} x={point.x} y="190" textAnchor="middle" fill="#998C7C" fontSize="9">{new Date(`${point.date}T00:00:00Z`).getUTCDate()}</text>)}
        </svg> : <div className="flex h-48 items-center justify-center rounded-2xl bg-white/55 text-xs text-lava/45">Your first session will draw the tide.</div>}
      </div>
      <div className="relative flex items-center justify-between gap-3 border-t border-[#E9DDCE] pt-3 text-[10px] text-lava/45"><span>30 days ago</span><span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#E67336]" />More minutes lift the wave</span><span>Today</span></div>
    </section>
  )
}

function SessionList({ sessions, reduceMotion, now }) {
  return (
    <section className="rounded-[26px] border border-[#E9DFD1] bg-white p-5 shadow-[0_8px_24px_rgba(46,38,29,0.04)] sm:p-6">
      <div className="flex items-center justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B36D20]">Recent visits</div><h2 className="mt-1 text-lg font-bold tracking-tight text-reef-navy">Your time in Honolua</h2></div><CalendarDays className="h-5 w-5 text-[#D8792B]" /></div>
      {sessions.length ? <div className="mt-4 divide-y divide-[#F0E8DE]">{sessions.slice(0, 6).map((session, index) => (
        <motion.article key={`${session.startedAt}-${index}`} initial={reduceMotion ? false : { opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: reduceMotion ? 0 : index * 0.045, duration: 0.28 }} className="flex items-center gap-3 py-3.5">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${session.isActive ? "bg-[#EAF5EA] text-[#4B9461]" : "bg-[#FFF3E1] text-[#B36D20]"}`}><Clock3 className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold text-reef-navy">{dateLabel(session.startedAt, { weekday: "short", month: "short", day: "numeric" })}</div><div className="mt-0.5 text-[10px] text-lava/40">{dateLabel(session.startedAt, { hour: "numeric", minute: "2-digit" })}{session.isActive ? " · In game now" : " · Visit"}</div></div>
          <span className="shrink-0 text-xs font-bold tabular-nums text-reef-navy">{timeLabel(session.isActive && session.startedAt ? Math.max(0, Math.floor((now - new Date(session.startedAt).getTime()) / 60000)) : session.minutes)}</span>
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
  const [clock, setClock] = useState(() => Date.now())
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
    const interval = window.setInterval(() => void load(true), 30000)
    const clockInterval = window.setInterval(() => setClock(Date.now()), 5000)
    return () => { window.clearTimeout(timer); window.clearInterval(interval); window.clearInterval(clockInterval) }
  }, [load])

  const days = data?.days || []
  const messages = data?.messages || []
  const sessions = data?.sessions || []
  const currentSession = data?.currentSession || sessions.find((session) => session.isActive) || null
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
          <CurrentSession session={currentSession} now={clock} trackingReady={data.trackingReady} reduceMotion={reduceMotion} />
          <section className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <SummaryCard icon={Clock3} label="Last 30 days" value={timeLabel(stats?.last30DaysMinutes)} note="Time in-game" tint="#D7792A" index={0} reduceMotion={reduceMotion} />
            <SummaryCard icon={CalendarDays} label="Visits" value={stats?.visits || 0} note="Game sessions this month" tint="#B98736" index={1} reduceMotion={reduceMotion} />
            <SummaryCard icon={Activity} label="Average visit" value={timeLabel(stats?.averageVisitMinutes)} note="Per session" tint="#C08B40" index={2} reduceMotion={reduceMotion} />
            <SummaryCard icon={Flame} label="Current streak" value={`${stats?.currentStreakDays || 0} days`} note="Consecutive active days" tint="#E67336" index={3} reduceMotion={reduceMotion} />
          </section>

          <div className="mt-4"><SixMonthVoyage days={days} reduceMotion={reduceMotion} /></div>
          <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
            <div className="grid gap-4"><ThirtyDayTide days={days} reduceMotion={reduceMotion} /><SessionList sessions={sessions} now={clock} reduceMotion={reduceMotion} /></div>
            <MessageList messages={messages} reduceMotion={reduceMotion} />
          </div>
        </> : null}
      </div>
    </main>
  )
}
