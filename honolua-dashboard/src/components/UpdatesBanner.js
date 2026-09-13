"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sparkles } from "lucide-react"

const DISMISS_KEY = "honolua_dismissed_update_id"
const EASE = [0.16, 1, 0.3, 1]

// Renders **bold** segments from plain-text update bodies without pulling in a markdown lib
function renderBody(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-reef-navy">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export default function UpdatesBanner() {
  const [update, setUpdate] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch("/api/updates", { cache: "no-store" })
        const j = await res.json().catch(() => ({}))
        if (cancelled || !res.ok || !j?.ok) return

        const latest = j.updates?.[0]
        if (!latest) return

        const dismissedId = localStorage.getItem(DISMISS_KEY)
        if (dismissedId === latest.id) return

        setUpdate(latest)
        setVisible(true)
      } catch {
        // fail silently — a broken banner shouldn't break the page
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  function dismiss() {
    if (update) localStorage.setItem(DISMISS_KEY, update.id)
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && update ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            onClick={dismiss}
            className="fixed inset-0 z-[100] bg-reef-navy/25 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-lava/10 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.12)] sm:p-7"
            >
              {/* soft orange glow accent */}
              <div
                className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full opacity-20 blur-3xl"
                style={{ background: "radial-gradient(circle, #F4B942, transparent 70%)" }}
              />

              <div className="relative flex items-start justify-between gap-3">
                <div
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#F4B942]/25 bg-[#F4B942]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#E6736F]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  New update
                </div>
                <button
                  onClick={dismiss}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-lava/10 text-lava/40 transition hover:bg-lava/5 hover:text-reef-navy"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <h2 className="relative mt-4 text-2xl font-bold text-reef-navy">{update.title}</h2>

              <p className="relative mt-3 text-sm leading-relaxed text-lava/60">
                {renderBody(update.body)}
              </p>

              {update.ctaLabel && update.ctaUrl ? (
                <a
                  href={update.ctaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="relative mt-4 inline-block text-sm font-semibold text-[#E6736F] hover:underline"
                >
                  {update.ctaLabel} →
                </a>
              ) : null}

              <div className="relative mt-6 flex justify-end">
                <motion.button
                  onClick={dismiss}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="rounded-xl border border-lava/10 px-5 py-2.5 text-sm font-semibold text-reef-navy transition hover:border-[#F4B942]/40 hover:bg-[#F4B942]/5"
                >
                  Got it
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  )
}