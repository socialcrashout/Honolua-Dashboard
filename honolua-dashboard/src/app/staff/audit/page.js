"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDown, RefreshCw, Search } from "lucide-react"

function actionLabel(action) {
  return String(action || "")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

export default function StaffAuditPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState(null)
  const [nextCursor, setNextCursor] = useState(null)

  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/staff/audit-log", { credentials: "include" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) {
        setError("Unable to load audit log.")
        return
      }
      setLogs(data.logs || [])
      setNextCursor(data.nextCursor || null)
    } catch {
      setError("Unable to load audit log.")
    } finally {
      setLoading(false)
    }
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await fetch(
        `/api/staff/audit-log?cursor=${encodeURIComponent(nextCursor)}`,
        { credentials: "include" }
      )
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.ok) {
        setLogs((prev) => [...prev, ...(data.logs || [])])
        setNextCursor(data.nextCursor || null)
      }
    } finally {
      setLoadingMore(false)
    }
  }

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
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Staff Audit Log</h1>
      <p className="text-sm text-white/50">View every staff action performed.</p>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff, action..."
            className="h-11 w-full rounded-xl border border-white/10 bg-[#101010] pl-9 pr-3 text-sm text-white outline-none transition focus:border-white/25"
          />
        </div>
        <button
          onClick={loadLogs}
          disabled={loading}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-[#101010] px-4 text-sm text-white/70 transition hover:border-white/20 hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-white/10 bg-[#101010] p-10 text-center text-sm text-white/50">
          {error}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#101010]">
          {loading ? (
            <div className="space-y-2 p-5">
              <div className="h-14 rounded-xl border border-white/10 bg-[#0c0c0c]" />
              <div className="h-14 rounded-xl border border-white/10 bg-[#0c0c0c]" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-10 text-center text-sm text-white/40">No audit logs found.</div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredLogs.map((log) => {
                const isExpanded = expanded === log.id
                const hasMeta = Object.keys(log.meta || {}).length > 0
                return (
                  <div key={log.id}>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : log.id)}
                      className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-white/5"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        {log.actor.avatarUrl ? (
                          <img
                            src={log.actor.avatarUrl}
                            alt=""
                            className="h-8 w-8 rounded-full border border-white/10 object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full border border-white/10 bg-white/5" />
                        )}
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
                          {actionLabel(log.action)}
                        </span>
                        <span className="text-sm text-white/80">
                          {log.actor.robloxUsername || log.actor.discordUsername}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-white/40">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                        {hasMeta ? (
                          <ChevronDown
                            className={`h-4 w-4 text-white/40 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        ) : null}
                      </div>
                    </button>
                    {isExpanded && hasMeta ? (
                      <div className="border-t border-white/10 bg-white/[0.02] px-5 py-4">
                        <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs text-white/70">
                          {JSON.stringify(log.meta, null, 2)}
                        </pre>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {nextCursor && !loading ? (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#101010] px-5 text-sm text-white/70 transition hover:border-white/20 hover:text-white disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      ) : null}
    </div>
  )
}