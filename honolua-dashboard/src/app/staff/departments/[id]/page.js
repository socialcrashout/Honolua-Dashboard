"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  Plus,
  Headphones,
  Megaphone,
  MessageSquare,
  Code2,
  UserPlus,
  CalendarDays,
  ShieldCheck,
  Settings,
  Pencil,
  Shield,
  Users,
  FileText,
  ChevronRight,
  ArrowLeft,
  Trash2,
  X,
} from "lucide-react"

const BRAND_GRADIENT = "linear-gradient(135deg, #F4B942, #E6736F, #F472B6)"
const EASE = [0.16, 1, 0.3, 1]

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

export default function DepartmentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id

  const [dept, setDept] = useState(null)
  const [loading, setLoading] = useState(true)
  const [addingMember, setAddingMember] = useState(false)

  async function load() {
    setLoading(true)
    try {
      // No single-department GET endpoint exists yet, so this fetches the
      // full list and finds the matching one. Fine for a small dataset —
      // add a dedicated GET /api/departments/[id] later if this list grows.
      const res = await fetch("/api/departments", { cache: "no-store" })
      const j = await res.json().catch(() => ({}))
      if (res.ok && j?.ok) {
        const found = (j.departments || []).find((d) => d.id === id)
        if (found) {
          setDept(found)
        } else {
          toast.error("department not found")
          router.push("/staff/departments")
        }
      } else {
        toast.error("unable to load department")
      }
    } catch {
      toast.error("unable to load department")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function patchDepartment(body) {
    const res = await fetch(`/api/departments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok || !j?.ok) return null
    return j.department
  }

  async function handleTogglePermission(index) {
    if (!dept) return
    const permission = dept.permissions[index]
    const updated = await patchDepartment({ action: "togglePermission", index })
    if (updated) {
      setDept(updated)
      logAction("permission_updated", {
        department: dept.name,
        permission: permission?.label,
        enabled: !permission?.enabled,
      })
    } else {
      toast.error("unable to update permission")
    }
  }

  async function handleAddMember(username) {
    if (!dept) return false
    setAddingMember(true)
    const updated = await patchDepartment({ action: "addMember", username })
    setAddingMember(false)
    if (updated) {
      setDept(updated)
      toast.success(`added ${username}`)
      logAction("member_added", { department: dept.name, username })
      return true
    }
    toast.error("roblox user not found")
    return false
  }

  async function handleRemoveMember(robloxId) {
    if (!dept) return
    const member = dept.members.find((m) => m.robloxId === robloxId)
    const updated = await patchDepartment({ action: "removeMember", robloxId })
    if (updated) {
      setDept(updated)
      logAction("member_removed", { department: dept.name, username: member?.username })
    } else {
      toast.error("unable to remove member")
    }
  }

  async function handleArchive() {
    if (!dept) return
    try {
      const res = await fetch(`/api/departments/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("department archived")
      logAction("department_archived", { department: dept.name })
      router.push("/staff/departments")
    } catch {
      toast.error("unable to archive department")
    }
  }

  if (loading) {
    return <div className="py-24 text-center text-sm text-lava/40">Loading department…</div>
  }

  if (!dept) return null

  const Icon = ICON_MAP[dept.icon] || Users

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <button
        onClick={() => router.push("/staff/departments")}
        className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg text-lava/40 transition hover:bg-lava/5 hover:text-reef-navy"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <div className="overflow-hidden rounded-[28px] border border-lava/10 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
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
                <h1 className="text-lg font-bold text-reef-navy">{dept.name}</h1>
                <StatusPill status={dept.status} />
              </div>
              <p className="mt-1 text-sm text-lava/50">{dept.description}</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
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
                      onClick={() => handleRemoveMember(m.robloxId)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-lava/30 transition hover:bg-[#E6736F]/10 hover:text-[#E6736F]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <AddMemberRow onAdd={handleAddMember} adding={addingMember} />
          </div>

          <div className="mt-6 flex-1">
            <div className="text-sm font-semibold text-reef-navy">Permissions</div>
            <div className="mt-3 divide-y divide-lava/8">
              {dept.permissions.map((p, i) => (
                <div key={p.label} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-reef-navy/80">{p.label}</span>
                  <Toggle enabled={p.enabled} onChange={() => handleTogglePermission(i)} />
                </div>
              ))}
            </div>
          </div>

          <motion.button
            onClick={handleArchive}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#E6736F]/20 bg-[#E6736F]/[0.06] text-sm font-semibold text-[#E6736F] transition hover:bg-[#E6736F]/10"
          >
            <Trash2 className="h-4 w-4" />
            Archive Department
          </motion.button>
        </div>
      </div>
    </div>
  )
}