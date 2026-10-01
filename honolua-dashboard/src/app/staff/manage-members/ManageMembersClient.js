"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { AlertTriangle, Ban, Check, Clock3, FileText, LockKeyhole, RefreshCw, Search, Shield, ShieldAlert, ShieldCheck, UserCog, X } from "lucide-react"

const EASE = [0.16, 1, 0.3, 1]
const ACTIONS = [
  { id: "notice", label: "Notice", icon: FileText, tint: "#D96E2A", note: "A documented reminder" },
  { id: "warning", label: "Warning", icon: AlertTriangle, tint: "#D96E2A", note: "A formal warning" },
  { id: "restriction", label: "Restriction", icon: LockKeyhole, tint: "#D96E2A", note: "Limit selected access" },
  { id: "suspension", label: "Suspension", icon: ShieldAlert, tint: "#D96E2A", note: "Pause access temporarily" },
  { id: "ban", label: "Ban", icon: Ban, tint: "#D96E2A", note: "Block access until lifted" },
]
const CATEGORIES = ["conduct", "safety", "integrity", "community", "other"]
const RESTRICTIONS = [
  { id: "verification", label: "Discord verification", hint: "Stops the account from completing verification" },
  { id: "workspace", label: "Workspace access", hint: "Blocks access after Roblox rank is checked" },
]

function initials(member) {
  return (member.displayName || member.username || "?").split(/[\s_]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
}

function activeSanction(sanction) {
  return sanction.status === "active" && (!sanction.expiresAt || new Date(sanction.expiresAt) > new Date())
}

function sanctionStatus(sanction) {
  if (activeSanction(sanction)) return "Active"
  if (sanction.status === "revoked") return "Lifted"
  if (sanction.expiresAt && new Date(sanction.expiresAt) <= new Date()) return "Expired"
  return sanction.status
}

function dateLabel(value) {
  if (!value) return "No end date"
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value))
}

function MemberIdentity({ member, large = false }) {
  const size = large ? "h-16 w-16 text-lg" : "h-12 w-12 text-sm"
  return (
    <span className={`relative flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-[#E7D7C2] bg-[linear-gradient(145deg,#FFF1D9,#F9D7C9)] font-bold text-[#A9631F]`}>
      {member.avatarUrl ? <img src={member.avatarUrl} alt="" className="absolute inset-0 h-full w-full object-cover" /> : initials(member)}
    </span>
  )
}

function SanctionDrawer({ member, sanctions, onClose, onCreated, onRevoked, reduceMotion }) {
  const [action, setAction] = useState("warning")
  const [category, setCategory] = useState("conduct")
  const [reason, setReason] = useState("")
  const [details, setDetails] = useState("")
  const [days, setDays] = useState("30")
  const [restrictions, setRestrictions] = useState([])
  const [saving, setSaving] = useState(false)
  const [revoking, setRevoking] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const chosenAction = ACTIONS.find((item) => item.id === action)
  const active = sanctions.filter(activeSanction)

  useEffect(() => {
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const closeOnEscape = (event) => { if (event.key === "Escape") onClose() }
    window.addEventListener("keydown", closeOnEscape)
    return () => { document.body.style.overflow = oldOverflow; window.removeEventListener("keydown", closeOnEscape) }
  }, [onClose])

  function chooseAction(id) {
    setAction(id)
    setError("")
    if (id === "ban") setDays("0")
    else if (days === "0") setDays("30")
  }

  function toggleRestriction(id) {
    setRestrictions((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  async function submit(event) {
    event.preventDefault()
    setError("")
    if (action === "restriction" && !restrictions.length) return setError("Choose at least one access area to restrict.")
    if (action === "ban" && !window.confirm(`Ban ${member.username} from Honolua? This will block Honolua verification and attempt to remove their Discord verified role.`)) return

    setSaving(true)
    try {
      const response = await fetch(`/api/staff/manage-members/${member.userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, category, reason, details, days: Number(days), restrictions, username: member.username }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error === "forbidden" ? "Only the Honolua owner can manage member sanctions." : data.error || "Could not save this action.")
      onCreated(data.sanction)
      setReason("")
      setDetails("")
      setNotice(action === "ban" && data.discordRoleRemoved === false ? "Ban saved, but Discord could not remove the verified role. Check the bot permissions and role position." : `${chosenAction?.label} saved to the member’s record.`)
    } catch (saveError) {
      setError(saveError.message || "Could not save this action.")
    } finally {
      setSaving(false)
    }
  }

  async function liftSanction(sanction) {
    setRevoking(sanction.id)
    setError("")
    try {
      const response = await fetch(`/api/staff/manage-members/${member.userId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: sanction.id }) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Could not lift this action.")
      onRevoked(data.sanction)
      setNotice("Action lifted. The change is recorded in the audit log.")
    } catch (revokeError) {
      setError(revokeError.message || "Could not lift this action.")
    } finally {
      setRevoking("")
    }
  }

  return (
    <AnimatePresence>
      {member ? <>
        <motion.button type="button" aria-label="Close member management" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 cursor-default bg-[#21180F]/45 backdrop-blur-sm" />
        <div className="pointer-events-none fixed inset-0 z-50 flex justify-end">
          <motion.aside role="dialog" aria-modal="true" aria-labelledby="manage-member-title" initial={reduceMotion ? { opacity: 0 } : { x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={reduceMotion ? { opacity: 0 } : { x: 40, opacity: 0 }} transition={{ duration: reduceMotion ? 0.12 : 0.32, ease: EASE }} className="pointer-events-auto flex h-full w-full max-w-[760px] flex-col overflow-hidden border-l border-[#E8D7C4] bg-white shadow-[-24px_0_80px_rgba(31,22,13,0.18)]">
            <header className="relative shrink-0 overflow-hidden border-b border-[#E87932]/20 bg-white px-5 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))] text-[#31271F] sm:px-8 sm:pb-7">
              <div className="pointer-events-none absolute -right-12 -top-28 h-72 w-72 rounded-full border border-[#E87932]/10 after:absolute after:inset-8 after:rounded-full after:border after:border-dashed after:border-[#E87932]/20" />
              <div className="relative flex items-start gap-4">
                <MemberIdentity member={member} large />
                <div className="min-w-0 flex-1"><div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D96E2A]">Member stewardship · Roblox #{member.userId}</div><h2 id="manage-member-title" className="mt-1 truncate text-2xl font-bold">{member.displayName || member.username}</h2><p className="mt-1 truncate text-xs text-[#74685D]">@{member.username} · {member.roleName || member.teamLabel || "Team member"}</p></div>
                <button type="button" onClick={onClose} aria-label="Close member management" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E9E2DA] bg-white text-[#74685D] transition hover:bg-[#FFF6ED] hover:text-[#31271F]"><X className="h-4 w-4" /></button>
              </div>
              <div className="relative mt-5 flex flex-wrap gap-2 text-[10px] font-semibold"><span className="rounded-full bg-[#FFF0E3] px-3 py-1.5 text-[#B85D23]">{member.teamLabel || "Roster member"}</span>{member.departments.map((department) => <span key={department} className="rounded-full border border-[#E9E2DA] px-3 py-1.5 text-[#74685D]">{department}</span>)}</div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-7 sm:py-6">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                <form onSubmit={submit} className="space-y-4">
                  <section className="rounded-[22px] border border-[#31271F]/[0.08] bg-white p-4 shadow-[0_5px_22px_rgba(32,54,44,0.04)] sm:p-5">
                    <div className="flex items-start justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A87419]">01 · Choose an action</div><h3 className="mt-1 text-sm font-bold text-[#31271F]">What should happen?</h3></div><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF2DF] text-[#AD7020]"><Shield className="h-4 w-4" /></span></div>
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {ACTIONS.map((item) => { const Icon = item.icon; const selected = action === item.id; return <button key={item.id} type="button" onClick={() => chooseAction(item.id)} aria-pressed={selected} className={`min-h-[82px] rounded-2xl border p-3 text-left transition ${selected ? "border-current bg-[#FFFBF5] shadow-[inset_0_0_0_1px_currentColor]" : "border-[#31271F]/[0.08] bg-white hover:bg-[#FFFCF7]"}`} style={{ color: selected ? item.tint : "#8B7B6C" }}><span className="flex items-center justify-between"><Icon className="h-4 w-4" />{selected ? <Check className="h-3.5 w-3.5" /> : null}</span><span className="mt-2 block text-xs font-bold text-[#31271F]">{item.label}</span><span className="mt-0.5 block text-[9px] leading-4 text-lava/45">{item.note}</span></button> })}
                    </div>
                  </section>

                  <section className="rounded-[22px] border border-[#31271F]/[0.08] bg-white p-4 shadow-[0_5px_22px_rgba(32,54,44,0.04)] sm:p-5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A87419]">02 · Record the context</div>
                    <label className="mt-4 block text-xs font-semibold text-lava/60">Category<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-lava/10 bg-[#FFFCF7] px-3 text-sm capitalize text-[#31271F] outline-none focus:border-[#E87932]/40">{CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                    <label className="mt-4 block text-xs font-semibold text-lava/60">Reason <span className="font-normal text-lava/35">· visible to the member</span><input required maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Write a clear, direct reason." className="mt-1.5 h-11 w-full rounded-xl border border-lava/10 bg-[#FFFCF7] px-3 text-sm text-[#31271F] outline-none placeholder:text-lava/30 focus:border-[#E87932]/40" /></label>
                    <label className="mt-4 block text-xs font-semibold text-lava/60">Details <span className="font-normal text-lava/35">· optional</span><textarea maxLength={2000} rows={3} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Add any context needed for a review or appeal." className="mt-1.5 w-full resize-y rounded-xl border border-lava/10 bg-[#FFFCF7] px-3 py-2.5 text-sm leading-5 text-[#31271F] outline-none placeholder:text-lava/30 focus:border-[#E87932]/40" /></label>
                    <label className="mt-4 block max-w-[260px] text-xs font-semibold text-lava/60">Duration<select value={days} onChange={(event) => setDays(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-lava/10 bg-[#FFFCF7] px-3 text-sm text-[#31271F] outline-none focus:border-[#E87932]/40"><option value="0">No expiry · until lifted</option><option value="1">1 day</option><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option><option value="365">1 year</option></select></label>
                  </section>

                  {action === "restriction" ? <section className="rounded-[22px] border border-[#D96E2A]/15 bg-[#FFF8F1] p-4 sm:p-5"><div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D96E2A]">03 · Limit access</div><div className="mt-3 space-y-2">{RESTRICTIONS.map((restriction) => <label key={restriction.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#D96E2A]/10 bg-white p-3"><input type="checkbox" checked={restrictions.includes(restriction.id)} onChange={() => toggleRestriction(restriction.id)} className="mt-0.5 accent-[#D96E2A]" /><span><span className="block text-xs font-semibold text-[#31271F]">{restriction.label}</span><span className="mt-0.5 block text-[10px] leading-4 text-lava/45">{restriction.hint}</span></span></label>)}</div></section> : null}

                  {error ? <p role="alert" className="rounded-xl border border-[#D96E2A]/15 bg-[#FFF0E3] px-3.5 py-3 text-xs font-medium text-[#B85D23]">{error}</p> : null}
                  {notice ? <p role="status" className="rounded-xl border border-[#D96E2A]/15 bg-[#FFF0E3] px-3.5 py-3 text-xs font-medium text-[#9B4C1D]">{notice}</p> : null}
                  <button type="submit" disabled={saving} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-wait disabled:opacity-60" style={{ background: `linear-gradient(110deg, ${chosenAction?.tint || "#D96E2A"}, #E87932)` }}><ShieldCheck className="h-4 w-4" />{saving ? "Saving record…" : action === "ban" ? "Apply ban" : `Record ${chosenAction?.label.toLowerCase()}`}</button>
                </form>

                <aside className="space-y-4">
                  <section className="rounded-[22px] border border-[#31271F]/[0.08] bg-[#FFF8F1] p-4 sm:p-5"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#D96E2A]"><ShieldCheck className="h-4 w-4" />Access status</div>{active.length ? <div className="mt-3 space-y-2">{active.map((sanction) => <div key={sanction.id} className="rounded-xl border border-white bg-white p-3"><div className="flex items-center justify-between gap-2"><span className="text-xs font-bold capitalize text-[#31271F]">{sanction.action}</span><span className="text-[9px] text-lava/40">{sanction.expiresAt ? `until ${dateLabel(sanction.expiresAt)}` : "no expiry"}</span></div><p className="mt-1 text-[10px] leading-4 text-lava/55">{sanction.reason}</p><button type="button" onClick={() => void liftSanction(sanction)} disabled={Boolean(revoking)} className="mt-2 text-[10px] font-bold text-[#B85D23] transition hover:underline disabled:opacity-50">{revoking === sanction.id ? "Lifting…" : "Lift this action"}</button></div>)}</div> : <p className="mt-3 rounded-xl border border-dashed border-[#D96E2A]/20 bg-white/70 px-3 py-4 text-xs leading-5 text-[#74685D]">No active actions. Notes and expired items remain in the record history.</p>}</section>
                  <section className="rounded-[22px] border border-[#E8D7C1] bg-[#FFF9F1] p-4 sm:p-5"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#A87419]"><Clock3 className="h-4 w-4" />Decision guide</div><p className="mt-2 text-xs leading-5 text-lava/55">Bans and suspensions block verification and workspace access. Restrictions apply only to the access areas selected. Every action can be lifted here.</p></section>
                </aside>
              </div>

              <section className="mt-5 rounded-[22px] border border-[#31271F]/[0.08] bg-white p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A87419]">Member record</div><h3 className="mt-1 text-sm font-bold text-[#31271F]">Recent actions</h3></div><span className="rounded-full bg-[#FFF2DF] px-2.5 py-1 text-[10px] font-bold text-[#A87419]">{sanctions.length}</span></div>{sanctions.length ? <div className="mt-3 divide-y divide-lava/[0.07]">{sanctions.map((sanction) => <article key={sanction.id} className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-1 last:pb-0"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold capitalize text-[#31271F]">{sanction.action}</span><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold capitalize ${activeSanction(sanction) ? "bg-[#FFF0E3] text-[#B85D23]" : "bg-lava/5 text-lava/45"}`}>{sanctionStatus(sanction)}</span><span className="text-[10px] text-lava/40">{dateLabel(sanction.createdAt)}</span></div><p className="mt-1 text-xs leading-5 text-lava/55">{sanction.reason}</p>{sanction.details ? <p className="mt-1 text-[10px] leading-4 text-lava/40">{sanction.details}</p> : null}</div><span className="shrink-0 text-[10px] text-lava/40">{sanction.createdByName ? `By ${sanction.createdByName}` : ""}</span></article>)}</div> : <p className="mt-3 rounded-xl border border-dashed border-lava/10 px-3 py-5 text-xs text-lava/45">Nothing has been recorded for this member.</p>}</section>
            </div>
          </motion.aside>
        </div>
      </> : null}
    </AnimatePresence>
  )
}

export default function ManageMembersClient() {
  const reduceMotion = useReducedMotion()
  const [members, setMembers] = useState([])
  const [sanctions, setSanctions] = useState([])
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async (background = false) => {
    if (background) setRefreshing(true)
    else setLoading(true)
    setError("")
    try {
      await fetch("/api/workspace/status", { cache: "no-store" })
      const [teamResponse, departmentResponse, sanctionsResponse] = await Promise.all([
        fetch("/api/team", { cache: "no-store" }),
        fetch("/api/departments", { cache: "no-store" }),
        fetch("/api/staff/manage-members", { cache: "no-store" }),
      ])
      if (!sanctionsResponse.ok) {
        if (sanctionsResponse.status === 403) throw new Error("Member management is restricted to the Honolua owner.")
        throw new Error("Member management records could not be loaded.")
      }
      if (!teamResponse.ok) throw new Error("The member directory could not be loaded.")
      const [teamData, departmentData, sanctionData] = await Promise.all([teamResponse.json(), departmentResponse.ok ? departmentResponse.json() : {}, sanctionsResponse.json()])
      const departmentMap = new Map()
      ;(departmentData.departments || []).forEach((department) => (department.members || []).forEach((member) => {
        const key = String(member.robloxId)
        const names = departmentMap.get(key) || []
        names.push(department.name)
        departmentMap.set(key, names)
      }))
      const teamMembers = (teamData.teams || []).flatMap((team) => (teamData.members?.[team.key] || []).map((member) => ({ ...member, teamLabel: team.label, departments: departmentMap.get(String(member.userId)) || [] })))
        .sort((left, right) => String(left.displayName || left.username).localeCompare(String(right.displayName || right.username)))
      setMembers(teamMembers)
      setSanctions(Array.isArray(sanctionData.sanctions) ? sanctionData.sanctions : [])
    } catch (loadError) {
      setError(loadError.message || "Could not load member management.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    return members.filter((member) => !normalized || [member.username, member.displayName, member.roleName, member.teamLabel, ...member.departments].join(" ").toLocaleLowerCase().includes(normalized))
  }, [members, query])
  const activeSanctions = sanctions.filter(activeSanction)
  const banCount = activeSanctions.filter((sanction) => sanction.action === "ban").length

  function addSanction(sanction) {
    setSanctions((current) => [sanction, ...current.filter((item) => item.id !== sanction.id)])
  }

  function updateSanction(sanction) {
    setSanctions((current) => current.map((item) => item.id === sanction.id ? sanction : item))
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-9">
      <div className="mx-auto max-w-7xl">
        <motion.header initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className="relative overflow-hidden rounded-[28px] border border-[#E8D7C4] border-t-4 border-t-[#E87932] bg-white p-5 text-[#31271F] shadow-[0_14px_40px_rgba(31,22,13,0.08)] sm:p-8">
          <div className="pointer-events-none absolute -right-8 -top-24 h-72 w-72 rounded-full border border-[#E87932]/10 after:absolute after:inset-8 after:rounded-full after:border after:border-dashed after:border-[#E87932]/20" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D96E2A]"><UserCog className="h-3.5 w-3.5" />Leadership · Member stewardship</div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Manage members</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#74685D]">Keep staff decisions attached to the right Honolua identity. Search the roster, record an action, and review its status.</p></div>
            <label className="relative block w-full md:max-w-sm"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a member by name or team" aria-label="Search members to manage" className="h-11 w-full rounded-xl border border-[#E9E2DA] bg-[#FFFCF8] pl-10 pr-3 text-sm text-[#31271F] outline-none transition placeholder:text-[#9A8C7D] focus:border-[#E87932]/60 focus:bg-white" /></label>
          </div>
        </motion.header>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[{ label: "Roster", value: loading ? "—" : members.length, tone: "#D96E2A" }, { label: "Active actions", value: loading ? "—" : activeSanctions.length, tone: "#D96E2A" }, { label: "Active bans", value: loading ? "—" : banCount, tone: "#D96E2A" }].map((item, index) => <motion.section key={item.label} initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : index * 0.06, duration: 0.3 }} className="flex items-center justify-between rounded-[20px] border border-lava/[0.08] bg-white p-4 shadow-[0_4px_18px_rgba(30,55,40,0.035)]"><div><div className="text-[10px] font-bold uppercase tracking-[0.17em] text-lava/40">{item.label}</div><div className="mt-1 text-3xl font-bold tabular-nums text-[#31271F]">{item.value}</div></div><span className="h-10 w-1 rounded-full" style={{ background: item.tone }} /></motion.section>)}
        </div>

        <section className="mt-6">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-base font-bold text-[#31271F]">Honolua roster</h2><p className="mt-1 text-xs text-lava/45">{filtered.length} {filtered.length === 1 ? "member" : "members"} · actions are linked to Roblox identity</p></div><button type="button" onClick={() => void load(true)} disabled={refreshing} className="inline-flex h-10 items-center gap-2 rounded-xl border border-lava/10 bg-white px-3.5 text-xs font-semibold text-[#31271F] transition hover:bg-[#FFF8EF] disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${refreshing && !reduceMotion ? "animate-spin" : ""}`} />Refresh roster</button></div>
          {error ? <div role="alert" className="rounded-[22px] border border-[#D96E2A]/15 bg-white px-5 py-12 text-center"><ShieldAlert className="mx-auto h-7 w-7 text-[#D96E2A]" /><p className="mt-3 text-sm font-semibold text-[#31271F]">{error}</p><button type="button" onClick={() => void load()} className="mt-4 rounded-xl bg-[#E87932] px-4 py-2.5 text-xs font-bold text-white">Try again</button></div> : loading ? <div className="grid gap-3 md:grid-cols-2">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-[96px] animate-pulse rounded-[22px] border border-lava/10 bg-white/70" />)}</div> : filtered.length ? <div className="grid gap-3 md:grid-cols-2">{filtered.map((member, index) => {
            const memberSanctions = sanctions.filter((sanction) => sanction.robloxUserId === String(member.userId))
            const memberActive = memberSanctions.filter(activeSanction)
            return <motion.article key={member.userId} initial={reduceMotion ? false : { opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : Math.min(index * 0.025, 0.2), duration: 0.28 }} className="relative flex min-w-0 items-center gap-3 overflow-hidden rounded-[22px] border border-lava/[0.08] bg-white p-4 shadow-[0_4px_18px_rgba(30,55,40,0.035)] sm:gap-4 sm:p-5"><span className={`absolute inset-y-4 left-0 w-[3px] rounded-r-full ${memberActive.some((sanction) => sanction.action === "ban") ? "bg-[#D96E2A]" : memberActive.length ? "bg-[#D96E2A]" : "bg-[#D9C9B8]"}`} /><MemberIdentity member={member} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2"><h3 className="truncate text-sm font-bold text-[#31271F]">{member.displayName || member.username}</h3><span className="truncate text-[10px] text-lava/40">@{member.username}</span></div><p className="mt-1 truncate text-[10px] font-semibold text-[#A87419]">{member.roleName || member.teamLabel || "Team member"} <span className="font-normal text-lava/40">· {member.teamLabel}</span></p><div className="mt-2 flex flex-wrap gap-1.5">{memberActive.length ? memberActive.slice(0, 2).map((sanction) => <span key={sanction.id} className={`rounded-full px-2 py-1 text-[9px] font-bold capitalize ${sanction.action === "ban" ? "bg-[#FFF0E3] text-[#B85D23]" : "bg-[#FFF2DF] text-[#9C6A2B]"}`}>{sanction.action}</span>) : <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF0E3] px-2 py-1 text-[9px] font-bold text-[#D96E2A]"><Check className="h-3 w-3" />Clear record</span>}{memberActive.length > 2 ? <span className="rounded-full bg-lava/5 px-2 py-1 text-[9px] text-lava/50">+{memberActive.length - 2}</span> : null}</div></div><button type="button" onClick={() => setSelected(member)} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#31271F]/10 bg-[#FAF7F3] px-3 text-[10px] font-bold text-[#31271F] transition hover:border-[#E8AA5D]/50 hover:bg-[#FFF5E5] sm:px-4 sm:text-xs">Manage member</button></motion.article>
          })}</div> : <div className="rounded-[22px] border border-dashed border-lava/15 bg-white/70 px-5 py-14 text-center"><Search className="mx-auto h-6 w-6 text-[#A87419]" /><h3 className="mt-3 text-sm font-bold text-[#31271F]">No members found</h3><p className="mt-1 text-xs text-lava/45">Try a different name or team.</p></div>}
        </section>
      </div>
      <SanctionDrawer key={selected?.userId || "closed"} member={selected} sanctions={sanctions.filter((sanction) => sanction.robloxUserId === String(selected?.userId))} onClose={() => setSelected(null)} onCreated={addSanction} onRevoked={updateSanction} reduceMotion={reduceMotion} />
    </main>
  )
}
