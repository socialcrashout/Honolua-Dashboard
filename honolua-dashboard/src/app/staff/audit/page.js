"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { ChevronDown, Hash, RefreshCw, Save, Search, ScrollText, Settings2 } from "lucide-react"

function actionLabel(action) {
  return String(action || "")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
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

function Avatar({ url }) {
  return url ? (
    <img
      src={url}
      alt=""
      className="h-9 w-9 shrink-0 rounded-full border border-lava/10 object-cover"
    />
  ) : (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-lava/10 bg-lava/5 text-xs text-lava/30">
      ?
    </div>
  )
}

function AuditDeliverySettings() {
  const [settings, setSettings] = useState({ channelId: "" })
  const [channels, setChannels] = useState([])
  const [channelError, setChannelError] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/staff/audit/settings", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || "Could not load audit settings.")
        setSettings(data.settings || { channelId: "" })
        setChannels(data.channels || [])
        setChannelError(data.channelError || "")
      })
      .catch((error) => setChannelError(error.message))
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    try {
      const response = await fetch("/api/staff/audit/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Could not save audit settings.")
      setSettings(data.settings)
      toast.success("Audit delivery settings saved")
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-2xl border border-orange-200/80 bg-white px-4 py-3 shadow-[0_4px_18px_rgba(153,92,38,0.06)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700 ring-1 ring-orange-200/80">
            <Settings2 className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-reef-navy">Audit log channel</h2>
            <p className="text-xs text-lava/45">Discord notifications are suppressed.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div className="relative min-w-[220px] flex-1 sm:flex-none">
            <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-700/55" />
            <select id="audit-channel" value={settings.channelId || ""} disabled={loading || !channels.length} onChange={(event) => setSettings((current) => ({ ...current, channelId: event.target.value }))} className="h-10 w-full appearance-none rounded-xl border border-orange-200 bg-[#fffaf2] pl-9 pr-8 text-sm text-reef-navy outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:opacity-60">
              <option value="">{loading ? "Loading channels…" : "Discord messages disabled"}</option>
              {channels.map((channel) => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}
            </select>
          </div>
          <button onClick={save} disabled={saving || loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#ef8e42] px-3.5 text-sm font-semibold text-white transition hover:bg-[#de7832] disabled:opacity-50">
            <Save className="h-4 w-4" />{saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
      {channelError && <p className="mt-2 text-xs text-orange-800">{channelError}</p>}
    </section>
  )
}

export default function StaffAuditPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState(null)
  const [nextCursor, setNextCursor] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/staff/audit/audit-log", { cache: "no-store" })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j?.ok) {
        toast.error("unable to load audit log")
        return
      }
      setLogs(j.logs || [])
      setNextCursor(j.nextCursor || null)
    } catch {
      toast.error("unable to load audit log")
    } finally {
      setLoading(false)
    }
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await fetch(
        `/api/staff/audit/audit-log?cursor=${encodeURIComponent(nextCursor)}`,
        { cache: "no-store" }
      )
      const j = await res.json().catch(() => ({}))
      if (res.ok && j?.ok) {
        setLogs((prev) => [...prev, ...(j.logs || [])])
        setNextCursor(j.nextCursor || null)
      }
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filteredLogs = useMemo(() => {
    if (!search.trim()) return logs
    const q = search.toLowerCase()
    return logs.filter(
      (log) =>
        log.actor?.discordUsername?.toLowerCase().includes(q) ||
        log.actor?.robloxUsername?.toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q)
    )
  }, [logs, search])

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-reef-navy">Staff Audit Log</h1>
          <p className="mt-1 text-sm text-lava/50">View every staff action performed across Honolua.</p>
        </div>

        <AuditDeliverySettings />

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lava/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff or action..."
              className="h-11 w-full rounded-xl border border-lava/10 bg-lava/[0.03] pl-9 pr-3 text-sm text-reef-navy outline-none transition placeholder:text-lava/30 focus:border-hibiscus/40"
            />
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-lava/10 bg-white px-4 text-sm text-lava/60 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:bg-lava/5 hover:text-reef-navy disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="rounded-2xl border border-lava/10 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          {loading ? (
            <div className="space-y-2 p-5">
              <div className="h-16 animate-pulse rounded-xl border border-lava/10 bg-lava/[0.03]" />
              <div className="h-16 animate-pulse rounded-xl border border-lava/10 bg-lava/[0.03]" />
              <div className="h-16 animate-pulse rounded-xl border border-lava/10 bg-lava/[0.03]" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center">
              <ScrollText className="h-6 w-6 text-lava/25" />
              <p className="text-sm text-lava/40">No audit logs found.</p>
            </div>
          ) : (
            <div className="divide-y divide-lava/10">
              {filteredLogs.map((log) => {
                const isExpanded = expanded === log.id
                const hasMeta = Object.keys(log.meta || {}).length > 0

                return (
                  <div key={log.id}>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : log.id)}
                      className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-lava/[0.03]"
                    >
                      <div className="flex min-w-0 flex-wrap items-center gap-3">
                        <Avatar url={log.actor?.avatarUrl} />
                        <span className="shrink-0 rounded-full border border-hibiscus/25 bg-hibiscus/10 px-3 py-1 text-xs font-medium text-hibiscus">
                          {actionLabel(log.action)}
                        </span>
                        <span className="truncate text-sm font-medium text-reef-navy">
                          {log.actor?.robloxUsername || log.actor?.discordUsername || "Unknown"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-lava/40">{timeAgo(log.createdAt)}</span>
                        {hasMeta ? (
                          <ChevronDown
                            className={`h-4 w-4 text-lava/40 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        ) : null}
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && hasMeta ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden border-t border-lava/10 bg-lava/[0.02]"
                        >
                          <div className="px-5 py-4">
                            <div className="rounded-xl border border-lava/10 bg-white p-4">
                              <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-lava/30">
                                Details
                              </div>
                              <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs text-lava/60">
                                {JSON.stringify(log.meta, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {nextCursor && !loading ? (
          <div className="flex justify-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-lava/10 bg-white px-5 text-sm text-lava/60 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:bg-lava/5 hover:text-reef-navy disabled:opacity-50"
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
