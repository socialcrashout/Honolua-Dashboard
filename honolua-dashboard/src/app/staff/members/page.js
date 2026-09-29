"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Activity, Crown, RefreshCw, Search, ShieldCheck, Users } from "lucide-react"

const EASE = [0.16, 1, 0.3, 1]

function initialsFor(member) {
  return (member.displayName || member.username || "?")
    .split(/[\s_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function MemberAvatar({ member, large = false }) {
  const [failed, setFailed] = useState(false)
  const size = large ? "h-14 w-14" : "h-12 w-12"

  return (
    <div className={`relative ${size} shrink-0 rounded-full bg-gradient-to-br from-[#F4B942]/70 via-[#E6736F]/75 to-[#F472B6]/70 p-[2px]`}>
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#FFF8EF] text-sm font-bold text-reef-navy">
        {member.avatarUrl && !failed ? (
          <img src={member.avatarUrl} alt="" onError={() => setFailed(true)} className="h-full w-full object-cover" />
        ) : initialsFor(member)}
      </div>
      {member.connected ? <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" title="Connected account" /> : null}
    </div>
  )
}

function MemberCard({ member, index, reduceMotion }) {
  return (
    <motion.article
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.32, delay: reduceMotion ? 0 : Math.min(index * 0.035, 0.28), ease: EASE, layout: { duration: 0.22 } }}
      whileHover={reduceMotion ? undefined : { y: -4, transition: { duration: 0.18 } }}
      className="group relative min-w-0 overflow-hidden rounded-[22px] border border-lava/[0.08] bg-white p-4 shadow-[0_4px_18px_rgba(30,55,40,0.035)] transition-shadow hover:shadow-[0_16px_32px_rgba(30,55,40,0.09)] sm:p-5"
    >
      <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-[#F4B942]/[0.10] blur-2xl transition-opacity group-hover:opacity-100 sm:opacity-60" />
      <div className="relative flex min-w-0 items-center gap-3.5">
        <MemberAvatar member={member} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-reef-navy sm:text-[15px]">{member.displayName || member.username}</div>
          <div className="mt-0.5 truncate text-xs text-lava/45">@{member.username}</div>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F4B942]/10 text-[#A87419]">
          {member.rank >= 240 ? <Crown className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
        </span>
      </div>

      <div className="relative mt-4 flex min-h-7 flex-wrap gap-1.5">
        <span className="inline-flex max-w-full items-center rounded-full bg-reef-navy px-3 py-1.5 text-[10px] font-semibold text-white sm:text-[11px]">
          <span className="truncate">{member.roleName || member.teamLabel || "Team member"}</span>
        </span>
        {member.departments.slice(0, 2).map((department) => (
          <span key={department} className="inline-flex max-w-full items-center rounded-full border border-[#E4EDE3] bg-[#F1F7F0] px-3 py-1.5 text-[10px] font-semibold text-[#456A50] sm:text-[11px]">
            <span className="truncate">{department}</span>
          </span>
        ))}
        {member.departments.length > 2 ? <span className="rounded-full bg-lava/5 px-2.5 py-1.5 text-[10px] font-semibold text-lava/50">+{member.departments.length - 2}</span> : null}
      </div>

      <div className="relative mt-3 flex items-center justify-between border-t border-lava/[0.06] pt-3 text-[11px] text-lava/45">
        <span className="inline-flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-[#D7A138]" /> Group rank {member.rank ?? "—"}</span>
        {member.connected ? <span className="font-semibold text-emerald-700">You</span> : <span>{member.teamLabel}</span>}
      </div>
    </motion.article>
  )
}

function MemberSkeleton({ index }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.04 }} className="h-[154px] animate-pulse rounded-[22px] border border-lava/[0.06] bg-white/80 p-5">
      <div className="flex items-center gap-3"><div className="h-12 w-12 rounded-full bg-lava/[0.07]" /><div className="flex-1"><div className="h-3 w-2/3 rounded bg-lava/[0.07]" /><div className="mt-2 h-2.5 w-1/2 rounded bg-lava/[0.05]" /></div></div>
      <div className="mt-5 flex gap-2"><div className="h-6 w-24 rounded-full bg-lava/[0.06]" /><div className="h-6 w-20 rounded-full bg-lava/[0.05]" /></div>
    </motion.div>
  )
}

export default function MembersPage() {
  const reduceMotion = useReducedMotion()
  const [teams, setTeams] = useState([])
  const [membersByTeam, setMembersByTeam] = useState({})
  const [departments, setDepartments] = useState([])
  const [profile, setProfile] = useState(null)
  const [query, setQuery] = useState("")
  const [activeTeam, setActiveTeam] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function loadDirectory() {
    setLoading(true)
    setError("")
    try {
      const [teamResponse, profileResponse, departmentResponse] = await Promise.all([
        fetch("/api/team", { cache: "no-store" }),
        fetch("/api/auth/me", { cache: "no-store" }).catch(() => null),
        fetch("/api/departments", { cache: "no-store" }).catch(() => null),
      ])
      if (!teamResponse.ok) throw new Error("The member directory could not be loaded.")
      const teamData = await teamResponse.json()
      setTeams(Array.isArray(teamData.teams) ? teamData.teams : [])
      setMembersByTeam(teamData.members && typeof teamData.members === "object" ? teamData.members : {})

      if (profileResponse?.ok) {
        const profileData = await profileResponse.json().catch(() => ({}))
        setProfile(profileData.user || null)
      } else setProfile(null)

      if (departmentResponse?.ok) {
        const departmentData = await departmentResponse.json().catch(() => ({}))
        setDepartments(Array.isArray(departmentData.departments) ? departmentData.departments : [])
      } else setDepartments([])
    } catch (loadError) {
      setError(loadError.message || "The member directory could not be loaded.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadDirectory() }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const departmentNamesByMember = useMemo(() => {
    const byMember = new Map()
    departments.forEach((department) => {
      department.members?.forEach((member) => {
        const key = String(member.robloxId)
        const list = byMember.get(key) || []
        list.push(department.name)
        byMember.set(key, list)
      })
    })
    return byMember
  }, [departments])

  const allMembers = useMemo(() => {
    const connectedUsername = profile?.robloxUsername?.toLocaleLowerCase()
    return teams.flatMap((team) => (membersByTeam[team.key] || []).map((member) => ({
      ...member,
      departments: departmentNamesByMember.get(String(member.userId)) || [],
      connected: Boolean(connectedUsername && member.username?.toLocaleLowerCase() === connectedUsername),
    }))).sort((left, right) => (right.rank || 0) - (left.rank || 0) || left.username.localeCompare(right.username))
  }, [teams, membersByTeam, departmentNamesByMember, profile])

  const visibleMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return allMembers.filter((member) => {
      const inTeam = activeTeam === "all" || member.teamKey === activeTeam
      const searchable = [member.displayName, member.username, member.roleName, member.teamLabel, ...member.departments].join(" ").toLocaleLowerCase()
      return inTeam && (!normalizedQuery || searchable.includes(normalizedQuery))
    })
  }, [allMembers, activeTeam, query])

  const connectedMember = allMembers.find((member) => member.connected)
  const connectedName = profile?.robloxUsername || profile?.username || "No account connected"

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-9">
      <div className="mx-auto max-w-7xl">
        <motion.header initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }} className="relative overflow-hidden rounded-[26px] border border-lava/[0.07] bg-white/90 p-5 shadow-[0_4px_24px_rgba(30,55,40,0.045)] sm:p-7">
          <div className="pointer-events-none absolute -right-12 -top-24 h-56 w-56 rounded-full bg-[#F4B942]/[0.13] blur-3xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#A87419]"><span className="h-1.5 w-1.5 rounded-full bg-[#E6736F]" />People directory</div>
              <h1 className="text-2xl font-bold tracking-tight text-reef-navy sm:text-3xl">Members</h1>
              <p className="mt-1 max-w-xl text-sm leading-6 text-lava/50">Find the people behind Honolua and see their team roles at a glance.</p>
            </div>
            <div className="flex w-full flex-col gap-2.5 sm:flex-row lg:w-auto lg:min-w-[390px]">
              <label className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-lava/35" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search members..." aria-label="Search members" className="h-11 w-full rounded-xl border border-lava/10 bg-[#FFFCF7] pl-10 pr-3 text-sm text-reef-navy outline-none transition placeholder:text-lava/35 focus:border-[#E6736F]/50 focus:ring-2 focus:ring-[#E6736F]/10" />
              </label>
              <button type="button" onClick={() => void loadDirectory()} disabled={loading} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-lava/10 bg-white px-4 text-sm font-semibold text-reef-navy transition hover:border-[#E6736F]/30 hover:bg-[#FFF8EF] disabled:opacity-60">
                <RefreshCw className={`h-4 w-4 ${loading && !reduceMotion ? "animate-spin" : ""}`} />Refresh
              </button>
            </div>
          </div>
        </motion.header>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <motion.section initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42, delay: 0.08, ease: EASE }} className="rounded-[22px] border border-lava/[0.07] bg-white p-5 shadow-[0_4px_20px_rgba(30,55,40,0.035)] sm:p-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6F8A70]">Total members</div>
            <div className="mt-1 flex items-end gap-2"><motion.span key={allMembers.length} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold tabular-nums tracking-tight text-reef-navy">{loading ? "—" : allMembers.length}</motion.span><span className="pb-1 text-xs text-lava/45">synced team directory</span></div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-lava/[0.05]"><motion.div initial={{ width: 0 }} animate={{ width: loading ? "12%" : `${Math.min(allMembers.length * 3, 100)}%` }} transition={{ duration: 0.8, ease: EASE }} className="h-full rounded-full bg-gradient-to-r from-[#F4B942] via-[#E6736F] to-[#F472B6]" /></div>
          </motion.section>

          <motion.section initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42, delay: 0.14, ease: EASE }} className="flex min-w-0 items-center gap-4 rounded-[22px] border border-lava/[0.07] bg-white p-5 shadow-[0_4px_20px_rgba(30,55,40,0.035)] sm:p-6">
            {connectedMember ? <MemberAvatar member={connectedMember} large /> : <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#F4B942]/10 text-[#A87419]"><Users className="h-6 w-6" /></span>}
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6F8A70]">Connected user</div>
              <div className="mt-1 truncate text-lg font-bold text-reef-navy">{connectedName}</div>
              <div className="mt-0.5 truncate text-xs text-lava/45">{profile ? `${profile.robloxRank || connectedMember?.roleName || "Honolua member"} · currently signed in` : "Sign in to connect your account"}</div>
            </div>
            {profile ? <span className="hidden shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 sm:inline-flex">Online</span> : null}
          </motion.section>
        </div>

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div><h2 className="text-base font-bold text-reef-navy">Team roster</h2><p className="mt-0.5 text-xs text-lava/45">{visibleMembers.length} {visibleMembers.length === 1 ? "person" : "people"} shown</p></div>
            {activeTeam !== "all" || query ? <button type="button" onClick={() => { setActiveTeam("all"); setQuery("") }} className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-[#B45B55] transition hover:bg-[#E6736F]/[0.08]">Clear filters</button> : null}
          </div>

          {teams.length > 0 ? (
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide" role="tablist" aria-label="Filter by team">
              {[{ key: "all", label: "Everyone" }, ...teams].map((team) => (
                <button key={team.key} type="button" role="tab" aria-selected={activeTeam === team.key} onClick={() => setActiveTeam(team.key)} className={`min-h-10 shrink-0 rounded-full border px-4 text-xs font-semibold transition ${activeTeam === team.key ? "border-reef-navy bg-reef-navy text-white shadow-sm" : "border-lava/10 bg-white text-lava/55 hover:border-[#E6736F]/30 hover:text-reef-navy"}`}>
                  {team.label}
                </button>
              ))}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-[22px] border border-[#E6736F]/15 bg-white px-5 py-12 text-center">
              <p className="text-sm font-semibold text-reef-navy">{error}</p>
              <button type="button" onClick={() => void loadDirectory()} className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-reef-navy px-4 text-sm font-semibold text-white transition hover:bg-reef-navy/90">Try again</button>
            </div>
          ) : loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <MemberSkeleton key={index} index={index} />)}</div>
          ) : visibleMembers.length ? (
            <motion.div layout className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {visibleMembers.map((member, index) => <MemberCard key={member.userId} member={member} index={index} reduceMotion={reduceMotion} />)}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-lava/15 bg-white/70 px-5 py-14 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4B942]/10 text-[#A87419]"><Search className="h-5 w-5" /></span>
              <h3 className="mt-3 text-sm font-bold text-reef-navy">No members found</h3>
              <p className="mt-1 text-xs text-lava/45">Try a different name or choose another team.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
