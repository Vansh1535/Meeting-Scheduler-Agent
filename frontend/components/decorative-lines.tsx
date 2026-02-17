'use client'

import React from 'react'

// Minimal geometric line patterns
export function DecorationTopLeft() {
  return (
    <svg
      className="absolute top-0 left-0 w-96 h-96 opacity-10 dark:opacity-5 pointer-events-none"
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0 0 L400 0 L400 400" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="1" />
      <path d="M100 100 L200 50 L300 100" stroke="currentColor" strokeWidth="1" />
      <circle cx="200" cy="200" r="50" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </svg>
  )
}

export function DecorationTopRight() {
  return (
    <svg
      className="absolute top-0 right-0 w-96 h-96 opacity-10 dark:opacity-5 pointer-events-none"
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M400 0 L0 0 L0 400" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="350" cy="50" r="30" stroke="currentColor" strokeWidth="1" />
      <path d="M300 100 L200 50 L100 100" stroke="currentColor" strokeWidth="1" />
      <rect x="150" y="150" width="100" height="100" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </svg>
  )
}

export function DecorationBottomLeft() {
  return (
    <svg
      className="absolute bottom-0 left-0 w-80 h-80 opacity-10 dark:opacity-5 pointer-events-none"
      viewBox="0 0 320 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0 320 L320 320 L320 0" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="80" cy="240" r="35" stroke="currentColor" strokeWidth="1" />
      <path d="M100 200 L200 250 L150 300" stroke="currentColor" strokeWidth="1" />
      <line x1="0" y1="200" x2="200" y2="200" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </svg>
  )
}

export function DecorationBottomRight() {
  return (
    <svg
      className="absolute bottom-0 right-0 w-80 h-80 opacity-10 dark:opacity-5 pointer-events-none"
      viewBox="0 0 320 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M320 320 L0 320 L0 0" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="240" cy="240" r="35" stroke="currentColor" strokeWidth="1" />
      <path d="M220 200 L120 250 L170 300" stroke="currentColor" strokeWidth="1" />
      <polygon points="250,150 280,200 250,250 220,200" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </svg>
  )
}

// Grid pattern background
export function GridPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-5 dark:opacity-3 pointer-events-none"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  )
}

// Accent lines for cards
export function AccentLine({ className }: { className?: string }) {
  return (
    <div className={`absolute h-px w-32 bg-gradient-to-r from-transparent via-current to-transparent opacity-20 ${className}`} />
  )
}

// Floating dots pattern
export function FloatingDots() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-20 left-10 w-1 h-1 rounded-full bg-primary opacity-30 animate-float-slow"></div>
      <div className="absolute top-40 right-20 w-1.5 h-1.5 rounded-full bg-accent opacity-20 animate-float-slow animation-delay-200"></div>
      <div className="absolute bottom-32 left-1/4 w-1 h-1 rounded-full bg-secondary opacity-25 animate-float-slow animation-delay-400"></div>
      <div className="absolute top-1/3 right-1/4 w-1 h-1 rounded-full bg-primary opacity-30 animate-float-slow animation-delay-300"></div>
      <div className="absolute bottom-20 right-1/3 w-1.5 h-1.5 rounded-full bg-accent opacity-20 animate-float-slow animation-delay-500"></div>
    </div>
  )
}
