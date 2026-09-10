"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutGrid,
  Shield,
  AlertTriangle,
  Users,
  FileSearch,
  ArrowLeft,
  Sparkles,
  MessageCircle,
  CalendarClock,
  ScrollText,
  Power,
  Mail,
  Menu,
  Handshake,
  KeySquare,
  ClipboardList,
  Layers,
  Clipboard,
  PartyPopper,
  CreditCard,
  PanelLeftClose,
  PanelLeftOpen,
  Crown,
  TrendingUp,
  Bug
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarImage } from "@/components/ui/avatar"

const SIDEBAR_STORAGE_KEY = "honolua-staff-sidebar-expanded"

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
      { href: "/staff", label: "Overview", icon: LayoutGrid },
      { href: "/staff/support", label: "Support", icon: MessageCircle },
      { href: "/staff/macros", label: "Macros", icon: Clipboard },
      { href: "/staff/payroll", label: "Payroll", icon: CreditCard },
      { href: "/staff/loa", label: "Leave of Absence", icon: CalendarClock },
    ],
  },
  {
    label: "Administration",
    minLevel: ROLE_LEVELS.administrator,
    items: [
      { href: "/staff/reports", label: "Reports", icon: AlertTriangle },
      { href: "/staff/users", label: "Users", icon: Users },
      { href: "/staff/files", label: "Files", icon: FileSearch },
    ],
  },
  {
    label: "Management",
    minLevel: ROLE_LEVELS.manager,
    items: [
      { href: "/staff/staff", label: "Staff", icon: Shield },
      { href: "/staff/applications", label: "Applications", icon: ClipboardList },
      { href: "/staff/partnership-control", label: "Partnerships", icon: Handshake },
      { href: "/staff/email", label: "Email", icon: Mail },
      { href: "/staff/support/analytics", label: "Support Analytics", icon: TrendingUp },
    ],
  },
  {
    label: "Executive",
    minLevel: ROLE_LEVELS.executive,
    items: [
      { href: "/staff/departments", label: "App. Depts", icon: Layers },
      { href: "/staff/giveaways", label: "Giveaways", icon: PartyPopper },
      { href: "/staff/updates", label: "Updates", icon: Sparkles },
      { href: "/staff/ip-bans", label: "IP Bans", icon: KeySquare },
      { href: "/staff/site-control", label: "Site Control", icon: Power },
      { href: "/staff/audit", label: "Audit Logs", icon: ScrollText },
      { href: "/staff/bugs", label: "Bug Reports", icon: Bug },
    ],
  },
]

const FOOTER_ITEMS = [{ href: "/dashboard", label: "Back", icon: ArrowLeft }]

function isActive(pathname, href) {
  if (href === "/staff") return pathname === "/staff"
  return pathname === href || pathname.startsWith(href + "/")
}

function NavItem({ item, pathname, showLabel = false, index = 0, pillId = "active-pill" }) {
  const Icon = item.icon
  const active = isActive(pathname, item.href)

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2, ease: "easeOut" }}
    >
      <Link
        href={item.href}
        className={cn(
          "relative flex items-center rounded-xl transition-colors duration-200",
          showLabel ? "gap-3 px-3 py-2.5" : "justify-center p-2.5",
          active ? "text-reef-navy font-medium" : "text-lava/50 hover:text-reef-navy"
        )}
        title={!showLabel ? item.label : undefined}
      >
        {active ? (
          <motion.div
            layoutId={pillId}
            className="absolute inset-0 rounded-xl bg-black/[0.06]"
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          />
        ) : (
          <motion.div
            className="absolute inset-0 rounded-xl bg-black/[0.035] opacity-0"
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          />
        )}
        <motion.span
          className="relative z-10 flex items-center gap-3"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.25 : 2} />
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
          className="px-3 pb-2 pt-4 text-[10px] font-medium uppercase tracking-[0.22em] text-lava/30 first:pt-1"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function RoleHeader({ username, avatarUrl, role, robloxRank, showLabel }) {
  const isElevated = role === "owner" || role === "executive"

  if (!showLabel) {
    return (
      <div className="relative flex justify-center py-3">
        <motion.div layout transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}>
          <Avatar className="h-8 w-8 rounded-lg bg-lava/5">
            <AvatarImage src={avatarUrl || "/avatars/Placeholder.png"} alt={username || "Staff"} />
          </Avatar>
        </motion.div>
        <AnimatePresence>
          {isElevated ? (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className="absolute -right-0.5 top-2 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white"
              style={{ background: BRAND_GRADIENT }}
            >
              <Crown className="h-2 w-2 text-white" />
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="px-3 py-3">
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <motion.div layout transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}>
            <Avatar className="h-9 w-9 shrink-0 rounded-lg bg-lava/5">
              <AvatarImage src={avatarUrl || "/avatars/Placeholder.png"} alt={username || "Staff"} />
            </Avatar>
          </motion.div>
          <AnimatePresence>
            {isElevated ? (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white"
                style={{ background: BRAND_GRADIENT }}
              >
                <Crown className="h-2.5 w-2.5 text-white" />
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
        <motion.div
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18, delay: 0.05 }}
          className="min-w-0"
        >
          <div className="truncate text-sm font-medium text-reef-navy">{username || "Staff"}</div>
          <div className="truncate text-xs text-lava/45">{robloxRank || "No Roblox rank"}</div>
        </motion.div>
      </div>
    </div>
  )
}

function MobileSidebarContent({ pathname, logoSrc, profile, visibleGroups }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 flex-col justify-center border-b border-lava/10 px-4">
        <div className="flex items-center gap-2">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt="Honolua"
              className="h-4 w-auto object-contain"
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

      <div className="border-b border-lava/10">
        <RoleHeader
          username={profile?.username}
          avatarUrl={profile?.avatarUrl}
          role={profile?.role}
          robloxRank={profile?.robloxRank}
          showLabel
        />
      </div>

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

function DesktopSidebarContent({ pathname, logoSrc, expanded, onToggle, profile, visibleGroups }) {
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
                <img src={logoSrc} alt="Honolua" className="h-5 w-auto object-contain" />
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

      <div className="border-b border-lava/10">
        <RoleHeader
          username={profile?.username}
          avatarUrl={profile?.avatarUrl}
          role={profile?.role}
          robloxRank={profile?.robloxRank}
          showLabel={expanded}
        />
      </div>

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
  const [profile, setProfile] = useState({ username: "", avatarUrl: "", role: "", robloxRank: "" })

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
            robloxRank: j?.user?.robloxRank || "",
          })
        }
      } catch {}
    })()
    return () => {
      cancelled = true
    }
  }, [])

  function toggleExpanded() {
    setExpanded((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0")
      } catch {}
      return next
    })
  }

  const myLevel = ROLE_LEVELS[profile.role] ?? -1
  const visibleGroups = NAV_GROUPS.filter((group) => myLevel >= group.minLevel)

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
            <MobileSidebarContent pathname={pathname} logoSrc={logoSrc} profile={profile} visibleGroups={visibleGroups} />
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
          profile={profile}
          visibleGroups={visibleGroups}
        />
      </motion.aside>
    </>
  )
}