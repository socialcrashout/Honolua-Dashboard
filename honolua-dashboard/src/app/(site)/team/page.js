"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Award, BadgeCheck, CircleCheck, Crown, Flower2, Gem, Handshake, HeartHandshake, Medal, ShieldCheck, Sparkles, Star, Users } from "lucide-react"
import Nav from "@/components/Nav.js"
import Footer from "@/components/Footer.js"
import { TEAM_TAG_NEON_COLORS } from "@/lib/teamPageTags"

const TAG_ICONS = { Award, BadgeCheck, CircleCheck, Crown, Flower2, Gem, Handshake, HeartHandshake, Medal, ShieldCheck, Sparkles, Star }

function tagStyle(color) {
  const neon = TEAM_TAG_NEON_COLORS.includes(color)
  return {
    color: neon ? "#173B4A" : color,
    backgroundColor: neon ? `${color}35` : `${color}12`,
    borderColor: neon ? color : `${color}30`,
    boxShadow: neon ? `0 0 11px ${color}55` : undefined,
  }
}

function initials(member) {
  return (member.displayName || member.username || "?").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()
}

function MemberCard({ member, tags = [] }) {
  const [imageFailed, setImageFailed] = useState(false)
  return (
    <article className="group flex items-center gap-4 rounded-2xl border border-[#EAE0D4] bg-white/90 p-4 shadow-[0_3px_14px_rgba(35,47,47,0.025)] transition duration-200 hover:-translate-y-0.5 hover:border-[#D9B88C] hover:shadow-[0_12px_28px_rgba(35,47,47,0.08)] sm:p-5">
      <div className="relative h-[58px] w-[58px] shrink-0 overflow-hidden rounded-[18px] bg-[#FFF3E2] ring-1 ring-[#E8D7C0]">
        {member.avatarUrl && !imageFailed ? <Image src={member.avatarUrl} alt="" width={116} height={116} unoptimized onError={() => setImageFailed(true)} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> : <span className="flex h-full w-full items-center justify-center text-sm font-bold tracking-wide text-[#A9631F]">{initials(member)}</span>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h4 className="truncate text-sm font-semibold tracking-[-0.01em] text-[#173B4A]">{member.displayName || member.username}</h4>
          <span className="truncate text-xs text-[#958B7F]">@{member.username}</span>
        </div>
        <p className="mt-1 text-xs font-medium text-[#A9631F]">{member.roleName}</p>
        {tags.length ? <div className="mt-2.5 flex flex-wrap gap-1.5">{tags.map((tag) => { const Icon = TAG_ICONS[tag.icon] || BadgeCheck; return <span key={tag.id} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold" style={tagStyle(tag.color)}><Icon className="h-3 w-3" />{tag.name}</span> })}</div> : null}
      </div>
      <span aria-hidden="true" className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F8F5F0] text-[#A79B8B] sm:flex"><Users className="h-4 w-4" /></span>
    </article>
  )
}

function TeamDirectory() {
  const [teams, setTeams] = useState(null)
  const [membersByTeam, setMembersByTeam] = useState({})
  const [tagsByMember, setTagsByMember] = useState({})
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch("/api/team", { cache: "no-store" }).then(async (res) => { const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data.error || "Could not load the roster."); return data }),
      fetch("/api/team/tags", { cache: "no-store" }).then((res) => res.ok ? res.json() : { tags: {} }).catch(() => ({ tags: {} })),
    ]).then(([roster, tagData]) => {
      if (cancelled) return
      setTeams(roster.teams || [])
      setMembersByTeam(roster.members || {})
      setTagsByMember(tagData.tags || {})
    }).catch((loadError) => { if (!cancelled) setError(loadError.message || "Could not load the team roster.") })
    return () => { cancelled = true }
  }, [])

  const total = useMemo(() => Object.values(membersByTeam).reduce((sum, members) => sum + members.length, 0), [membersByTeam])

  return (
    <main className="min-h-screen bg-[#FBF9F5] pb-24 pt-24 sm:pt-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <header className="relative isolate mb-12 overflow-hidden rounded-[30px] border border-[#E8D8C4] bg-gradient-to-br from-white via-[#FFFCF7] to-[#FFF0DB] px-6 py-10 shadow-[0_18px_50px_rgba(125,78,27,0.07)] sm:px-10 sm:py-14">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-36 h-[26rem] w-[26rem] rounded-full border border-[#E6B978]/30" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-6 bottom-[-9rem] h-64 w-64 rounded-full bg-[#F4B942]/15 blur-3xl" />
          <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E9D8C1] bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#A9631F]"><Users className="h-3.5 w-3.5" />The people of Honolua</div>
              <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.045em] text-[#173B4A] sm:text-5xl md:text-6xl">Good people.<br /><span className="font-serif font-medium italic text-[#B36D20]">One island.</span></h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-[#756D63] sm:text-base">Meet the team that welcomes guests, builds the experience, and brings a little more life to Honolua every day.</p>
            </div>
            <div className="flex w-fit items-center gap-3 rounded-2xl border border-[#E9DDCE] bg-white/85 px-4 py-3 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF2DF] text-[#B36D20]"><Users className="h-5 w-5" /></span>
              <div><div className="text-xl font-semibold leading-none text-[#173B4A]">{teams ? total : "—"}</div><div className="mt-1 text-[11px] text-[#918779]">team members</div></div>
            </div>
          </div>
        </header>

        {error ? <div role="alert" className="rounded-2xl border border-rose-200 bg-white px-5 py-4 text-sm text-rose-700">{error}</div> : null}
        {!teams && !error ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-[94px] animate-pulse rounded-2xl bg-[#F0EAE1]" />)}</div> : null}
        {teams && total === 0 && !error ? <div className="rounded-3xl border border-dashed border-[#E6D8C6] bg-white/70 px-5 py-16 text-center"><Users className="mx-auto h-8 w-8 text-[#C9B99F]" /><p className="mt-3 text-sm font-semibold text-[#173B4A]">The team directory is getting ready.</p></div> : null}

        {teams?.map((team) => {
          const members = membersByTeam[team.key] || []
          if (!members.length) return null
          return <section key={team.key} className="mb-12 last:mb-0">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-[#E9E0D5] pb-3">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B36D20]">Honolua team</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-[#173B4A] sm:text-2xl">{team.label}</h2></div>
              <span className="rounded-full border border-[#E8DED1] bg-white px-3 py-1.5 text-xs font-medium text-[#817768]">{members.length} {members.length === 1 ? "member" : "members"}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{members.map((member) => <MemberCard key={member.userId} member={member} tags={tagsByMember[String(member.userId)] || []} />)}</div>
          </section>
        })}
      </div>
    </main>
  )
}

export default function Team() {
  return <div className="min-h-screen"><Nav /><TeamDirectory /><Footer /></div>
}
