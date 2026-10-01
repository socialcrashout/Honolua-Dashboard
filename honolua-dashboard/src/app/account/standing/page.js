"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AlertTriangle, ArrowLeft, BadgeCheck, Ban, Clock3, FileText, LockKeyhole, Shield, ShieldAlert } from "lucide-react"

const ACTION_STYLE = {
  notice: { icon: FileText, label: "Notice", color: "#547A8A", tint: "#EAF1F3" },
  warning: { icon: AlertTriangle, label: "Warning", color: "#A87419", tint: "#FFF4DB" },
  restriction: { icon: LockKeyhole, label: "Restriction", color: "#765495", tint: "#F3ECF8" },
  suspension: { icon: ShieldAlert, label: "Suspension", color: "#BA623E", tint: "#FFF0E8" },
  ban: { icon: Ban, label: "Ban", color: "#A94D3E", tint: "#FCECE7" },
}

function dateLabel(value) {
  if (!value) return "No expiry"
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value))
}

function isActive(record) {
  return record.status === "active" && (!record.expiresAt || new Date(record.expiresAt) > new Date())
}

function recordStatus(record) {
  if (isActive(record)) return "Active"
  if (record.status === "revoked") return "Lifted"
  if (record.expiresAt && new Date(record.expiresAt) <= new Date()) return "Expired"
  return record.status
}

export default function AccountStandingPage() {
  const [records, setRecords] = useState([])
  const [username, setUsername] = useState("Member")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        await fetch("/api/verify/status", { cache: "no-store" })
        const response = await fetch("/api/account/standing", { cache: "no-store" })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(response.status === 401 ? "Sign in with Discord to view your account standing." : "Your account standing could not be loaded.")
        setRecords(Array.isArray(data.records) ? data.records : [])
        setUsername(data.username || "Member")
      } catch (loadError) {
        setError(loadError.message || "Your account standing could not be loaded.")
      } finally {
        setLoading(false)
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const activeRecords = records.filter(isActive)
  const isBlocked = activeRecords.some((record) => record.action === "ban" || record.action === "suspension" || (record.action === "restriction" && record.restrictions?.includes("verification")))

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Link href="/verify" className="inline-flex items-center gap-2 text-xs font-semibold text-lava/50 transition hover:text-reef-navy"><ArrowLeft className="h-3.5 w-3.5" />Back to verification</Link>
        <header className="relative mt-4 overflow-hidden rounded-[28px] bg-[#173B4A] p-6 text-white shadow-[0_18px_50px_rgba(23,59,74,0.15)] sm:p-9">
          <span className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full border border-white/10 after:absolute after:inset-8 after:rounded-full after:border after:border-dashed after:border-[#F4B942]/35" />
          <div className="relative flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#F4C674]"><Shield className="h-5 w-5" /></span><div><div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F4C674]">Honolua · Account record</div><h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Account standing</h1><p className="mt-2 text-sm text-white/60">A clear record of staff notices and access decisions for {username}.</p></div></div>
          <div className="relative mt-6 flex items-center gap-2 border-t border-white/10 pt-4 text-xs"><span className={`h-2 w-2 rounded-full ${isBlocked ? "bg-[#EE9278]" : "bg-[#8BC59A]"}`} />{loading ? "Checking your record…" : isBlocked ? "Some Honolua access is currently restricted" : activeRecords.length ? `${activeRecords.length} active ${activeRecords.length === 1 ? "record" : "records"}` : "No active restrictions"}</div>
        </header>

        <section className="mt-5 rounded-[24px] border border-lava/[0.08] bg-white p-5 shadow-[0_6px_24px_rgba(30,55,40,0.04)] sm:p-7">
          <div className="flex items-center justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A87419]">Your record</div><h2 className="mt-1 text-lg font-bold text-reef-navy">Staff decisions</h2></div><span className="rounded-full bg-[#FFF2DF] px-3 py-1.5 text-[10px] font-bold text-[#A87419]">{loading ? "…" : records.length}</span></div>
          {loading ? <div className="mt-5 space-y-3"><div className="h-24 animate-pulse rounded-2xl bg-[#F7F4EE]" /><div className="h-24 animate-pulse rounded-2xl bg-[#F7F4EE]" /></div> : error ? <p role="alert" className="mt-5 rounded-2xl bg-[#FFF4DB] px-4 py-4 text-sm text-[#775820]">{error}</p> : records.length ? <div className="mt-5 space-y-3">{records.map((record) => {
            const style = ACTION_STYLE[record.action] || ACTION_STYLE.notice
            const Icon = style.icon
            const active = isActive(record)
            return <article key={record.id} className="relative overflow-hidden rounded-2xl border border-lava/[0.08] bg-[#FFFEFC] p-4 sm:p-5"><span className="absolute inset-y-4 left-0 w-[3px] rounded-r-full" style={{ background: style.color }} /><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: style.tint, color: style.color }}><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-bold text-reef-navy">{style.label}</h3><span className="rounded-full px-2 py-0.5 text-[9px] font-bold capitalize" style={{ background: active ? style.tint : "#F2F1ED", color: active ? style.color : "#857E73" }}>{recordStatus(record)}</span><span className="text-[10px] text-lava/40">{dateLabel(record.createdAt)}</span></div><p className="mt-2 text-sm leading-6 text-reef-navy/85">{record.reason}</p>{record.details ? <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-lava/55">{record.details}</p> : null}<div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-lava/40"><span className="capitalize">{record.category}</span><span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{record.expiresAt ? `Until ${dateLabel(record.expiresAt)}` : record.days ? `${record.days} days` : "No expiry"}</span>{record.createdByName ? <span>Recorded by {record.createdByName}</span> : null}</div></div></div></article>
          })}</div> : <div className="mt-5 rounded-2xl border border-dashed border-[#547A5D]/20 bg-[#F6FAF5] px-5 py-12 text-center"><BadgeCheck className="mx-auto h-8 w-8 text-[#547A5D]" /><h3 className="mt-3 text-sm font-bold text-reef-navy">Your record is clear</h3><p className="mt-1 text-xs text-lava/45">If Honolua staff records an action, it will appear here with its reason and status.</p></div>}
        </section>

        <p className="mt-4 text-center text-[10px] leading-5 text-lava/40">If you believe something is incorrect, contact Honolua staff through the usual support channel.</p>
      </div>
    </main>
  )
}
