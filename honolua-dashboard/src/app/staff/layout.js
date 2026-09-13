"use client"

import { useEffect, useState } from "react"
import StaffSidebar from "@/components/Sidebar"

const SIDEBAR_STORAGE_KEY = "yumi-staff-sidebar-expanded"

export default function StaffLayout({ children }) {
  const [expanded, setExpanded] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
      if (stored === "1") setExpanded(true)
    } catch {}
    setHydrated(true)
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

  const isExpanded = hydrated && expanded

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, #FFFFFF 0%, #FFF8EF 20%, #FDEFE0 38%, #FFF6EC 58%, #FFFFFF 80%, #FFFFFF 100%)",
      }}
    >
      <StaffSidebar expanded={isExpanded} onToggle={toggleExpanded} />
      <div
        className={`transition-[padding] duration-200 ${
          isExpanded ? "md:pl-[216px]" : "md:pl-14"
        }`}
      >
        {children}
      </div>
    </div>
  )
}