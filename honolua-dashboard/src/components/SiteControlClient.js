"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { AlertTriangle, Power, Megaphone, Check, X, RotateCcw, Circle } from "lucide-react"

const BRAND_GRADIENT = "linear-gradient(135deg, #F4B942, #E6736F, #F472B6)"

const COLOR_OPTIONS = [
  { value: "amber", label: "Amber", hex: "#F4B942" },
  { value: "coral", label: "Coral", hex: "#E6736F" },
  { value: "pink", label: "Pink", hex: "#F472B6" },
  { value: "teal", label: "Teal", hex: "#2DD4BF" },
  { value: "violet", label: "Violet", hex: "#A78BFA" },
  { value: "slate", label: "Slate", hex: "#64748B" },
]

const COLOR_HEX = Object.fromEntries(COLOR_OPTIONS.map((c) => [c.value, c.hex]))

const EMPTY_DRAFT = { message: "", emoji: "", color: "amber", link: "", linkText: "" }

// Accent tone tokens reused from the sidebar's ROLE_ACCENTS pattern, so this
// panel reads as part of the same system rather than a bolted-on dashboard.
const TONE = {
  amber: { chip: "border-[#F4B942]/30 bg-[#F4B942]/10 text-[#8A6B60]", track: "border-[#F4B942]/30 bg-[#F4B942]/15" },
  coral: { chip: "border-[#E6736F]/25 bg-[#E6736F]/10 text-[#E6736F]", track: "border-[#E6736F]/30 bg-[#E6736F]/15" },
  pink: { chip: "border-hibiscus/25 bg-hibiscus/10 text-hibiscus", track: "border-hibiscus/30 bg-hibiscus/15" },
}

function Toggle({ checked, onChange, disabled, tone = "amber" }) {
  const t = TONE[tone] || TONE.amber
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors disabled:opacity-40 ${
        checked ? t.track : "border-lava/15 bg-lava/5"
      }`}
      aria-pressed={checked}
    >
      <motion.span
        className="inline-block h-4 w-4 rounded-full shadow-sm"
        style={{ background: checked ? BRAND_GRADIENT : "#fff", border: checked ? "none" : "1px solid rgba(0,0,0,0.08)" }}
        animate={{ x: checked ? 22 : 3 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
      />
    </button>
  )
}

function ControlCard({ icon: Icon, tone, title, description, badge, children }) {
  const t = TONE[tone] || TONE.amber
  return (
    <div className="rounded-2xl border border-lava/10 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${t.chip}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-medium text-reef-navy">{title}</div>
            <div className="mt-0.5 text-xs text-lava/45">{description}</div>
          </div>
        </div>
        {badge}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  )
}

function StatePill({ active, activeLabel = "On", offLabel = "Off", tone = "amber" }) {
  const t = TONE[tone] || TONE.amber
  return (
    <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${active ? t.chip : "border-lava/10 bg-lava/5 text-lava/40"}`}>
      {active ? activeLabel : offLabel}
    </span>
  )
}

// Persistent top-of-page status pill, replacing a conditional banner — the
// panel always tells you where things stand, not just when something's wrong.
function SiteStatusPill({ shutdownMode, maintenanceMode }) {
  let label = "Site is live"
  let dotColor = "#34D399"
  let tone = "border-lava/10 bg-lava/5 text-lava/60"

  if (shutdownMode) {
    label = "Site is offline"
    dotColor = "#E6736F"
    tone = "border-[#E6736F]/25 bg-[#E6736F]/10 text-[#E6736F]"
  } else if (maintenanceMode) {
    label = "Maintenance mode active"
    dotColor = "#F4B942"
    tone = "border-[#F4B942]/30 bg-[#F4B942]/10 text-[#8A6B60]"
  }

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium ${tone}`}>
      <span className="relative flex h-2 w-2">
        {!shutdownMode && !maintenanceMode ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: dotColor }} />
        ) : null}
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: dotColor }} />
      </span>
      {label}
    </div>
  )
}

function ConfirmModal({ open, title, description, confirmLabel, onConfirm, onCancel, busy }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-reef-navy/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-sm rounded-2xl border border-lava/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E6736F]/25 bg-[#E6736F]/10 text-[#E6736F]">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-reef-navy">{title}</h3>
            <p className="mt-2 text-sm text-lava/50">{description}</p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={onCancel}
                disabled={busy}
                className="h-10 flex-1 rounded-xl border border-lava/10 bg-lava/5 text-sm text-reef-navy transition hover:bg-lava/10 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={busy}
                className="h-10 flex-1 rounded-xl border border-[#E6736F]/30 bg-[#E6736F]/15 text-sm font-medium text-[#E6736F] transition hover:bg-[#E6736F]/25 disabled:opacity-50"
              >
                {busy ? "..." : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function SiteControlClient() {
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState("")

  const [shutdownMode, setShutdownMode] = useState(false)
  const [shutdownMessage, setShutdownMessage] = useState("")

  const [announcementActive, setAnnouncementActive] = useState(false)
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const [confirmShutdown, setConfirmShutdown] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/site-settings", { cache: "no-store" })
      const j = await res.json().catch(() => ({}))
      if (res.ok && j?.ok) {
        setMaintenanceMode(j.maintenanceMode)
        setMaintenanceMessage(j.maintenanceMessage || "")
        setShutdownMode(j.shutdownMode)
        setShutdownMessage(j.shutdownMessage || "")
        setAnnouncementActive(j.announcement.enabled)
      }
    } catch {
      toast.error("unable to load site settings")
    } finally {
      setLoading(false)
    }
  }

  async function loadHistory() {
    setHistoryLoading(true)
    try {
      const res = await fetch("/api/site-settings/announcements", { cache: "no-store" })
      const j = await res.json().catch(() => ({}))
      if (res.ok && j?.ok) setHistory(j.history || [])
    } catch {
      // silent, history is secondary
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    load()
    loadHistory()
  }, [])

  async function save(patch, successMessage = "saved") {
    if (busy) return
    setBusy(true)
    const t = toast.loading("saving...")
    try {
      const res = await fetch("/api/site-settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      })
      const j = await res.json().catch(() => ({}))
      toast.dismiss(t)
      if (!res.ok || !j?.ok) {
        toast.error(j?.error === "forbidden" ? "no permission" : "unable to save")
        return
      }
      toast.success(successMessage)
      await load()
    } catch {
      toast.dismiss(t)
      toast.error("unable to save")
    } finally {
      setBusy(false)
    }
  }

  async function confirmShutdownAction() {
    await save({ shutdownMode: true, shutdownMessage }, "site is now offline")
    setConfirmShutdown(false)
  }

  async function publishAnnouncement() {
    if (!draft.message.trim()) return
    await save({ announcement: { ...draft, enabled: true } }, "announcement published")
    setDraft(EMPTY_DRAFT)
    await loadHistory()
  }

  async function takeDownAnnouncement() {
    await save({ announcement: { ...EMPTY_DRAFT, enabled: false } }, "announcement taken down")
    await loadHistory()
  }

  function reuseAnnouncement(entry) {
    setDraft({
      message: entry.message,
      emoji: entry.emoji,
      color: entry.color,
      link: entry.link,
      linkText: entry.linkText,
    })
    toast.success("loaded into compose box")
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl border border-lava/10 bg-lava/5" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SiteStatusPill shutdownMode={shutdownMode} maintenanceMode={maintenanceMode} />

      {/* Maintenance */}
      <ControlCard
        icon={AlertTriangle}
        tone="amber"
        title="Maintenance mode"
        description="Blocks regular visitors while staff retain access."
        badge={<StatePill active={maintenanceMode} tone="amber" />}
      >
        <textarea
          value={maintenanceMessage}
          onChange={(e) => setMaintenanceMessage(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="Message shown to visitors during maintenance..."
          className="w-full resize-none rounded-xl border border-lava/10 bg-lava/[0.03] px-3 py-2.5 text-sm text-reef-navy outline-none transition placeholder:text-lava/30 focus:border-[#F4B942]/40"
        />

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-lava/45">
            {maintenanceMode ? "Currently blocking visitors" : "Currently allowing all visitors"}
          </span>
          <Toggle
            checked={maintenanceMode}
            disabled={busy || shutdownMode}
            tone="amber"
            onChange={(next) => save({ maintenanceMode: next, maintenanceMessage })}
          />
        </div>
      </ControlCard>

      {/* Shutdown */}
      <ControlCard
        icon={Power}
        tone="coral"
        title="Shutdown"
        description="Takes the site fully offline for everyone except owner and executive."
        badge={<StatePill active={shutdownMode} tone="coral" activeLabel="Offline" offLabel="Live" />}
      >
        <textarea
          value={shutdownMessage}
          onChange={(e) => setShutdownMessage(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="Message shown to visitors while offline..."
          className="w-full resize-none rounded-xl border border-lava/10 bg-lava/[0.03] px-3 py-2.5 text-sm text-reef-navy outline-none transition placeholder:text-lava/30 focus:border-[#E6736F]/40"
        />

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-lava/45">{shutdownMode ? "Site is offline right now" : "Site is live"}</span>
          {shutdownMode ? (
            <Toggle checked={true} disabled={busy} tone="coral" onChange={() => save({ shutdownMode: false })} />
          ) : (
            <Toggle checked={false} disabled={busy} tone="coral" onChange={() => setConfirmShutdown(true)} />
          )}
        </div>
      </ControlCard>

      {/* Announcement */}
      <ControlCard
        icon={Megaphone}
        tone="pink"
        title="Site-wide announcement"
        description="Compose a new banner or reuse one from your history below."
        badge={<StatePill active={announcementActive} tone="pink" activeLabel="Active" />}
      >
        <div className="space-y-4">
          {announcementActive ? (
            <div className="flex items-center justify-between rounded-xl border border-hibiscus/20 bg-hibiscus/10 px-4 py-3 text-xs text-hibiscus">
              <span>An announcement is currently live.</span>
              <button
                onClick={takeDownAnnouncement}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full border border-lava/15 bg-white px-3 py-1 font-medium text-reef-navy transition hover:bg-lava/5 disabled:opacity-50"
              >
                <X className="h-3 w-3" />
                Take down
              </button>
            </div>
          ) : null}

          <div className="grid grid-cols-[64px_1fr] gap-3">
            <input
              value={draft.emoji}
              onChange={(e) => setDraft((p) => ({ ...p, emoji: e.target.value }))}
              placeholder="🎉"
              maxLength={8}
              className="h-11 rounded-xl border border-lava/10 bg-lava/[0.03] text-center text-lg outline-none transition focus:border-hibiscus/40"
            />
            <textarea
              value={draft.message}
              onChange={(e) => setDraft((p) => ({ ...p, message: e.target.value }))}
              maxLength={300}
              rows={2}
              placeholder="Write a new announcement..."
              className="w-full resize-none rounded-xl border border-lava/10 bg-lava/[0.03] px-3 py-2.5 text-sm text-reef-navy outline-none transition placeholder:text-lava/30 focus:border-hibiscus/40"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={draft.link}
              onChange={(e) => setDraft((p) => ({ ...p, link: e.target.value }))}
              placeholder="Link (optional)"
              className="h-11 rounded-xl border border-lava/10 bg-lava/[0.03] px-3 text-sm text-reef-navy outline-none transition placeholder:text-lava/30 focus:border-hibiscus/40"
            />
            <input
              value={draft.linkText}
              onChange={(e) => setDraft((p) => ({ ...p, linkText: e.target.value }))}
              placeholder="Link text (e.g. Learn more)"
              className="h-11 rounded-xl border border-lava/10 bg-lava/[0.03] px-3 text-sm text-reef-navy outline-none transition placeholder:text-lava/30 focus:border-hibiscus/40"
            />
          </div>

          <div>
            <div className="mb-2 text-xs text-lava/45">Color</div>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_OPTIONS.map((c) => {
                const selected = draft.color === c.value
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, color: c.value }))}
                    title={c.label}
                    className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition"
                    style={{ borderColor: selected ? c.hex : "transparent", background: selected ? "transparent" : "transparent" }}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: c.hex }}>
                      {selected ? <Check className="h-3.5 w-3.5 text-white" /> : null}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {draft.message ? (
            <div>
              <div className="mb-2 text-xs text-lava/45">Preview</div>
              <div
                className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-lava/10 bg-white px-4 py-3 text-sm text-reef-navy"
                style={{ borderLeft: `3px solid ${COLOR_HEX[draft.color] || COLOR_HEX.amber}` }}
              >
                {draft.emoji ? (
                  <span className="text-lg leading-none">{draft.emoji}</span>
                ) : (
                  <span className="h-2 w-2 rounded-full" style={{ background: COLOR_HEX[draft.color] || COLOR_HEX.amber }} />
                )}
                <span className="font-medium">{draft.message}</span>
                {draft.link ? (
                  <span className="rounded-full border border-lava/15 bg-lava/5 px-3 py-1 text-xs font-medium text-reef-navy">
                    {draft.linkText || "Learn more"}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="flex justify-end border-t border-lava/10 pt-4">
            <button
              onClick={publishAnnouncement}
              disabled={busy || !draft.message.trim()}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-xs font-medium text-white transition disabled:opacity-50"
              style={{ background: BRAND_GRADIENT }}
            >
              <Check className="h-3.5 w-3.5" />
              Publish
            </button>
          </div>
        </div>
      </ControlCard>

      {/* History */}
      <div className="rounded-2xl border border-lava/10 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-lava/30">Announcement history</div>

        <div className="mt-4 space-y-2">
          {historyLoading ? (
            <div className="h-12 rounded-xl border border-lava/10 bg-lava/[0.03]" />
          ) : history.length === 0 ? (
            <p className="text-xs text-lava/40">No announcements published yet.</p>
          ) : (
            history.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-lava/10 bg-lava/[0.02] px-4 py-3"
                style={{ borderLeft: `3px solid ${COLOR_HEX[h.color] || COLOR_HEX.amber}` }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  {h.emoji ? <span className="text-base leading-none">{h.emoji}</span> : null}
                  <div className="min-w-0">
                    <div className="truncate text-sm text-reef-navy">{h.message}</div>
                    <div className="mt-0.5 text-[11px] text-lava/40">
                      {h.publishedByUsername} &middot; {timeAgo(h.publishedAt)}
                      {h.isActive ? (
                        <span className="ml-2 rounded-full border border-hibiscus/25 bg-hibiscus/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-hibiscus">
                          Live
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => reuseAnnouncement(h)}
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-lava/10 bg-white px-3 text-[11px] text-lava/55 transition hover:bg-lava/5 hover:text-reef-navy"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reuse
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmShutdown}
        title="Shut down the site?"
        description="This takes Honolua fully offline for everyone except owner and executive staff. You can bring it back online at any time from this page."
        confirmLabel="Shut down"
        busy={busy}
        onConfirm={confirmShutdownAction}
        onCancel={() => setConfirmShutdown(false)}
      />
    </div>
  )
}