"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  Search,
  ArrowLeft,
  ChevronRight,
  Pencil,
  Shield,
  ShieldCheck,
  Users,
  FileText,
  Trash2,
  Archive,
  X,
  Check,
  Headphones,
  Megaphone,
  MessageSquare,
  Code2,
  Settings2,
  CalendarDays,
  AlertTriangle,
  UserPlus,
  MoreHorizontal,
} from "lucide-react"

/* ────────────────────────────────────────────────────────────────
   Tokens — tropical-ops palette. Keep these names when you port
   this back into Honolua Dashboard's tailwind config:
     ink        -> reef-navy
     inkMuted   -> lava
     hibiscus   -> hibiscus
     gradient   -> BRAND_GRADIENT
   ──────────────────────────────────────────────────────────────── */
const C = {
  bg: "#FBF6EF",
  card: "#FFFFFF",
  ink: "#152A3A",
  inkMuted: "#7A6A61",
  border: "rgba(21,42,58,0.10)",
  borderSoft: "rgba(21,42,58,0.06)",
  gold: "#F4B942",
  coral: "#E6736F",
  hibiscus: "#F0568C",
  teal: "#0E9C8F",
  danger: "#E14B41",
  gradient: "linear-gradient(135deg, #F4B942 0%, #E6736F 55%, #F0568C 100%)",
}

const FONT_DISPLAY = "'Fraunces', ui-serif, Georgia, serif"
const FONT_BODY = "'Manrope', ui-sans-serif, system-ui, sans-serif"
const EASE = [0.16, 1, 0.3, 1]

const ICON_MAP = { Headphones, Megaphone, MessageSquare, Code2, ShieldCheck, Users, Settings2, CalendarDays }
const ICON_CHOICES = Object.keys(ICON_MAP)
const SWATCHES = ["#F4B942", "#E6736F", "#F0568C", "#0E9C8F", "#8B6FD1", "#3B82C4"]

const DEFAULT_PERMISSIONS = [
  { label: "View Staff List", enabled: true },
  { label: "Manage Roles", enabled: false },
  { label: "Access Logs", enabled: false },
  { label: "Manage Department", enabled: false },
]

/* ────────────────────────────────────────────────────────────────
   Mock data — swap for your real /api/departments and Roblox
   group-members endpoints when wiring this in.
   ──────────────────────────────────────────────────────────────── */
const ROSTER = [
  { id: "r1", username: "krishsoham", rank: "Head Admin", robloxId: "48213092" },
  { id: "r2", username: "camoblamoo", rank: "Moderator", robloxId: "91820234" },
  { id: "r3", username: "islandbreeze22", rank: "Moderator", robloxId: "10293845" },
  { id: "r4", username: "tikimaster", rank: "Support", robloxId: "77123456" },
  { id: "r5", username: "waveridr", rank: "Support", robloxId: "55901234" },
  { id: "r6", username: "kona_dev", rank: "Developer", robloxId: "33221100" },
  { id: "r7", username: "pineapple_pete", rank: "Member", robloxId: "10029384" },
  { id: "r8", username: "lanikai_lu", rank: "Member", robloxId: "20938475" },
  { id: "r9", username: "surfsupsam", rank: "Support", robloxId: "40129384" },
  { id: "r10", username: "reefwalker", rank: "Moderator", robloxId: "60293841" },
]

const INITIAL_DEPARTMENTS = [
  {
    id: "d1",
    name: "Support",
    description: "Handles player tickets and in-game reports.",
    icon: "Headphones",
    color: "#E6736F",
    status: "Active",
    members: [ROSTER[3], ROSTER[4], ROSTER[8]],
    permissions: DEFAULT_PERMISSIONS.map((p) => ({ ...p })),
  },
  {
    id: "d2",
    name: "Moderation",
    description: "Keeps chat and the group clean.",
    icon: "ShieldCheck",
    color: "#0E9C8F",
    status: "Active",
    members: [ROSTER[1], ROSTER[2], ROSTER[9]],
    permissions: [
      { label: "View Staff List", enabled: true },
      { label: "Manage Roles", enabled: true },
      { label: "Access Logs", enabled: true },
      { label: "Manage Department", enabled: false },
    ],
  },
  {
    id: "d3",
    name: "Announcements",
    description: "Posts news and event updates.",
    icon: "Megaphone",
    color: "#F4B942",
    status: "Restricted",
    members: [],
    permissions: DEFAULT_PERMISSIONS.map((p) => ({ ...p })),
  },
]

/* ──────────────────────────────────────────────────────────────── */

function hashHue(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return Math.abs(h) % 360
}

function Avatar({ member, size = 44, live = true }) {
  const hue = hashHue(member.robloxId || member.username || "?")
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="flex h-full w-full items-center justify-center rounded-xl text-sm font-bold text-white"
        style={{ background: `linear-gradient(145deg, hsl(${hue},68%,58%), hsl(${hue + 28},68%,46%))` }}
      >
        {member.username?.[0]?.toUpperCase() || "?"}
      </div>
      {live ? (
        <span
          title="Synced with Roblox"
          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2"
          style={{ background: C.teal, borderColor: C.card }}
        />
      ) : null}
    </div>
  )
}

function StatusPill({ status }) {
  const map = {
    Active: { bg: "rgba(14,156,143,0.12)", fg: C.teal },
    Restricted: { bg: "rgba(244,185,66,0.16)", fg: "#9C6E12" },
    Archived: { bg: C.borderSoft, fg: C.inkMuted },
  }
  const s = map[status] || map.Archived
  return (
    <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: s.bg, color: s.fg }}>
      {status}
    </span>
  )
}

function IconBadge({ icon, color, size = 44 }) {
  const Icon = ICON_MAP[icon] || Users
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-xl"
      style={{ width: size, height: size, background: `${color}1E`, color }}
    >
      <Icon style={{ width: size * 0.45, height: size * 0.45 }} />
    </div>
  )
}

function TopBar({ title, subtitle, onBack, right }) {
  return (
    <div className="sticky top-0 z-20 flex items-center gap-3 border-b px-4 py-3.5 backdrop-blur" style={{ background: "rgba(251,246,239,0.9)", borderColor: C.borderSoft }}>
      {onBack ? (
        <button onClick={onBack} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition active:scale-95" style={{ background: C.borderSoft, color: C.ink }}>
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[17px] font-bold leading-tight" style={{ color: C.ink }}>{title}</h1>
        {subtitle ? <p className="truncate text-xs" style={{ color: C.inkMuted }}>{subtitle}</p> : null}
      </div>
      {right}
    </div>
  )
}

function GradientButton({ children, onClick, full, disabled, icon: Icon }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.97 }}
      className={`flex h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-bold text-white shadow-sm disabled:opacity-50 ${full ? "w-full" : ""}`}
      style={{ background: C.gradient }}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </motion.button>
  )
}

function Toast({ message }) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
          style={{ background: C.ink }}
        >
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function ConfirmSheet({ open, tone = "danger", title, message, confirmLabel, onConfirm, onCancel }) {
  const accent = tone === "danger" ? C.danger : C.gold
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} className="fixed inset-0 z-40" style={{ background: "rgba(21,42,58,0.35)" }} />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-3xl p-6 sm:bottom-8 sm:rounded-3xl"
            style={{ background: C.card }}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: `${accent}1A`, color: accent }}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-lg font-bold" style={{ color: C.ink, fontFamily: FONT_DISPLAY }}>{title}</h3>
            <p className="mt-1 text-sm" style={{ color: C.inkMuted }}>{message}</p>
            <div className="mt-5 flex gap-2">
              <button onClick={onCancel} className="h-11 flex-1 rounded-xl text-sm font-semibold" style={{ background: C.borderSoft, color: C.ink }}>
                Cancel
              </button>
              <button onClick={onConfirm} className="h-11 flex-1 rounded-xl text-sm font-bold text-white" style={{ background: accent }}>
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}

function PageShell({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.22, ease: EASE }}
      className="min-h-screen pb-10"
    >
      {children}
    </motion.div>
  )
}

/* ───────────────────────── List view ───────────────────────── */

function ListView({ departments, onOpen, onCreate }) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("All")

  const filtered = departments.filter((d) => {
    const matchQ = d.name.toLowerCase().includes(query.toLowerCase())
    const matchF = filter === "All" || d.status === filter
    return matchQ && matchF
  })

  const active = departments.filter((d) => d.status === "Active").length
  const restricted = departments.filter((d) => d.status === "Restricted").length

  return (
    <PageShell>
      <div className="px-5 pt-6">
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: C.coral, opacity: 0.8 }} />
        <h1 className="text-[26px] font-semibold leading-tight" style={{ color: C.ink, fontFamily: FONT_DISPLAY }}>
          Departments
        </h1>
        <p className="mt-1 text-sm" style={{ color: C.inkMuted }}>
          Organize your staff into teams and control what each one can do.
        </p>

        <div className="mt-4 flex gap-2">
          <div className="flex-1 rounded-2xl border p-3.5" style={{ borderColor: C.borderSoft, background: C.card }}>
            <div className="text-xl font-bold" style={{ color: C.ink }}>{departments.length}</div>
            <div className="text-[11px]" style={{ color: C.inkMuted }}>Total</div>
          </div>
          <div className="flex-1 rounded-2xl border p-3.5" style={{ borderColor: C.borderSoft, background: C.card }}>
            <div className="text-xl font-bold" style={{ color: C.teal }}>{active}</div>
            <div className="text-[11px]" style={{ color: C.inkMuted }}>Active</div>
          </div>
          <div className="flex-1 rounded-2xl border p-3.5" style={{ borderColor: C.borderSoft, background: C.card }}>
            <div className="text-xl font-bold" style={{ color: "#9C6E12" }}>{restricted}</div>
            <div className="text-[11px]" style={{ color: C.inkMuted }}>Restricted</div>
          </div>
        </div>

        <div className="mt-4">
          <GradientButton full icon={Plus} onClick={onCreate}>Create Department</GradientButton>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: C.inkMuted }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search departments"
              className="h-11 w-full rounded-full border pl-10 pr-4 text-sm outline-none"
              style={{ borderColor: C.border, background: C.card, color: C.ink }}
            />
          </div>
        </div>

        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {["All", "Active", "Restricted"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition"
              style={f === filter ? { background: C.gradient, color: "#fff" } : { background: C.card, color: C.inkMuted, border: `1px solid ${C.border}` }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 px-5">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed py-12 text-center" style={{ borderColor: C.border }}>
            <p className="text-sm font-semibold" style={{ color: C.ink }}>No departments here yet</p>
            <p className="mt-1 text-xs" style={{ color: C.inkMuted }}>Try a different search, or create a new one.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((d) => (
              <button
                key={d.id}
                onClick={() => onOpen(d.id)}
                className="flex w-full items-center gap-3.5 rounded-2xl border p-3.5 text-left transition active:scale-[0.99]"
                style={{ borderColor: C.borderSoft, background: C.card }}
              >
                <IconBadge icon={d.icon} color={d.color} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-bold" style={{ color: C.ink }}>{d.name}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs" style={{ color: C.inkMuted }}>{d.description}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: C.inkMuted }}>
                      <Users className="h-3 w-3" /> {d.members.length}
                    </span>
                    <StatusPill status={d.status} />
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0" style={{ color: C.inkMuted }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  )
}

/* ──────────────────────── Form (create / edit) ──────────────────────── */

function FormView({ mode, initial, onBack, onSubmit }) {
  const [name, setName] = useState(initial?.name || "")
  const [description, setDescription] = useState(initial?.description || "")
  const [icon, setIcon] = useState(initial?.icon || ICON_CHOICES[0])
  const [color, setColor] = useState(initial?.color || SWATCHES[0])
  const [error, setError] = useState("")

  function submit() {
    if (!name.trim()) {
      setError("Give this department a name.")
      return
    }
    onSubmit({ name: name.trim(), description: description.trim(), icon, color })
  }

  return (
    <PageShell>
      <TopBar title={mode === "create" ? "New department" : "Edit department"} onBack={onBack} />

      <div className="space-y-5 px-5 py-5">
        <div className="flex justify-center">
          <IconBadge icon={icon} color={color} size={64} />
        </div>

        <div>
          <label className="text-xs font-bold" style={{ color: C.inkMuted }}>Name</label>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setError("") }}
            placeholder="e.g. Support"
            className="mt-1.5 h-12 w-full rounded-xl border px-3.5 text-[15px] outline-none"
            style={{ borderColor: error ? C.danger : C.border, background: C.card, color: C.ink }}
          />
          {error ? <p className="mt-1 text-xs font-semibold" style={{ color: C.danger }}>{error}</p> : null}
        </div>

        <div>
          <label className="text-xs font-bold" style={{ color: C.inkMuted }}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What does this team handle?"
            className="mt-1.5 w-full resize-none rounded-xl border px-3.5 py-3 text-sm outline-none"
            style={{ borderColor: C.border, background: C.card, color: C.ink }}
          />
        </div>

        <div>
          <label className="text-xs font-bold" style={{ color: C.inkMuted }}>Icon</label>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {ICON_CHOICES.map((key) => {
              const Ic = ICON_MAP[key]
              const on = icon === key
              return (
                <button
                  key={key}
                  onClick={() => setIcon(key)}
                  className="flex h-14 items-center justify-center rounded-xl border transition"
                  style={{ borderColor: on ? color : C.border, background: on ? `${color}1A` : C.card, color: on ? color : C.inkMuted }}
                >
                  <Ic className="h-5 w-5" />
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold" style={{ color: C.inkMuted }}>Color</label>
          <div className="mt-2 flex gap-2.5">
            {SWATCHES.map((sw) => (
              <button
                key={sw}
                onClick={() => setColor(sw)}
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: sw, boxShadow: sw === color ? `0 0 0 3px ${C.card}, 0 0 0 5px ${sw}` : "none" }}
              >
                {sw === color ? <Check className="h-4 w-4 text-white" /> : null}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <GradientButton full onClick={submit}>{mode === "create" ? "Create department" : "Save changes"}</GradientButton>
        </div>
      </div>
    </PageShell>
  )
}

/* ─────────────────────── Assign members ─────────────────────── */

function AssignMembersView({ dept, roster, onBack, onAdd }) {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState(new Set())

  const existingIds = new Set(dept.members.map((m) => m.id))
  const candidates = roster.filter((m) => !existingIds.has(m.id) && m.username.toLowerCase().includes(query.toLowerCase()))

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <PageShell>
      <TopBar title="Assign members" subtitle={`From your Roblox group — into ${dept.name}`} onBack={onBack} />

      <div className="px-5 pt-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: C.inkMuted }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search group members"
            className="h-11 w-full rounded-full border pl-10 pr-4 text-sm outline-none"
            style={{ borderColor: C.border, background: C.card, color: C.ink }}
          />
        </div>
      </div>

      <div className="mt-3 space-y-2 px-5 pb-28">
        {candidates.length === 0 ? (
          <p className="py-10 text-center text-sm" style={{ color: C.inkMuted }}>Everyone matching that search is already assigned.</p>
        ) : (
          candidates.map((m) => {
            const on = selected.has(m.id)
            return (
              <button
                key={m.id}
                onClick={() => toggle(m.id)}
                className="flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition"
                style={{ borderColor: on ? C.hibiscus : C.borderSoft, background: on ? `${C.hibiscus}0D` : C.card }}
              >
                <Avatar member={m} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold" style={{ color: C.ink }}>{m.username}</div>
                  <div className="text-[11px]" style={{ color: C.inkMuted }}>#{m.robloxId} · {m.rank}</div>
                </div>
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2"
                  style={{ borderColor: on ? C.hibiscus : C.border, background: on ? C.hibiscus : "transparent" }}
                >
                  {on ? <Check className="h-3.5 w-3.5 text-white" /> : null}
                </div>
              </button>
            )
          })
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t p-4" style={{ background: "rgba(251,246,239,0.92)", borderColor: C.borderSoft, backdropFilter: "blur(6px)" }}>
        <div className="mx-auto max-w-md">
          <GradientButton full disabled={selected.size === 0} onClick={() => onAdd(Array.from(selected))}>
            {selected.size === 0 ? "Select members to add" : `Add ${selected.size} member${selected.size > 1 ? "s" : ""}`}
          </GradientButton>
        </div>
      </div>
    </PageShell>
  )
}

/* ───────────────────────── Detail view ───────────────────────── */

function DetailView({ dept, onBack, onEdit, onAssign, onRemoveMember, onTogglePermission, onArchive, onDelete, onRestore }) {
  const [confirm, setConfirm] = useState(null) // 'archive' | 'delete' | null

  return (
    <PageShell>
      <TopBar
        title={dept.name}
        onBack={onBack}
        right={
          <button onClick={onEdit} className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: C.borderSoft, color: C.ink }}>
            <Pencil className="h-4 w-4" />
          </button>
        }
      />

      <div className="px-5 pb-24 pt-5">
        <div className="flex items-start gap-3.5">
          <IconBadge icon={dept.icon} color={dept.color} size={52} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold" style={{ color: C.ink, fontFamily: FONT_DISPLAY }}>{dept.name}</h2>
              <StatusPill status={dept.status} />
            </div>
            <p className="mt-1 text-sm" style={{ color: C.inkMuted }}>{dept.description || "No description yet."}</p>
          </div>
        </div>

        <div className="mt-5 flex divide-x rounded-2xl border py-3" style={{ borderColor: C.borderSoft, background: C.card }}>
          <div className="flex-1 text-center">
            <div className="text-base font-bold" style={{ color: C.ink }}>{dept.members.length}</div>
            <div className="text-[11px]" style={{ color: C.inkMuted }}>Members</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-base font-bold" style={{ color: C.ink }}>{dept.permissions.filter((p) => p.enabled).length}</div>
            <div className="text-[11px]" style={{ color: C.inkMuted }}>Permissions</div>
          </div>
        </div>

        <div className="mt-7 flex items-center justify-between">
          <h3 className="text-sm font-bold" style={{ color: C.ink }}>Members</h3>
          <button onClick={onAssign} className="flex items-center gap-1 text-xs font-bold" style={{ color: C.hibiscus }}>
            <UserPlus className="h-3.5 w-3.5" /> Assign
          </button>
        </div>

        {dept.members.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed py-8 text-center" style={{ borderColor: C.border }}>
            <p className="text-sm font-semibold" style={{ color: C.ink }}>No members yet</p>
            <p className="mt-1 text-xs" style={{ color: C.inkMuted }}>Pull staff straight from your Roblox group.</p>
            <button onClick={onAssign} className="mt-3 text-xs font-bold" style={{ color: C.hibiscus }}>Assign members →</button>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {dept.members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-2xl border p-3" style={{ borderColor: C.borderSoft, background: C.card }}>
                <Avatar member={m} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold" style={{ color: C.ink }}>{m.username}</div>
                  <div className="text-[11px]" style={{ color: C.inkMuted }}>#{m.robloxId}{m.rank ? ` · ${m.rank}` : ""}</div>
                </div>
                <button
                  onClick={() => onRemoveMember(m.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition"
                  style={{ color: C.inkMuted }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `${C.danger}14`; e.currentTarget.style.color = C.danger }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.inkMuted }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <h3 className="mt-7 text-sm font-bold" style={{ color: C.ink }}>Permissions</h3>
        <div className="mt-3 divide-y rounded-2xl border" style={{ borderColor: C.borderSoft, background: C.card }}>
          {dept.permissions.map((p, i) => (
            <div key={p.label} className="flex items-center justify-between px-4 py-3.5" style={{ borderColor: C.borderSoft }}>
              <span className="text-sm font-medium" style={{ color: C.ink }}>{p.label}</span>
              <button
                onClick={() => onTogglePermission(i)}
                className="relative h-6 w-11 shrink-0 rounded-full transition"
                style={{ background: p.enabled ? C.gold : C.borderSoft }}
              >
                <motion.span layout transition={{ duration: 0.18, ease: EASE }} className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow" style={{ left: p.enabled ? 22 : 2 }} />
              </button>
            </div>
          ))}
        </div>

        <h3 className="mt-7 text-sm font-bold" style={{ color: C.danger }}>Danger zone</h3>
        <div className="mt-3 space-y-2">
          {dept.status === "Archived" ? (
            <button onClick={onRestore} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border text-sm font-bold" style={{ borderColor: C.teal, color: C.teal }}>
              <Archive className="h-4 w-4" /> Restore department
            </button>
          ) : (
            <button onClick={() => setConfirm("archive")} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border text-sm font-bold" style={{ borderColor: C.border, color: C.ink }}>
              <Archive className="h-4 w-4" /> Archive department
            </button>
          )}
          <button onClick={() => setConfirm("delete")} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border text-sm font-bold" style={{ borderColor: `${C.danger}55`, color: C.danger }}>
            <Trash2 className="h-4 w-4" /> Delete department
          </button>
        </div>
      </div>

      <ConfirmSheet
        open={confirm === "archive"}
        tone="neutral"
        title="Archive this department?"
        message="Members stay assigned, but the department is hidden from active lists until you restore it."
        confirmLabel="Archive"
        onCancel={() => setConfirm(null)}
        onConfirm={() => { onArchive(); setConfirm(null) }}
      />
      <ConfirmSheet
        open={confirm === "delete"}
        tone="danger"
        title="Delete this department?"
        message="This removes it and its permission settings for good. Members simply lose this assignment — their accounts aren't affected."
        confirmLabel="Delete"
        onCancel={() => setConfirm(null)}
        onConfirm={() => { onDelete(); setConfirm(null) }}
      />
    </PageShell>
  )
}

/* ─────────────────────────── App ─────────────────────────── */

export default function App() {
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS)
  const [view, setView] = useState({ name: "list" })
  const [toast, setToast] = useState("")

  function flash(msg) {
    setToast(msg)
    setTimeout(() => setToast(""), 2200)
  }

  const selected = view.id ? departments.find((d) => d.id === view.id) : null

  function updateDept(id, patch) {
    setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  }

  return (
    <div style={{ background: C.bg, fontFamily: FONT_BODY, minHeight: "100vh" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Manrope:wght@500;600;700;800&display=swap');`}</style>

      <div className="mx-auto max-w-md">
        <AnimatePresence mode="wait">
          {view.name === "list" && (
            <ListView
              key="list"
              departments={departments}
              onOpen={(id) => setView({ name: "detail", id })}
              onCreate={() => setView({ name: "create" })}
            />
          )}

          {view.name === "create" && (
            <FormView
              key="create"
              mode="create"
              onBack={() => setView({ name: "list" })}
              onSubmit={(data) => {
                const id = `d${Date.now()}`
                const dept = { id, ...data, status: "Active", members: [], permissions: DEFAULT_PERMISSIONS.map((p) => ({ ...p })) }
                setDepartments((prev) => [...prev, dept])
                flash(`${dept.name} created`)
                setView({ name: "detail", id })
              }}
            />
          )}

          {view.name === "edit" && selected && (
            <FormView
              key="edit"
              mode="edit"
              initial={selected}
              onBack={() => setView({ name: "detail", id: selected.id })}
              onSubmit={(data) => {
                updateDept(selected.id, data)
                flash("Changes saved")
                setView({ name: "detail", id: selected.id })
              }}
            />
          )}

          {view.name === "detail" && selected && (
            <DetailView
              key={`detail-${selected.id}`}
              dept={selected}
              onBack={() => setView({ name: "list" })}
              onEdit={() => setView({ name: "edit", id: selected.id })}
              onAssign={() => setView({ name: "assign", id: selected.id })}
              onRemoveMember={(mid) => {
                updateDept(selected.id, { members: selected.members.filter((m) => m.id !== mid) })
              }}
              onTogglePermission={(i) => {
                const permissions = selected.permissions.map((p, idx) => (idx === i ? { ...p, enabled: !p.enabled } : p))
                updateDept(selected.id, { permissions })
              }}
              onArchive={() => { updateDept(selected.id, { status: "Archived" }); flash("Department archived") }}
              onRestore={() => { updateDept(selected.id, { status: "Active" }); flash("Department restored") }}
              onDelete={() => {
                setDepartments((prev) => prev.filter((d) => d.id !== selected.id))
                flash("Department deleted")
                setView({ name: "list" })
              }}
            />
          )}

          {view.name === "assign" && selected && (
            <AssignMembersView
              key={`assign-${selected.id}`}
              dept={selected}
              roster={ROSTER}
              onBack={() => setView({ name: "detail", id: selected.id })}
              onAdd={(ids) => {
                const added = ROSTER.filter((m) => ids.includes(m.id))
                updateDept(selected.id, { members: [...selected.members, ...added] })
                flash(`Added ${added.length} member${added.length > 1 ? "s" : ""}`)
                setView({ name: "detail", id: selected.id })
              }}
            />
          )}
        </AnimatePresence>
      </div>

      <Toast message={toast} />
    </div>
  )
}