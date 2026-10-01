"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { AlertTriangle, Ban, Clock3, FileText, LockKeyhole, ShieldAlert, X } from "lucide-react"

const EASE = [0.16, 1, 0.3, 1]
const DISMISSED_PREFIX = "honolua_dismissed_member_action_"
const ACTIONS = {
  notice: { title: "You received a notice", label: "Notice", icon: FileText },
  warning: { title: "You received a warning", label: "Warning", icon: AlertTriangle },
  restriction: { title: "A restriction was placed on your account", label: "Restriction", icon: LockKeyhole },
  suspension: { title: "Your account is suspended", label: "Suspension", icon: ShieldAlert },
  ban: { title: "You are banned from Honolua", label: "Ban", icon: Ban },
}

function dateLabel(value) {
  if (!value) return "Until staff lifts it"
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value))
}

export default function MemberSanctionBanner() {
  const [record, setRecord] = useState(null)
  const [visible, setVisible] = useState(false)

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/account/standing", { cache: "no-store" })
      if (!response.ok) return
      const data = await response.json().catch(() => ({}))
      const latest = data.records?.[0]
      if (!latest || localStorage.getItem(`${DISMISSED_PREFIX}${latest.id}`)) return
      setRecord(latest)
      setVisible(true)
    } catch {
      // A member notice should never prevent the rest of the site from loading.
    }
  }, [])

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { void load() }, 0)
    const interval = window.setInterval(load, 30000)
    return () => { window.clearTimeout(initialLoad); window.clearInterval(interval) }
  }, [load])

  function dismiss() {
    if (record) localStorage.setItem(`${DISMISSED_PREFIX}${record.id}`, "1")
    setVisible(false)
  }

  const action = ACTIONS[record?.action] || ACTIONS.notice
  const Icon = action.icon

  return (
    <AnimatePresence>
      {visible && record ? <>
        <motion.button type="button" aria-label="Dismiss account notice" onClick={dismiss} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] cursor-default bg-[#21180F]/45 backdrop-blur-sm" />
        <div className="pointer-events-none fixed inset-0 z-[111] flex items-center justify-center p-4 sm:p-6">
          <motion.section role="dialog" aria-modal="true" aria-labelledby="member-action-title" initial={{ opacity: 0, y: 22, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 14, scale: 0.98 }} transition={{ duration: 0.28, ease: EASE }} className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-[28px] border border-[#E8D7C4] bg-white p-6 shadow-[0_28px_90px_rgba(31,22,13,0.26)] sm:p-7">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-[#E87932]" />
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF0E3] text-[#D96E2A]"><Icon className="h-5 w-5" /></span>
              <button type="button" onClick={dismiss} aria-label="Close account notice" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E9E2DA] text-[#74685D] transition hover:bg-[#FFF6ED] hover:text-[#31271F]"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#D96E2A]">Honolua · Account update</div>
            <h2 id="member-action-title" className="mt-2 text-2xl font-bold tracking-tight text-[#31271F]">{action.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[#74685D]">{record.reason || `A ${action.label.toLowerCase()} was added to your account record.`}</p>
            {record.details ? <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-[#FFF8F1] p-3.5 text-xs leading-5 text-[#74685D]">{record.details}</p> : null}
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[#8B7B6C]"><Clock3 className="h-3.5 w-3.5 text-[#D96E2A]" />{record.expiresAt ? `Until ${dateLabel(record.expiresAt)}` : record.action === "notice" || record.action === "warning" ? "Added to your account record" : dateLabel(null)}</div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={dismiss} className="h-11 rounded-xl border border-[#E9E2DA] px-4 text-sm font-semibold text-[#51463D] transition hover:bg-[#FAF7F3]">Got it</button>
              <Link href="/account/standing" onClick={dismiss} className="inline-flex h-11 items-center justify-center rounded-xl bg-[#E87932] px-4 text-sm font-bold text-white transition hover:bg-[#CF6425]">View account standing</Link>
            </div>
          </motion.section>
        </div>
      </> : null}
    </AnimatePresence>
  )
}
