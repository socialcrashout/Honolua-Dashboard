"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Activity, Check, Clock3, LoaderCircle, Search, Settings2, Sparkles } from "lucide-react"

const EASE = [0.16, 1, 0.3, 1]

function QuotaCard({ role, hours, onChange, index, reduceMotion }) {
  const progress = Math.min(100, Math.round((Number(hours || 0) / 40) * 100))
  return (
    <motion.article
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.32, delay: reduceMotion ? 0 : Math.min(index * 0.018, 0.28), ease: EASE, layout: { duration: 0.22 } }}
      whileHover={reduceMotion ? undefined : { y: -3, transition: { duration: 0.16 } }}
      className="group relative overflow-hidden rounded-[22px] border border-[#E9DFD1] bg-white p-4 shadow-[0_5px_18px_rgba(60,47,32,0.035)] transition-shadow hover:shadow-[0_14px_30px_rgba(60,47,32,0.09)] sm:p-5"
    >
      <motion.span animate={reduceMotion ? undefined : { scaleX: [0.72, 1, 0.72] }} transition={{ duration: 5 + index % 4, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-x-0 top-0 h-1 origin-left bg-gradient-to-r from-[#F4B942] via-[#E98A42] to-[#E6736F]" />
      <div className="flex items-start gap-3">
        <motion.span whileHover={reduceMotion ? undefined : { rotate: 12, scale: 1.06 }} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#FFF2DE] text-[#B66A24]"><Activity className="h-4 w-4" /></motion.span>
        <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-bold text-reef-navy">{role.name}</h2><div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#F8F4EE] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-lava/45"><span>Group level</span><span className="text-[#A9631F]">{role.rank}</span></div></div>
        <span className="shrink-0 rounded-lg bg-[#FFF8ED] px-2.5 py-1.5 text-[10px] font-bold tabular-nums text-[#A9631F]">{Number(hours || 0)}h</span>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3"><label htmlFor={`quota-${role.rank}`} className="text-[9px] font-bold uppercase tracking-[0.15em] text-lava/40">Weekly play target</label><span className="inline-flex items-center gap-1 text-[9px] text-lava/35"><Clock3 className="h-3 w-3" /> per person</span></div>
      <div className="mt-2 flex items-center gap-3">
        <input aria-label={`${role.name} weekly quota in hours`} type="range" min="0" max="40" step="0.5" value={Math.min(40, Number(hours || 0))} onChange={(event) => onChange(event.target.value)} className="h-1.5 min-w-0 flex-1 cursor-pointer accent-[#E27C32]" />
        <div className="relative flex shrink-0 items-center"><input id={`quota-${role.rank}`} type="number" min="0" max="168" step="0.5" value={hours ?? "0"} onChange={(event) => onChange(event.target.value)} className="h-10 w-[4.7rem] rounded-xl border border-[#E8DED1] bg-[#FFFCF8] pr-7 text-right text-sm font-bold tabular-nums text-reef-navy outline-none transition focus:border-[#E7A252] focus:ring-2 focus:ring-[#F4B942]/15" /><span className="pointer-events-none absolute right-2.5 text-[10px] font-medium text-lava/40">h</span></div>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#F3EEE7]"><motion.div animate={{ width: `${progress}%` }} transition={{ duration: reduceMotion ? 0.01 : 0.4, ease: EASE }} className="h-full rounded-full bg-gradient-to-r from-[#F4B942] to-[#E6736F]" /></div>
      <div className="mt-3 flex gap-1.5">{[1, 2, 4, 6].map((preset) => <button key={preset} type="button" onClick={() => onChange(String(preset))} className="rounded-lg border border-[#F0E7DA] px-2.5 py-1 text-[9px] font-semibold text-lava/45 transition hover:border-[#E8B578] hover:bg-[#FFF6E9] hover:text-[#A9631F]">{preset}h</button>)}<button type="button" onClick={() => onChange("0")} className="ml-auto rounded-lg border border-[#F0E7DA] px-2.5 py-1 text-[9px] font-semibold text-lava/45 transition hover:border-[#E8B578] hover:bg-[#FFF6E9] hover:text-[#A9631F]">Clear</button></div>
    </motion.article>
  )
}

export default function ActivitySettingsPage() {
  const reduceMotion = useReducedMotion()
  const [roles, setRoles] = useState([])
  const [quotas, setQuotas] = useState({})
  const [drafts, setDrafts] = useState({})
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/staff/activity/settings", { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Could not load activity settings.")
      const nextQuotas = data.quotas || {}
      setRoles(Array.isArray(data.roles) ? data.roles : [])
      setQuotas(nextQuotas)
      setDrafts(Object.fromEntries((data.roles || []).map((role) => [String(role.rank), String((Number(nextQuotas[role.rank]) || 0) / 60)])))
    } catch (loadError) {
      setError(loadError.message || "Could not load activity settings.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer) }, [load])

  const orderedRoles = useMemo(() => [...roles].sort((left, right) => right.rank - left.rank), [roles])
  const visibleRoles = useMemo(() => orderedRoles.filter((role) => `${role.name} ${role.rank}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [orderedRoles, query])
  const configured = orderedRoles.filter((role) => Number(drafts[role.rank]) > 0).length
  const totalHours = orderedRoles.reduce((total, role) => total + (Number(drafts[role.rank]) || 0), 0)
  const changed = orderedRoles.some((role) => Math.round((Number(drafts[role.rank]) || 0) * 60) !== (Number(quotas[role.rank]) || 0))

  async function save() {
    setSaving(true)
    setNotice("")
    setError("")
    try {
      const nextQuotas = Object.fromEntries(orderedRoles.map((role) => [String(role.rank), Math.round(Math.max(0, Math.min(168, Number(drafts[role.rank]) || 0)) * 60)]))
      const response = await fetch("/api/staff/activity/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quotas: nextQuotas }) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Could not save rank quotas.")
      setQuotas(data.quotas || nextQuotas)
      setDrafts(Object.fromEntries(orderedRoles.map((role) => [String(role.rank), String((Number((data.quotas || nextQuotas)[role.rank]) || 0) / 60)])))
      setNotice("Activity targets saved for every rank.")
    } catch (saveError) {
      setError(saveError.message || "Could not save rank quotas.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen px-4 pb-12 pt-6 sm:px-6 sm:pt-9">
      <div className="mx-auto max-w-7xl">
        <motion.header initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0.01 : 0.45, ease: EASE }} className="relative isolate overflow-hidden rounded-[30px] border border-[#E8D6C0] bg-white px-5 py-6 shadow-[0_18px_50px_rgba(125,78,27,0.08)] sm:px-8 sm:py-8">
          <motion.div aria-hidden="true" animate={reduceMotion ? undefined : { rotate: 360 }} transition={{ duration: 38, repeat: Infinity, ease: "linear" }} className="pointer-events-none absolute -right-16 -top-36 h-[26rem] w-[26rem] rounded-full border border-[#E9BC7E]/35" />
          <motion.div aria-hidden="true" animate={reduceMotion ? undefined : { x: [0, 12, 0], y: [0, -8, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="pointer-events-none absolute right-32 top-8 h-40 w-40 rounded-full bg-[#F4B942]/20 blur-[60px]" />
          <div className="relative flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-2xl"><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E8CC9E] bg-[#FFF8EC] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.17em] text-[#A9631F]"><Settings2 className="h-3.5 w-3.5" />Leadership · activity settings</div><h1 className="text-3xl font-bold leading-tight tracking-tight text-reef-navy sm:text-4xl">Set the pace together.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-lava/50">Give every Roblox group rank a weekly play target. Each person’s activity view stays their own.</p></div>
            <div className="relative flex items-center gap-2 rounded-2xl border border-[#EFE2CF] bg-[#FFFCF8] px-3.5 py-2.5"><motion.span animate={reduceMotion ? undefined : { scale: [1, 1.25, 1] }} transition={{ duration: 2.2, repeat: Infinity }} className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF1D9] text-[#B36D20]"><Sparkles className="h-4 w-4" /></motion.span><span><span className="block text-[9px] font-bold uppercase tracking-[0.13em] text-lava/40">Ranks ready</span><span className="mt-0.5 block text-sm font-bold tabular-nums text-reef-navy">{configured} <span className="font-medium text-lava/40">/ {roles.length}</span></span></span></div>
          </div>
        </motion.header>

        <section className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <label className="flex min-h-12 items-center gap-2.5 rounded-2xl border border-[#E9DFD1] bg-white px-4 shadow-sm"><Search className="h-4 w-4 shrink-0 text-lava/35" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a rank" className="min-w-0 flex-1 bg-transparent text-sm text-reef-navy outline-none placeholder:text-lava/35" /></label>
          <div className="flex min-h-12 items-center gap-2 rounded-2xl border border-[#E9DFD1] bg-white px-4"><span className="text-[9px] font-bold uppercase tracking-[0.12em] text-lava/40">Weekly plan</span><span className="text-sm font-bold tabular-nums text-reef-navy">{totalHours.toLocaleString()}h</span></div>
          <button type="button" onClick={() => void save()} disabled={saving || loading || !changed} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#D96E2A] px-5 text-xs font-bold text-white shadow-[0_8px_18px_rgba(217,110,42,0.2)] transition hover:bg-[#C85D22] disabled:cursor-not-allowed disabled:opacity-45">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{saving ? "Saving targets…" : changed ? "Save targets" : "All changes saved"}</button>
        </section>

        <AnimatePresence mode="wait">
          {notice ? <motion.p key="notice" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="status" className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">{notice}</motion.p> : null}
          {error ? <motion.p key="error" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="alert" className="mt-3 flex items-center justify-between rounded-xl border border-[#E9B8A8] bg-white px-4 py-3 text-xs font-medium text-reef-navy">{error}<button onClick={() => void load()} className="font-bold text-[#B45B25] underline underline-offset-2">Retry</button></motion.p> : null}
        </AnimatePresence>
        <div className="mb-3 mt-7 flex flex-wrap items-end justify-between gap-2"><div><div className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#B36D20]">The quota garden</div><h2 className="mt-1 text-xl font-bold tracking-tight text-reef-navy">Weekly targets by rank</h2></div><span className="text-[10px] font-medium text-lava/40">{visibleRoles.length} {visibleRoles.length === 1 ? "rank" : "ranks"} shown · enter hours</span></div>

        {loading ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="h-52 animate-pulse rounded-[22px] bg-white/80" />)}</div> : visibleRoles.length ? <motion.div layout className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{visibleRoles.map((role, index) => <QuotaCard key={role.id} role={role} hours={drafts[role.rank] ?? "0"} onChange={(value) => setDrafts((current) => ({ ...current, [role.rank]: value }))} index={index} reduceMotion={reduceMotion} />)}</motion.div> : <div className="rounded-2xl border border-dashed border-[#E5D7C6] bg-white/75 px-5 py-12 text-center"><p className="text-sm font-semibold text-reef-navy">No ranks match that search.</p><button onClick={() => setQuery("")} className="mt-2 text-xs font-semibold text-[#B36D20]">Clear search</button></div>}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E9DFD1] bg-[#FFF9F1] px-4 py-3"><span className="text-[10px] text-lava/45">A target of 0h leaves that rank without a quota. Edits apply to everyone in the rank.</span><button type="button" onClick={() => setDrafts(Object.fromEntries(orderedRoles.map((role) => [String(role.rank), String((Number(quotas[role.rank]) || 0) / 60)])))} disabled={!changed} className="text-[10px] font-bold text-[#A9631F] transition hover:text-reef-navy disabled:cursor-default disabled:opacity-40">Reset unsaved changes</button></div>
      </div>
    </main>
  )
}
