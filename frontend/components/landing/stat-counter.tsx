'use client'

import { useState, useEffect } from 'react'

export interface StatCounterProps {
  target: number
  suffix?: string
  prefix?: string
  duration?: number
  label: string
  isVisible?: boolean
}

export function StatCounter({
  target,
  suffix = '',
  prefix = '',
  duration = 2000,
  label,
  isVisible = true,
}: StatCounterProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isVisible) {
      setCount(0)
      return
    }

    let startTime: number | null = null
    let animationId: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = (timestamp - startTime) / duration
      
      if (progress < 1) {
        setCount(Math.floor(target * progress))
        animationId = requestAnimationFrame(animate)
      } else {
        setCount(target)
      }
    }

    animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [target, duration, isVisible])

  return (
    <div className="text-center p-8 rounded-2xl bg-card/50 border border-border/40 backdrop-blur-soft hover:bg-card/80 hover:shadow-elevation-2 hover:border-primary/30 transition-all duration-500 group">
      <div className="text-5xl sm:text-6xl font-black text-primary mb-3 font-outfit">
        {prefix}{count}{suffix}
      </div>
      <p className="text-muted-foreground text-base font-medium uppercase tracking-widest">{label}</p>
      <div className="h-1 w-0 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mt-4 group-hover:w-full transition-all duration-500" />
    </div>
  )
}
