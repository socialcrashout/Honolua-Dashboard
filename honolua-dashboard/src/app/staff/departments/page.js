"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  Plus,
  Search,
  Headphones,
  Megaphone,
  MessageSquare,
  Code2,
  UserPlus,
  UserMinus,
  CalendarDays,
  ShieldCheck,
  Settings,
  Pencil,
  Shield,
  Users,
  FileText,
  ChevronRight,
  ArrowRight,
  Trash2,
  X,
  Zap,
  PieChart,
  Clock,
} from "lucide-react"

const BRAND_GRADIENT = "linear-gradient(135deg, #F4B942, #E6736F, #F472B6)"
const EASE = [0.16, 1, 0.3, 1]
const FILTERS = ["All", "Active", "Restricted"]
const VIEW_LOGS_HREF = "/staff/audit"

// Maps the `icon` string stored on each department (see lib/Department.js) to a component.
// Add to this map if you introduce new department icons server-side.
const ICON_MAP = {
  Headphones,
  Megaphone,
  MessageSquare,
  Code2,
  UserPlus,
  CalendarDays,
  ShieldCheck,
  Settings,
  Users,
}

// Maps audit log `action` strings to an icon + tint for the Recent Activity feed.
const ACTIVITY_ICON_MAP = {
  department_created: { icon: Plus, color: "#E6736F" },
  department_archived: { icon: Trash2, color: "#E6736F" },
  permission_updated: { icon: Shield, color: "#F4B942" },
  member_added: { icon: UserPlus, color: "#10B981" },
  member_removed: { icon: UserMinus, color: "#E6736F" },
}

// Single place every staff action funnels through before it's written to the
// audit log. Fire-and-forget on purpose — a logging hiccup should never
// block or fail the action the staff member was actually trying to do.
async function logAction(action, meta = {}) {
  try {
    await fetch("/api/staff/audit/audit-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, meta }),
    })
  } catch {
    // best-effort — swallow errors, the primary action already succeeded
  }
}

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

function StatusPill({ status }) {
  const styles =
    status === "Active"
      ? "bg-emerald-50 text-emerald-600"
      : status === "Restricted"
      ? "bg-[#F4B942]/10 text-[#B8862B]"
      : "bg-lava/5 text-lava/40"
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}>{status}</span>
}

function Avatar({ member, size = 36 }) {
  const dim = { width: size, height: size }
  if (member.avatarUrl) {
    return (
      <img
        src={member.avatarUrl}
        alt={member.username}
        style={dim}
        className="shrink-0 rounded-full border-2 border-white object-cover"
      />
    )
  }
  // Fallback while Roblox's thumbnail is still generating, or if the lookup failed
  return (
    <div
      style={dim}
      className="flex shrink-0 items-center justify-center rounded-full border-2 border-white bg-lava/10 text-xs font-bold text-lava/50"
    >
      {member.username?.[0]?.toUpperCase() || "?"}
    </div>
  )
}

function DepartmentRow({ dept, active, onClick }) {
  const Icon = ICON_MAP[dept.icon] || Users
  return (
    <button
      onClick={onClick}
      className={`group relative flex w-full items-center gap-4 py-4 pl-5 pr-4 text-left transition ${
        active ? "bg-lava/[0.035]" : "hover:bg-lava/[0.02]"
      }`}
    >
      <span
        className="absolute inset-y-2 left-0 w-[3px] rounded-full transition-opacity"
        style={{ background: dept.color, opacity: active ? 1 : 0 }}
      />

      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${dept.color}1A`, color: dept.color }}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-reef-navy">{dept.name}</div>
        <div className="mt-0.5 truncate text-xs text-lava/45">{dept.description}</div>
      </div>

      <div className="hidden shrink-0 items-center gap-1.5 text-xs text-lava/40 sm:flex">
        <Users className="h-3.5 w-3.5" />
        {dept.members.length}
      </div>

      <StatusPill status={dept.status} />
    </button>
  )
}

function SettingsLink({ icon: Icon, label }) {
  return (
    <button className="flex w-full items-center justify-between rounded-xl px-1 py-3 text-left transition hover:bg-lava/[0.03]">
      <span className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-lava/40" />
        <span className="text-sm font-medium text-reef-navy">{label}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-lava/25" />
    </button>
  )
}

function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={onChange}
      className="relative h-6 w-11 shrink-0 rounded-full transition"
      style={{ background: enabled ? "#F4B942" : "rgba(0,0,0,0.08)" }}
    >
      <motion.span
        layout
        transition={{ duration: 0.2, ease: EASE }}
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
        style={{ left: enabled ? "22px" : "2px" }}
      />
    </button>
  )
}

function StatInline({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-lava/35" />
      <span className="text-sm font-bold text-reef-navy">{value}</span>
      <span className="text-xs text-lava/40">{label}</span>
    </div>
  )
}

function AddMemberRow({ onAdd, adding }) {
  const [username, setUsername] = useState("")

  async function submit() {
    if (!username.trim()) return
    const ok = await onAdd(username.trim())
    if (ok) setUsername("")
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Roblox username..."
        className="h-9 flex-1 rounded-lg border border-lava/10 bg-lava/[0.03] px-3 text-sm text-reef-navy outline-none placeholder:text-lava/30 focus:border-hibiscus/40"
      />
      <button
        onClick={submit}
        disabled={adding}
        className="flex h-9 shrink-0 items-center gap-1 rounded-lg px-3 text-xs font-semibold text-white disabled:opacity-60"
        style={{ background: BRAND_GRADIENT }}
      >
        <Plus className="h-3.5 w-3.5" />
        Add
      </button>
    </div>
  )
}

function DetailPanel({ dept, onTogglePermission, onAddMember, onRemoveMember, onArchive }) {
  const Icon = ICON_MAP[dept.icon] || Users
  const [addingMember, setAddingMember] = useState(false)

  async function handleAdd(username) {
    setAddingMember(true)
    const ok = await onAddMember(username)
    setAddingMember(false)
    return ok
  }

  return (
    <motion.div
      key={dept.id}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.25, ease: EASE }}
      className="flex h-full flex-col overflow-hidden rounded-[28px] border border-lava/10 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
    >
      <div className="px-6 pb-5 pt-6" style={{ background: `linear-gradient(180deg, ${dept.color}14, transparent)` }}>
        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `${dept.color}22`, color: dept.color }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-reef-navy">{dept.name}</h2>
              <StatusPill status={dept.status} />
            </div>
            <p className="mt-1 text-sm text-lava/50">{dept.description}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 pb-6">
        <div className="flex items-center gap-5 border-b border-lava/8 py-4">
          <StatInline icon={Users} value={dept.members.length} label="Members" />
          <span className="h-4 w-px bg-lava/10" />
          <StatInline icon={Shield} value={dept.permissions.filter((p) => p.enabled).length} label="Permissions" />
          <span className="h-4 w-px bg-lava/10" />
          <StatInline icon={Settings} value={dept.permissions.length} label="Settings" />
        </div>

        <div className="mt-2">
          <div className="mb-1 pt-4 text-sm font-semibold text-reef-navy">Department Settings</div>
          <div className="space-y-0.5">
            <SettingsLink icon={Pencil} label="Edit Department" />
            <SettingsLink icon={Shield} label="Manage Permissions" />
            <SettingsLink icon={FileText} label="View Logs" />
          </div>
        </div>

        <div className="mt-6">
          <div className="text-sm font-semibold text-reef-navy">Members</div>

          {dept.members.length === 0 ? (
            <p className="mt-2 text-xs text-lava/40">No members assigned yet.</p>
          ) : (
            <div className="mt-3 divide-y divide-lava/8 border-y border-lava/8">
              {dept.members.map((m) => (
                <div key={m.robloxId} className="flex items-center gap-2.5 py-2.5">
                  <Avatar member={m} size={30} />
                  <span className="flex-1 truncate text-sm text-reef-navy/80">{m.username}</span>
                  <button
                    onClick={() => onRemoveMember(m.robloxId)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-lava/30 transition hover:bg-[#E6736F]/10 hover:text-[#E6736F]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <AddMemberRow onAdd={handleAdd} adding={addingMember} />
        </div>

        <div className="mt-6 flex-1">
          <div className="text-sm font-semibold text-reef-navy">Permissions</div>
          <div className="mt-3 divide-y divide-lava/8">
            {dept.permissions.map((p, i) => (
              <div key={p.label} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-reef-navy/80">{p.label}</span>
                <Toggle enabled={p.enabled} onChange={() => onTogglePermission(i)} />
              </div>
            ))}
          </div>
        </div>

        <motion.button
          onClick={onArchive}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#E6736F]/20 bg-[#E6736F]/[0.06] text-sm font-semibold text-[#E6736F] transition hover:bg-[#E6736F]/10"
        >
          <Trash2 className="h-4 w-4" />
          Archive Department
        </motion.button>
      </div>
    </motion.div>
  )
}

function CreateModal({ open, onClose, onCreate, submitting }) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  async function submit() {
    if (!name.trim()) {
      toast.error("name is required")
      return
    }
    const ok = await onCreate({ name: name.trim(), description: description.trim() })
    if (ok) {
      setName("")
      setDescription("")
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-reef-navy/20 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="w-full max-w-sm rounded-[24px] border border-lava/10 bg-white p-6 shadow-xl"
            >
              <h2 className="text-lg font-semibold text-reef-navy">New Department</h2>
              <div className="mt-4 space-y-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Department name"
                  className="h-11 w-full rounded-xl border border-lava/10 bg-lava/[0.03] px-3.5 text-sm outline-none placeholder:text-lava/30 focus:border-hibiscus/40"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-lava/10 bg-lava/[0.03] px-3.5 py-2.5 text-sm outline-none placeholder:text-lava/30 focus:border-hibiscus/40"
                />
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-lava/50 hover:bg-lava/5">
                  Cancel
                </button>
                <motion.button
                  onClick={submit}
                  disabled={submitting}
                  whileTap={{ scale: 0.97 }}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: BRAND_GRADIENT }}
                >
                  {submitting ? "Creating..." : "Create"}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  )
}

function QuickActionPill({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-lava/10 bg-lava/[0.03] px-3.5 py-2 text-xs font-semibold text-reef-navy transition hover:border-[#F4B942]/40 hover:bg-[#F4B942]/[0.08]"
    >
      <Icon className="h-3.5 w-3.5 text-[#B8862B]" />
      {label}
    </button>
  )
}

function OverviewDonut({ departments }) {
  const active = departments.filter((d) => d.status === "Active").length
  const restricted = departments.filter((d) => d.status === "Restricted").length
  const archived = Math.max(0, departments.length - active - restricted)
  const total = departments.length

  const R = 40
  const CIRC = 2 * Math.PI * R
  const segments = [
    { value: active, color: "#10B981" },
    { value: restricted, color: "#F4B942" },
    { value: archived, color: "rgba(15,23,42,0.10)" },
  ].filter((s) => s.value > 0)

  let offset = 0
  const arcs = segments.map((s, i) => {
    const frac = total > 0 ? s.value / total : 0
    const dash = frac * CIRC
    const arc = (
      <circle
        key={i}
        cx="50"
        cy="50"
        r={R}
        fill="none"
        stroke={s.color}
        strokeWidth="14"
        strokeDasharray={`${dash} ${CIRC - dash}`}
        strokeDashoffset={-offset}
        strokeLinecap="butt"
      />
    )
    offset += dash
    return arc
  })

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-24 w-24 shrink-0">
        <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
          <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(15,23,42,0.06)" strokeWidth="14" />
          {total > 0 ? arcs : null}
        </svg>
      </div>

      <div className="flex-1 space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-lava/60">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: "#10B981" }} />
          {active} Active
        </div>
        <div className="flex items-center gap-2 text-xs text-lava/60">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: "#F4B942" }} />
          {restricted} Restricted
        </div>
        <div className="flex items-center gap-2 text-xs text-lava/60">
          <span className="h-2 w-2 shrink-0 rounded-full bg-lava/15" />
          {archived} Archived
        </div>
      </div>

      <div className="shrink-0 border-l border-lava/10 pl-5 text-center">
        <div className="text-2xl font-bold text-reef-navy">{total}</div>
        <div className="text-[11px] text-lava/40">Total Depts</div>
      </div>
    </div>
  )
}

function RecentActivity({ refreshKey }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetch("/api/staff/audit/audit-log?limit=4", { cache: "no-store" })
        const j = await res.json().catch(() => ({}))
        if (!cancelled && res.ok && j?.ok) setLogs(j.logs || [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  return (
    <div className="space-y-1">
      {loading ? (
        <>
          <div className="h-10 animate-pulse rounded-lg bg-lava/[0.04]" />
          <div className="h-10 animate-pulse rounded-lg bg-lava/[0.04]" />
          <div className="h-10 animate-pulse rounded-lg bg-lava/[0.04]" />
        </>
      ) : logs.length === 0 ? (
        <p className="py-3 text-center text-xs text-lava/35">No recent activity.</p>
      ) : (
        logs.map((log) => {
          const cfg = ACTIVITY_ICON_MAP[log.action] || { icon: FileText, color: "#94A3B8" }
          const Icon = cfg.icon
          return (
            <div key={log.id} className="flex items-start gap-3 rounded-lg px-1 py-2">
              <span
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{ background: `${cfg.color}1A`, color: cfg.color }}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-reef-navy/80">
                  {log.actor?.robloxUsername || log.actor?.discordUsername || "Someone"}
                  {" — "}
                  {actionLabel(log.action)}
                </span>
                <span className="block text-[11px] text-lava/35">{timeAgo(log.createdAt)}</span>
              </span>
            </div>
          )
        })
      )}
    </div>
  )
}

function Sidebar({ departments, onCreateClick, onAssignMembersClick, onSetPermissionsClick, refreshKey }) {
  const router = useRouter()

  return (
    <div className="overflow-hidden rounded-[28px] border border-lava/10 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="border-b border-lava/8 p-5">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[#B8862B]" />
          <h3 className="text-sm font-bold text-reef-navy">Quick Actions</h3>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <QuickActionPill icon={Plus} label="Create Department" onClick={onCreateClick} />
          <QuickActionPill icon={UserPlus} label="Assign Members" onClick={onAssignMembersClick} />
          <QuickActionPill icon={ShieldCheck} label="Set Permissions" onClick={onSetPermissionsClick} />
          <QuickActionPill icon={FileText} label="View Logs" onClick={() => router.push(VIEW_LOGS_HREF)} />
        </div>
      </div>

      <div className="border-b border-lava/8 p-5">
        <div className="flex items-center gap-2">
          <PieChart className="h-4 w-4 text-[#E6736F]" />
          <h3 className="text-sm font-bold text-reef-navy">Department Overview</h3>
        </div>
        <div className="mt-4">
          <OverviewDonut departments={departments} />
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#C2417F]" />
            <h3 className="text-sm font-bold text-reef-navy">Recent Activity</h3>
          </div>
          <button
            onClick={() => router.push(VIEW_LOGS_HREF)}
            className="flex items-center gap-1 text-xs font-semibold text-[#E6736F] hover:underline"
          >
            View All
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="mt-3">
          <RecentActivity refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  )
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("All")
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [activityRefreshKey, setActivityRefreshKey] = useState(0)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/departments", { cache: "no-store" })
      const j = await res.json().catch(() => ({}))
      if (res.ok && j?.ok) {
        setDepartments(j.departments || [])
        setSelectedId((prev) => prev || j.departments?.[0]?.id || null)
      } else {
        toast.error("unable to load departments")
      }
    } catch {
      toast.error("unable to load departments")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const selected = departments.find((d) => d.id === selectedId)

  const filtered = departments.filter((d) => {
    const matchesQuery = d.name.toLowerCase().includes(query.toLowerCase())
    const matchesFilter = filter === "All" || d.status === filter
    return matchesQuery && matchesFilter
  })

  // Bumps RecentActivity's refresh key so the sidebar picks up a just-logged
  // action without a full page reload.
  function bumpActivity() {
    setActivityRefreshKey((k) => k + 1)
  }

  async function patchDepartment(id, body) {
    const res = await fetch(`/api/departments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok || !j?.ok) return null
    return j.department
  }

  function replaceDepartment(updated) {
    setDepartments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
  }

  async function handleTogglePermission(index) {
    if (!selected) return
    const permission = selected.permissions[index]
    const updated = await patchDepartment(selected.id, { action: "togglePermission", index })
    if (updated) {
      replaceDepartment(updated)
      logAction("permission_updated", {
        department: selected.name,
        permission: permission?.label,
        enabled: !permission?.enabled,
      })
      bumpActivity()
    } else {
      toast.error("unable to update permission")
    }
  }

  async function handleAddMember(username) {
    if (!selected) return false
    const updated = await patchDepartment(selected.id, { action: "addMember", username })
    if (updated) {
      replaceDepartment(updated)
      toast.success(`added ${username}`)
      logAction("member_added", { department: selected.name, username })
      bumpActivity()
      return true
    }
    toast.error("roblox user not found")
    return false
  }

  async function handleRemoveMember(robloxId) {
    if (!selected) return
    const member = selected.members.find((m) => m.robloxId === robloxId)
    const updated = await patchDepartment(selected.id, { action: "removeMember", robloxId })
    if (updated) {
      replaceDepartment(updated)
      logAction("member_removed", { department: selected.name, username: member?.username })
      bumpActivity()
    } else {
      toast.error("unable to remove member")
    }
  }

  async function handleArchive() {
    if (!selected) return
    try {
      const res = await fetch(`/api/departments/${selected.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      const archivedName = selected.name
      setDepartments((prev) => prev.filter((d) => d.id !== selected.id))
      setSelectedId(null)
      toast.success("department archived")
      logAction("department_archived", { department: archivedName })
      bumpActivity()
    } catch {
      toast.error("unable to archive department")
    }
  }

  async function handleCreate({ name, description }) {
    setCreating(true)
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j?.ok) {
        toast.error("unable to create department")
        return false
      }
      setDepartments((prev) => [...prev, j.department])
      setSelectedId(j.department.id)
      setCreateOpen(false)
      toast.success("department created")
      logAction("department_created", { name, description })
      bumpActivity()
      return true
    } catch {
      toast.error("unable to create department")
      return false
    } finally {
      setCreating(false)
    }
  }

  function handleAssignMembersClick() {
    if (departments.length === 0) {
      toast.error("create a department first")
      setCreateOpen(true)
      return
    }
    setSelectedId((prev) => prev || departments[0].id)
  }

  function handleSetPermissionsClick() {
    if (departments.length === 0) {
      toast.error("create a department first")
      setCreateOpen(true)
      return
    }
    setSelectedId((prev) => prev || departments[0].id)
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div
        className={`grid grid-cols-1 gap-6 lg:items-start ${
          selected ? "lg:grid-cols-[1.4fr_1fr_320px]" : "lg:grid-cols-[1fr_320px]"
        }`}
      >
        <div className="flex flex-col overflow-hidden rounded-[28px] border border-lava/10 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="p-6 pb-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "rgba(230,115,111,0.1)" }}>
                  <Users className="h-5 w-5" style={{ color: "#E6736F" }} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-reef-navy">Departments</h1>
                  <p className="text-xs text-lava/45">Create, manage, and organize your team departments.</p>
                </div>
              </div>
              <motion.button
                onClick={() => setCreateOpen(true)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-white shadow-sm"
                style={{ background: BRAND_GRADIENT }}
              >
                <Plus className="h-4 w-4" />
                Create Department
              </motion.button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="relative min-w-[180px] flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-lava/30" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search departments..."
                  className="h-10 w-full rounded-full border border-lava/10 bg-lava/[0.03] pl-10 pr-3 text-sm text-reef-navy outline-none transition placeholder:text-lava/30 focus:border-hibiscus/40"
                />
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-lava/10 bg-lava/[0.02] p-1">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      filter === f ? "text-white shadow-sm" : "text-lava/45 hover:text-reef-navy"
                    }`}
                    style={filter === f ? { background: BRAND_GRADIENT } : undefined}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5">
            {loading ? (
              <div className="divide-y divide-lava/8">
                <div className="h-[72px] animate-pulse bg-lava/[0.04]" />
                <div className="h-[72px] animate-pulse bg-lava/[0.04]" />
                <div className="h-[72px] animate-pulse bg-lava/[0.04]" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-lava/40">No departments match your search.</div>
            ) : (
              <div className="divide-y divide-lava/8 pb-2">
                {filtered.map((dept) => (
                  <DepartmentRow key={dept.id} dept={dept} active={dept.id === selectedId} onClick={() => setSelectedId(dept.id)} />
                ))}
              </div>
            )}
          </div>
        </div>

        {selected ? (
          <div className="lg:sticky lg:top-6 lg:self-start">
            <AnimatePresence mode="wait">
              <DetailPanel
                dept={selected}
                onTogglePermission={handleTogglePermission}
                onAddMember={handleAddMember}
                onRemoveMember={handleRemoveMember}
                onArchive={handleArchive}
              />
            </AnimatePresence>
          </div>
        ) : null}

        <div className="lg:sticky lg:top-6 lg:self-start">
          <Sidebar
            departments={departments}
            onCreateClick={() => setCreateOpen(true)}
            onAssignMembersClick={handleAssignMembersClick}
            onSetPermissionsClick={handleSetPermissionsClick}
            refreshKey={activityRefreshKey}
          />
        </div>
      </div>

      <CreateModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} submitting={creating} />
    </div>
  )
}