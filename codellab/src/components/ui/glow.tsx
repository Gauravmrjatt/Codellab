"use client"

import type React from "react"

interface GlowProps {
  children: React.ReactNode
  className?: string
  color?: string
  intensity?: number
}

export function Glow({
  children,
  className = "",
  color = "#edae00",
  intensity = 0.35,
}: GlowProps) {
  return (
    <div className={`relative ${className}`}>
      {/* GLOW LAYER */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-inherit blur-3xl"
        style={{
          background: `radial-gradient(circle at center, ${hexToRgba(
            color,
            intensity
          )}, transparent 70%)`,
        }}
      />

      {children}
    </div>
  )
}

/* Utility */
function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
