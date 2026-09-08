"use client";

import { useEffect, useState } from "react"

export default function FadeIn({ children, delay = 4, className = "" }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div className={`fade-in ${visible ? "fade-in-visible" : ""} ${className}`}>
      {children}
    </div>
  )
}

//hu