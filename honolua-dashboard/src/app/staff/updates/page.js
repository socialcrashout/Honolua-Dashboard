"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Plus, X, Trash2, Sparkles, ImageIcon, Link2 } from "lucide-react"

// Shared brand gradient — kept identical to StaffSidebar.js / site-stats so accents match
const BRAND_GRADIENT = "linear-gradient(135deg, #F4B942, #E6736F, #F472B6)"
const EASE = [0.16, 1, 0.3, 1]

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function UpdateCard({ update, index, onRemove }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: EASE }}
      className="relative overflow-hidden rounded-2xl border border-lava/10 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
    >
      <div className="absolute inset-y-0 left-0 w-1" style={{ background: BRAND_GRADIENT }} />
      <div className="p-5 pl-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-reef-navy">{update.title}</div>
            <div className="mt-0.5 text-[11px] text-lava/35">{formatDate(update.createdAt)}</div>
          </div>

          <motion.button
            onClick={() => (confirming ? onRemove(update.id) : setConfirming(true))}
            onBlur={() => setConfirming(false)}
            whileTap={{ scale: 0.94 }}
            className={cnBtn(confirming)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {confirming ? "Confirm?" : "Remove"}
          </motion.button>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-lava/55">{update.body}</p>

        {update.mediaUrl ? (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-lava/35">
            <ImageIcon className="h-3.5 w-3.5" />
            <span className="truncate">{update.mediaUrl}</span>
          </div>
        ) : null}

        {update.ctaLabel && update.ctaUrl ? (
          <a
            href={update.ctaUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-hibiscus hover:underline"
          >
            <Link2 className="h-3.5 w-3.5" />
            {update.ctaLabel}
          </a>
        ) : null}
      </div>
    </motion.div>
  )
}

function cnBtn(confirming) {
  return [
    "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
    confirming
      ? "bg-[#E6736F] text-white"
      : "border border-lava/10 text-lava/45 hover:border-[#E6736F]/30 hover:text-[#E6736F]",
  ].join(" ")
}

function CreateDrawer({ open, onClose, onCreate, submitting }) {
  const [form, setForm] = useState({ title: "", body: "", mediaUrl: "", ctaLabel: "", ctaUrl: "" })

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function submit() {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("title and description are required")
      return
    }
    const ok = await onCreate(form)
    if (ok) setForm({ title: "", body: "", mediaUrl: "", ctaLabel: "", ctaUrl: "" })
  }

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-reef-navy/20 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-lava/10 bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.08)]"
          >
            <div className="flex items-center justify-between border-b border-lava/10 px-6 py-5">
              <div>
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: "rgba(230,115,111,0.12)" }}
                >
                  <Sparkles className="h-4 w-4" style={{ color: "#E6736F" }} />
                </div>
                <h2 className="mt-2 text-lg font-semibold text-reef-navy">New update</h2>
                <p className="mt-0.5 text-xs text-lava/40">Publish an announcement to your staff feed.</p>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-lava/40 transition hover:bg-lava/5 hover:text-reef-navy"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <Field label="Title">
                <input
                  value={form.title}
                  onChange={set("title")}
                  placeholder="e.g. New payroll system"
                  className={inputCls}
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={form.body}
                  onChange={set("body")}
                  rows={5}
                  placeholder="What changed and why it matters..."
                  className={inputCls + " resize-none"}
                />
              </Field>

              <Field label="Media URL (optional)">
                <input
                  value={form.mediaUrl}
                  onChange={set("mediaUrl")}
                  placeholder="https://..."
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="CTA label (optional)">
                  <input value={form.ctaLabel} onChange={set("ctaLabel")} className={inputCls} />
                </Field>
                <Field label="CTA URL (optional)">
                  <input
                    value={form.ctaUrl}
                    onChange={set("ctaUrl")}
                    placeholder="https://..."
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>

            <div className="border-t border-lava/10 px-6 py-4">
              <motion.button
                onClick={submit}
                disabled={submitting}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white shadow-sm transition disabled:opacity-60"
                style={{ background: BRAND_GRADIENT }}
              >
                {submitting ? "Publishing..." : "Publish update"}
              </motion.button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium text-lava/45">{label}</div>
      {children}
    </div>
  )
}

const inputCls =
  "h-11 w-full rounded-xl border border-lava/10 bg-lava/[0.03] px-3.5 text-sm text-reef-navy outline-none transition placeholder:text-lava/30 focus:border-hibiscus/40"

export default function StaffUpdatesPage() {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/updates", { cache: "no-store" })
      const j = await res.json().catch(() => ({}))
      if (res.ok && j?.ok) {
        setUpdates(j.updates || [])
      } else {
        toast.error("unable to load updates")
      }
    } catch {
      toast.error("unable to load updates")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(form) {
    setSubmitting(true)
    try {
      const res = await fetch("/api/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j?.ok) {
        toast.error("unable to publish update")
        return false
      }
      setUpdates((prev) => [j.update, ...prev])
      toast.success("update published")
      setDrawerOpen(false)
      return true
    } catch {
      toast.error("unable to publish update")
      return false
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove(id) {
    const prev = updates
    setUpdates((u) => u.filter((x) => x.id !== id))
    try {
      const res = await fetch(`/api/updates/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
    } catch {
      setUpdates(prev)
      toast.error("unable to remove update")
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-reef-navy">Updates</h1>
          <p className="mt-1 text-sm text-lava/50">Announce changes to staff in a shared feed.</p>
        </div>
        <motion.button
          onClick={() => setDrawerOpen(true)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-white shadow-sm"
          style={{ background: BRAND_GRADIENT }}
        >
          <Plus className="h-4 w-4" />
          Create update
        </motion.button>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <>
            <div className="h-28 animate-pulse rounded-2xl border border-lava/10 bg-lava/[0.03]" />
            <div className="h-28 animate-pulse rounded-2xl border border-lava/10 bg-lava/[0.03]" />
          </>
        ) : updates.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-lava/10 bg-white p-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <Sparkles className="h-6 w-6 text-lava/25" />
            <p className="text-sm text-lava/40">No updates yet.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {updates.map((update, i) => (
              <UpdateCard key={update.id} update={update} index={i} onRemove={handleRemove} />
            ))}
          </AnimatePresence>
        )}
      </div>

      <CreateDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreate={handleCreate}
        submitting={submitting}
      />
    </div>
  )
}