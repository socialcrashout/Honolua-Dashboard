"use client"

import { useEffect, useState } from "react"
import { createElement } from "react"
import { X } from "lucide-react"

const COLOR_STYLES = {
  amber: {
    bg: "bg-gradient-to-r from-amber-600/20 via-amber-500/15 to-amber-600/20",
    border: "border-amber-400/25",
    text: "text-amber-50",
    accent: "bg-amber-400",
  },
  coral: {
    bg: "bg-gradient-to-r from-rose-600/20 via-rose-500/15 to-rose-600/20",
    border: "border-rose-400/25",
    text: "text-rose-50",
    accent: "bg-rose-400",
  },
  pink: {
    bg: "bg-gradient-to-r from-pink-600/20 via-pink-500/15 to-pink-600/20",
    border: "border-pink-400/25",
    text: "text-pink-50",
    accent: "bg-pink-400",
  },
  teal: {
    bg: "bg-gradient-to-r from-teal-600/20 via-teal-500/15 to-teal-600/20",
    border: "border-teal-400/25",
    text: "text-teal-50",
    accent: "bg-teal-400",
  },
  violet: {
    bg: "bg-gradient-to-r from-violet-600/20 via-violet-500/15 to-violet-600/20",
    border: "border-violet-400/25",
    text: "text-violet-50",
    accent: "bg-violet-400",
  },
  slate: {
    bg: "bg-gradient-to-r from-slate-600/20 via-slate-500/15 to-slate-600/20",
    border: "border-slate-400/25",
    text: "text-slate-50",
    accent: "bg-slate-400",
  },
}

const DISMISS_PREFIX = "yumi-announcement-dismissed:"

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState(null)
  const [dismissed, setDismissed] = useState(true) // default true, only show once confirmed
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/site-settings", { cache: "no-store" })
        const j = await res.json().catch(() => ({}))
        if (cancelled) return
        if (res.ok && j?.ok && j.announcement?.enabled && j.announcement.message) {
          setAnnouncement(j.announcement)
          const dismissKey = DISMISS_PREFIX + hashMessage(j.announcement.message)
          const alreadyDismissed = localStorage.getItem(dismissKey) === "1"
          setDismissed(alreadyDismissed)
          if (!alreadyDismissed) {
            requestAnimationFrame(() => setMounted(true))
          }
        }
      } catch {
        // fail silently, banner just doesn't show
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  function hashMessage(msg) {
    let hash = 0
    for (let i = 0; i < msg.length; i++) {
      hash = (hash << 5) - hash + msg.charCodeAt(i)
      hash |= 0
    }
    return String(hash)
  }

  function handleDismiss() {
    if (!announcement) return
    const dismissKey = DISMISS_PREFIX + hashMessage(announcement.message)
    localStorage.setItem(dismissKey, "1")
    setMounted(false)
    setTimeout(() => setDismissed(true), 220)
  }

  if (!announcement || dismissed) return null

  const palette = COLOR_STYLES[announcement.color] || COLOR_STYLES.amber

  const linkNode = announcement.link
    ? createElement(
        "a",
        {
          href: announcement.link,
          target: "_blank",
          rel: "noopener noreferrer",
          className:
            "shrink-0 rounded-full border border-white/25 bg-white/10 px-3.5 py-1 text-xs font-medium transition hover:bg-white/20 hover:border-white/40",
        },
        announcement.linkText || "Learn more"
      )
    : null

  return (
    <div
      className={`sticky top-0 z-[100] w-full border-b backdrop-blur-md transition-all duration-300 ease-out ${
        palette.bg
      } ${palette.border} ${palette.text} ${
        mounted ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3.5 pr-12">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {announcement.emoji ? (
            <span className="shrink-0 text-xl leading-none" aria-hidden="true">
              {announcement.emoji}
            </span>
          ) : (
            <span className={`h-2 w-2 shrink-0 rounded-full ${palette.accent}`} aria-hidden="true" />
          )}
          <span className="text-sm font-medium leading-snug sm:text-base">
            {announcement.message}
          </span>
        </div>
        {linkNode}
      </div>
      <button
        onClick={handleDismiss}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 opacity-70 transition hover:bg-white/10 hover:opacity-100"
        aria-label="Dismiss announcement"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}