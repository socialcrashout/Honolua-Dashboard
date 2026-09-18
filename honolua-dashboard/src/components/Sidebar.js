"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  UserCog,
  FileWarning,
  Users,
  FolderSearch,
  ArrowLeft,
  Megaphone,
  MessageCircleQuestion,
  CalendarClock,
  ScrollText,
  Power,
  Mail,
  Menu,
  Handshake,
  ClipboardList,
  Building2,
  Zap,
  Wallet,
  PanelLeftClose,
  PanelLeftOpen,
  LineChart,
  BarChart3
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarImage } from "@/components/ui/avatar"

const SIDEBAR_STORAGE_KEY = "yumi-staff-sidebar-expanded"
const HONOLUA_ROBLOX_GROUP_ID = "743137138"

// Shared brand gradient used across the site (CTAs, active/elevated accents)
const BRAND_GRADIENT = "linear-gradient(135deg, #F4B942, #E6736F, #F472B6)"
const BRAND_GRADIENT_ROW = "linear-gradient(90deg, #F4B942, #E6736F, #F472B6)"

const ROLE_LEVELS = {
  moderator: 0,
  administrator: 1,
  manager: 2,
  executive: 3,
  owner: 4,
}

const NAV_GROUPS = [
  {
    label: "Employee",
    minLevel: ROLE_LEVELS.moderator,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/staff/support", label: "Support", icon: MessageCircleQuestion },
      { href: "/staff/macros", label: "Macros", icon: Zap },
      { href: "/staff/payroll", label: "Payroll", icon: Wallet },
      { href: "/staff/loa", label: "Leave of Absence", icon: CalendarClock },
      { href: "/staff/site-stats", label: "Site Stats", icon: BarChart3 },
    ],
  },
  {
    label: "Administration",
    minLevel: ROLE_LEVELS.administrator,
    items: [
      { href: "/staff/reports", label: "Reports", icon: FileWarning },
      { href: "/staff/users", label: "Users", icon: Users },
      { href: "/staff/files", label: "Files", icon: FolderSearch },
    ],
  },
  {
    label: "Management",
    minLevel: ROLE_LEVELS.manager,
    items: [
      { href: "/staff/staff", label: "Staff", icon: UserCog },
      { href: "/staff/applications", label: "Applications", icon: ClipboardList },
      { href: "/staff/partnership-control", label: "Partnerships", icon: Handshake },
      { href: "/staff/email", label: "Email", icon: Mail },
      { href: "/staff/support/analytics", label: "Support Analytics", icon: LineChart },
    ],
  },
  {
    label: "Leadership",
    minLevel: ROLE_LEVELS.executive,
    items: [
      { href: "/staff/departments", label: "Departments", icon: Building2 },
      { href: "/staff/updates", label: "Updates", icon: Megaphone },
      { href: "/staff/site-control", label: "Site Control", icon: Power },
      { href: "/staff/audit", label: "Audit Logs", icon: ScrollText },
      { href: "/staff/triggers", label: "Triggers", icon: Zap },
    ],
  },
]

const FOOTER_ITEMS = [{ href: "/", label: "Back", icon: ArrowLeft }]

function isActive(pathname, href) {
  if (href === "/dashboard") return pathname === "/dashboard"
  return pathname === href || pathname.startsWith(href + "/")
}

function NavItem({ item, pathname, showLabel = false, index = 0, pillId = "active-pill" }) {
  const Icon = item.icon
  const active = isActive(pathname, item.href)
  const [ripples, setRipples] = useState([])

  function spawnRipple(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const id = Date.now()
    setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }])
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2, ease: "easeOut" }}
    >
      <Link
        href={item.href}
        onPointerDown={spawnRipple}
        className={cn(
          "relative flex items-center overflow-hidden rounded-md transition-colors duration-200",
          showLabel ? "gap-3 px-3 py-2" : "justify-center p-2.5",
          active ? "text-reef-navy" : "text-lava/50 hover:text-reef-navy"
        )}
        title={!showLabel ? item.label : undefined}
      >
        {active ? (
          <motion.div
            layoutId={pillId}
            className="absolute inset-0 rounded-md"
            style={{
              background:
                "linear-gradient(90deg, rgba(244,185,66,0.12), rgba(230,115,111,0.14), rgba(244,114,182,0.12))",
              backgroundSize: "200% 100%",
            }}
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            transition={{
              layout: { type: "spring", stiffness: 420, damping: 34 },
              backgroundPosition: { duration: 6, repeat: Infinity, ease: "linear" },
            }}
          />
        ) : (
          <motion.div
            className="absolute inset-0 rounded-md bg-lava/5 opacity-0"
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          />
        )}

        <AnimatePresence>
          {ripples.map((r) => (
            <motion.span
              key={r.id}
              className="pointer-events-none absolute rounded-full"
              style={{
                left: r.x,
                top: r.y,
                background: BRAND_GRADIENT_ROW,
                translateX: "-50%",
                translateY: "-50%",
              }}
              initial={{ width: 0, height: 0, opacity: 0.35 }}
              animate={{ width: 120, height: 120, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          ))}
        </AnimatePresence>

        <motion.span
          className="relative z-10 flex items-center gap-3"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <motion.span
            className="flex shrink-0"
            whileHover={{ rotate: [0, -8, 8, -4, 0], scale: 1.12 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
          >
            <Icon className="h-[18px] w-[18px]" />
          </motion.span>
          <AnimatePresence initial={false}>
            {showLabel && (
              <motion.span
                key="label"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="whitespace-nowrap text-sm"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
          {item.badge ? (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className={cn(
                "flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E6736F] px-1 text-[10px] font-semibold text-white",
                showLabel ? "ml-auto" : "absolute -right-0.5 -top-0.5"
              )}
            >
              {item.badge}
            </motion.span>
          ) : null}
        </motion.span>
      </Link>
    </motion.div>
  )
}

function GroupLabel({ children, showLabel }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {!showLabel ? (
        <motion.div
          key="divider"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="my-2 h-px bg-lava/10"
        />
      ) : (
        <motion.div
          key="label"
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="px-3 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-lava/35 first:pt-1"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Roblox username + live group rank, pulled from Bloxlink + Roblox APIs.
// Now the sidebar's single identity block (the old Discord username/role
// header was removed — redundant next to this).
function RobloxStatus({ roblox, showLabel }) {
  if (!roblox?.username) return null

  if (!showLabel) {
    return (
      <div className="relative flex justify-center border-b border-lava/10 py-2.5">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="relative"
          title={
            roblox.inGroup
              ? `${roblox.username} — ${roblox.rankName}`
              : roblox.username
          }
        >
          <Avatar className="h-7 w-7 rounded-full border border-lava/10 bg-lava/5">
            <AvatarImage src={roblox.avatarUrl} alt={roblox.username} />
          </Avatar>
          {roblox.inGroup ? (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.1 }}
              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white"
              style={{ background: BRAND_GRADIENT }}
            />
          ) : null}
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.05 }}
      className="border-b border-lava/10 px-3 py-2.5"
    >
      <div className="flex items-center gap-2.5 rounded-lg border border-lava/10 bg-lava/[0.03] p-2">
        <motion.div layout transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}>
          <Avatar className="h-8 w-8 shrink-0 rounded-full border border-lava/10 bg-lava/5">
            <AvatarImage src={roblox.avatarUrl} alt={roblox.username} />
          </Avatar>
        </motion.div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-medium text-reef-navy">{roblox.username}</div>
          {roblox.inGroup ? (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              transition={{ duration: 0.15, delay: 0.1 }}
              className="mt-0.5 inline-block whitespace-nowrap rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white"
              style={{ background: BRAND_GRADIENT_ROW }}
            >
              {roblox.rankName}
            </motion.div>
          ) : (
            <div className="mt-0.5 text-[9px] uppercase tracking-wide text-lava/35">
              Not in group
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function MobileSidebarContent({ pathname, logoSrc, roblox, visibleGroups }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 flex-col justify-center border-b border-lava/10 px-4">
        <div className="flex items-center gap-2">
          {logoSrc ? (
            <Image
              src={logoSrc}
              alt="Logo"
              width={140}
              height={36}
              className="h-8 w-auto object-contain"
            />
          ) : (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-white"
              style={{ background: BRAND_GRADIENT }}
            >
              Y
            </div>
          )}
        </div>
        <div className="text-[9px] uppercase tracking-[0.2em] text-lava/40">Staff Portal</div>
      </div>

      <RobloxStatus roblox={roblox} showLabel />

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-hide">
        {visibleGroups.map((group, gi) => (
          <div key={group.label}>
            <GroupLabel showLabel>{group.label}</GroupLabel>
            <div className="space-y-1">
              {group.items.map((item, i) => (
                <NavItem
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  showLabel
                  index={gi * 3 + i}
                  pillId="mobile-active-pill"
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="space-y-1 border-t border-lava/10 p-3">
        {FOOTER_ITEMS.map((item) => (
          <NavItem key={item.href} item={item} pathname={pathname} showLabel pillId="mobile-active-pill" />
        ))}
      </div>
    </div>
  )
}

function DesktopSidebarContent({ pathname, logoSrc, expanded, onToggle, roblox, visibleGroups }) {
  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-14 flex-col justify-center border-b border-lava/10",
          expanded ? "px-3" : "items-center"
        )}
      >
        {expanded ? (
          <div className="flex items-center justify-between">
            <div>
              {logoSrc ? (
                <Image
                  src={logoSrc}
                  alt="Logo"
                  width={150}
                  height={38}
                  className="h-7 w-auto object-contain"
                />
              ) : (
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold text-white"
                  style={{ background: BRAND_GRADIENT }}
                >
                  Y
                </div>
              )}
            </div>
            <motion.button
              onClick={onToggle}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.9 }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-lava/50 transition hover:bg-lava/5 hover:text-reef-navy"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>
        ) : (
          <motion.button
            onClick={onToggle}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.9 }}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-lava/50 transition hover:bg-lava/5 hover:text-reef-navy"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </motion.span>
            </AnimatePresence>
          </motion.button>
        )}
        <AnimatePresence>
          {expanded ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, delay: 0.05 }}
              className="mt-0.5 text-[9px] uppercase tracking-[0.2em] text-lava/40"
            >
              Staff Portal
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <RobloxStatus roblox={roblox} showLabel={expanded} />

      <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden p-2 scrollbar-hide">
        {visibleGroups.map((group, gi) => (
          <div key={group.label}>
            <GroupLabel showLabel={expanded}>{group.label}</GroupLabel>
            <div className="space-y-1">
              {group.items.map((item, i) => (
                <NavItem
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  showLabel={expanded}
                  index={gi * 3 + i}
                  pillId="desktop-active-pill"
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-1 border-t border-lava/10 p-2">
        {FOOTER_ITEMS.map((item) => (
          <NavItem key={item.href} item={item} pathname={pathname} showLabel={expanded} pillId="desktop-active-pill" />
        ))}
      </div>
    </div>
  )
}

export default function StaffSidebar() {
  const pathname = usePathname()
  const logoSrc = "/typo.png"
  const [expanded, setExpanded] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [profile, setProfile] = useState({ username: "", avatarUrl: "", role: "", discordId: "" })
  const [roblox, setRoblox] = useState(null)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
      if (stored === "1") setExpanded(true)
    } catch {}
    setHydrated(true)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/auth/me")
        const j = await res.json().catch(() => ({}))
        if (!cancelled && res.ok && j?.ok) {
          setProfile({
            username: j?.user?.username || "",
            avatarUrl: j?.user?.avatarUrl || "",
            role: j?.user?.staffRole || "",
            // NOTE: assuming /api/auth/me exposes the staffer's Discord ID
            // as `discordId` (or falls back to `id`) — adjust if yours differs.
            discordId: j?.user?.discordId || j?.user?.id || "",
          })
        }
      } catch {}
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!profile.discordId) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(
          `/api/bloxlink/lookup?discordId=${encodeURIComponent(profile.discordId)}`
        )
        const j = await res.json().catch(() => ({}))
        if (!cancelled && res.ok && j?.linked) {
          setRoblox({
            username: j.robloxUsername,
            displayName: j.robloxDisplayName,
            avatarUrl: j.avatarUrl,
            inGroup: j.inGroup,
            rankName: j.rankName,
          })
        }
      } catch {
        // fail silently, Roblox block just doesn't show
      }
    })()
    return () => {
      cancelled = true
    }
  }, [profile.discordId])

  function toggleExpanded() {
    setExpanded((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0")
      } catch {}
      return next
    })
  }

  // TEMP: permission filtering disabled — showing all nav groups regardless of role.
  // Re-enable by restoring: NAV_GROUPS.filter((group) => myLevel >= group.minLevel)
  const myLevel = ROLE_LEVELS[(profile.role || "").toLowerCase().trim()] ?? -1
  const visibleGroups = NAV_GROUPS

  return (
    <>
      <div className="fixed left-4 top-4 z-50 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-lava/10 bg-white text-lava/55 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors hover:bg-lava/5 hover:text-reef-navy"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </motion.button>
          </SheetTrigger>
          <SheetContent side="left" className="w-56 border-lava/10 bg-white p-0">
            <MobileSidebarContent
              pathname={pathname}
              logoSrc={logoSrc}
              roblox={roblox}
              visibleGroups={visibleGroups}
            />
          </SheetContent>
        </Sheet>
      </div>

      <motion.aside
        data-sidebar-expanded={hydrated && expanded ? "true" : "false"}
        initial={false}
        animate={{ width: hydrated && expanded ? 216 : 56 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-y-0 left-0 z-40 hidden overflow-hidden border-r border-lava/10 bg-white shadow-[1px_0_3px_rgba(0,0,0,0.03)] md:flex md:flex-col"
      >
        <DesktopSidebarContent
          pathname={pathname}
          logoSrc={logoSrc}
          expanded={hydrated && expanded}
          onToggle={toggleExpanded}
          roblox={roblox}
          visibleGroups={visibleGroups}
        />
      </motion.aside>
    </>
  )
}