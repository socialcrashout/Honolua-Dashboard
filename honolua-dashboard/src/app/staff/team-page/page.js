"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import {
  Award, BadgeCheck, Check, ChevronDown, CircleCheck, Crown, Flower2, Gem,
  Handshake, HeartHandshake, Medal, Search, ShieldCheck, Sparkles, Star, Tag,
  Users, X,
} from "lucide-react"
import { TEAM_TAG_COLORS, TEAM_TAG_ICONS } from "@/lib/teamPageTags"

const ICONS = { Award, BadgeCheck, CircleCheck, Crown, Flower2, Gem, Handshake, HeartHandshake, Medal, ShieldCheck, Sparkles, Star }
const DEFAULT_COLOR = TEAM_TAG_COLORS[0]

function initials(member) {
  return (member.displayName || member.username || "?").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()
}

function TagBadge({ tag, onRemove, busy }) {
  const Icon = ICONS[tag.icon] || BadgeCheck
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold" style={{ color: tag.color, backgroundColor: `${tag.color}12`, borderColor: `${tag.color}30` }}>
      <Icon className="h-3.5 w-3.5" />{tag.name}
      {onRemove ? <button type="button" aria-label={`Remove ${tag.name}`} disabled={busy} onClick={onRemove} className="ml-0.5 rounded-full p-0.5 opacity-65 transition hover:bg-white/70 hover:opacity-100 disabled:opacity-30"><X className="h-3 w-3" /></button> : null}
    </span>
  )
}

function TagEditor({ member, tags, onAdded, onRemoved }) {
  const [name, setName] = useState("")
  const [icon, setIcon] = useState("BadgeCheck")
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function addTag(event) {
    event.preventDefault()
    setError("")
    setBusy(true)
    try {
      const response = await fetch("/api/staff/team-tags", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: String(member.userId), username: member.username, tag: { name, icon, color } }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || "Could not add this tag.")
      onAdded(result.tag)
      setName("")
    } catch (saveError) {
      setError(saveError.message || "Could not add this tag.")
    } finally { setBusy(false) }
  }

  async function removeTag(tag) {
    setError("")
    setBusy(true)
    try {
      const response = await fetch("/api/staff/team-tags", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: String(member.userId), tagId: tag.id }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || "Could not remove this tag.")
      onRemoved(tag.id)
    } catch (saveError) {
      setError(saveError.message || "Could not remove this tag.")
    } finally { setBusy(false) }
  }

  const PreviewIcon = ICONS[icon] || BadgeCheck
  return (
    <div className="border-t border-[#E9DDCE] bg-[#FFFCF7] px-4 py-5 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#A9631F]"><Tag className="h-3.5 w-3.5" />Member tags <span className="font-medium normal-case tracking-normal text-[#817768]">{tags.length}/10</span></div>
          <div className="flex min-h-10 flex-wrap gap-2">
            {tags.length ? tags.map((tag) => <TagBadge key={tag.id} tag={tag} busy={busy} onRemove={() => removeTag(tag)} />) : <span className="text-sm text-[#918779]">No tags yet. Add a public label for this profile.</span>}
          </div>
        </div>
        <form onSubmit={addTag} className="rounded-2xl border border-[#E9DDCE] bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div><h3 className="text-sm font-semibold text-[#173B4A]">Add a tag</h3><p className="mt-0.5 text-xs text-[#918779]">These labels appear on the public team page.</p></div>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ color, backgroundColor: `${color}12` }}><PreviewIcon className="h-3.5 w-3.5" />{name.trim() || "Preview"}</span>
          </div>
          <label className="mb-3 block text-xs font-semibold text-[#59646A]">Tag name
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={24} placeholder="Verified, Mentor, Builder…" className="mt-1.5 h-10 w-full rounded-xl border border-[#E6DED4] bg-[#FFFCF7] px-3 text-sm font-normal text-[#173B4A] outline-none transition focus:border-[#D99550] focus:ring-2 focus:ring-[#F4B942]/20" required />
          </label>
          <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="text-xs font-semibold text-[#59646A]">Icon
              <select value={icon} onChange={(event) => setIcon(event.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-[#E6DED4] bg-white px-3 text-sm font-normal text-[#173B4A] outline-none focus:border-[#D99550]">
                {TEAM_TAG_ICONS.map((key) => <option key={key} value={key}>{key.replace(/([a-z])([A-Z])/g, "$1 $2")}</option>)}
              </select>
            </label>
            <fieldset>
              <legend className="text-xs font-semibold text-[#59646A]">Color</legend>
              <div className="mt-2 flex h-8 items-center gap-1.5">
                {TEAM_TAG_COLORS.map((swatch) => <button key={swatch} type="button" onClick={() => setColor(swatch)} aria-label={`Choose ${swatch}`} aria-pressed={color === swatch} className="flex h-7 w-7 items-center justify-center rounded-full border-2 transition hover:scale-110" style={{ backgroundColor: swatch, borderColor: color === swatch ? "#173B4A" : "white", boxShadow: color === swatch ? "0 0 0 1px #173B4A" : "none" }}>{color === swatch ? <Check className="h-3.5 w-3.5 text-white" /> : null}</button>)}
              </div>
            </fieldset>
          </div>
          {error ? <p role="alert" className="mb-2 text-xs font-medium text-rose-700">{error}</p> : null}
          <button type="submit" disabled={busy || tags.length >= 10 || !name.trim()} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#173B4A] px-4 text-sm font-semibold text-white transition hover:bg-[#245463] disabled:cursor-not-allowed disabled:opacity-45"><Tag className="h-4 w-4" />{busy ? "Saving…" : "Add tag"}</button>
        </form>
      </div>
    </div>
  )
}

export default function TeamPageManager() {
  const [teams, setTeams] = useState([])
  const [members, setMembers] = useState([])
  const [tagsByMember, setTagsByMember] = useState({})
  const [search, setSearch] = useState("")
  const [teamFilter, setTeamFilter] = useState("all")
  const [expandedId, setExpandedId] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch("/api/team", { cache: "no-store" }).then(async (response) => { const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "Could not load the roster."); return data }),
      fetch("/api/staff/team-tags", { cache: "no-store" }).then(async (response) => { const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "Could not load saved tags."); return data }),
    ]).then(([roster, saved]) => {
      if (cancelled) return
      const allMembers = (roster.teams || []).flatMap((team) => (roster.members?.[team.key] || []).map((member) => ({ ...member, teamLabel: team.label })))
      setTeams(roster.teams || [])
      setMembers(allMembers)
      setTagsByMember(Object.fromEntries((saved.members || []).map((entry) => [String(entry.userId), entry.tags || []])))
    }).catch((loadError) => { if (!cancelled) setError(loadError.message || "Could not load the team page.") }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return members.filter((member) => (teamFilter === "all" || member.teamKey === teamFilter) && (!query || `${member.displayName} ${member.username} ${member.roleName}`.toLowerCase().includes(query)))
  }, [members, search, teamFilter])

  function addTag(userId, tag) {
    setTagsByMember((current) => ({ ...current, [userId]: [...(current[userId] || []), tag] }))
  }
  function removeTag(userId, tagId) {
    setTagsByMember((current) => ({ ...current, [userId]: (current[userId] || []).filter((tag) => tag.id !== tagId) }))
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-7 sm:py-9 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="relative isolate mb-6 overflow-hidden rounded-[28px] border border-[#E8D8C4] bg-gradient-to-br from-white via-[#FFFCF7] to-[#FFF0DB] p-6 shadow-[0_16px_48px_rgba(125,78,27,0.07)] sm:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-[#E6B978]/30" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#A9631F]"><Users className="h-3.5 w-3.5" />Roster management</div>
              <h1 className="text-3xl font-semibold tracking-tight text-[#173B4A] sm:text-4xl">Team page</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#817768]">Curate the public Honolua team directory. Add small, distinctive tags to recognize verified members, mentors, builders, and more.</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-[#E9DDCE] bg-white/80 px-4 py-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF2DF] text-[#B36D20]"><Users className="h-5 w-5" /></span>
              <div><div className="text-xl font-semibold leading-none text-[#173B4A]">{loading ? "—" : members.length}</div><div className="mt-1 text-[11px] text-[#918779]">listed members</div></div>
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-[24px] border border-[#E9DDCE] bg-white shadow-[0_10px_35px_rgba(30,55,40,0.04)]">
          <div className="flex flex-col gap-3 border-b border-[#EEE5DA] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative block sm:w-72"><span className="sr-only">Search team members</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B9185]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or role" className="h-10 w-full rounded-xl border border-[#E6DED4] bg-[#FFFCF7] pl-9 pr-3 text-sm text-[#173B4A] outline-none focus:border-[#D99550]" /></label>
              <label><span className="sr-only">Filter by team</span><select value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)} className="h-10 w-full rounded-xl border border-[#E6DED4] bg-white px-3 text-sm text-[#173B4A] outline-none focus:border-[#D99550] sm:w-52"><option value="all">All teams</option>{teams.map((team) => <option key={team.key} value={team.key}>{team.label}</option>)}</select></label>
            </div>
            <div className="text-xs text-[#918779]">{filteredMembers.length} {filteredMembers.length === 1 ? "person" : "people"}</div>
          </div>

          {error ? <div role="alert" className="m-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div> : null}
          {loading ? <div className="space-y-3 p-5">{Array.from({ length: 5 }, (_, i) => <div key={i} className="h-[78px] animate-pulse rounded-2xl bg-[#F8F3EC]" />)}</div> : null}
          {!loading && !error && !filteredMembers.length ? <div className="px-5 py-16 text-center"><Users className="mx-auto h-8 w-8 text-[#C7BBAA]" /><p className="mt-3 text-sm font-medium text-[#173B4A]">No team members match.</p><p className="mt-1 text-xs text-[#918779]">Try another name or team.</p></div> : null}
          {!loading && !error && filteredMembers.length ? <div className="divide-y divide-[#F0E9E0]">
            {filteredMembers.map((member) => {
              const userId = String(member.userId)
              const tags = tagsByMember[userId] || []
              const isOpen = expandedId === userId
              return <article key={userId} className="transition-colors hover:bg-[#FFFEFC]">
                <button type="button" aria-expanded={isOpen} onClick={() => setExpandedId(isOpen ? "" : userId)} className="flex w-full items-center gap-3 px-4 py-4 text-left sm:gap-4 sm:px-5">
                  <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#FFF3E2] text-sm font-bold text-[#A9631F]">{member.avatarUrl ? <Image src={member.avatarUrl} alt="" width={96} height={96} unoptimized className="absolute inset-0 h-full w-full object-cover" /> : initials(member)}</span>
                  <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="truncate text-sm font-semibold text-[#173B4A]">{member.displayName || member.username}</span><span className="text-xs text-[#918779]">@{member.username}</span></span><span className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#8B8174]"><span className="font-medium text-[#A9631F]">{member.roleName}</span><span>·</span><span>{member.teamLabel}</span></span></span>
                  <span className="hidden max-w-[38%] flex-wrap justify-end gap-1.5 sm:flex">{tags.slice(0, 3).map((tag) => <TagBadge key={tag.id} tag={tag} />)}{tags.length > 3 ? <span className="rounded-full bg-[#F5F0E9] px-2.5 py-1 text-[11px] font-medium text-[#817768]">+{tags.length - 3}</span> : null}</span>
                  <span className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#817768] transition" style={{ background: isOpen ? "#FFF2DF" : "transparent", color: isOpen ? "#A9631F" : undefined }}><ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} /></span>
                </button>
                {isOpen ? <TagEditor member={member} tags={tags} onAdded={(tag) => addTag(userId, tag)} onRemoved={(tagId) => removeTag(userId, tagId)} /> : null}
              </article>
            })}
          </div> : null}
        </section>
        <p className="mt-4 flex items-center gap-2 px-1 text-xs text-[#918779]"><ShieldCheck className="h-3.5 w-3.5 text-[#4B9461]" />Tag changes are owner-only and appear on the public team directory.</p>
      </div>
    </main>
  )
}
