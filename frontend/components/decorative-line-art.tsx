'use client'

export function DecorativeLine({ 
  direction = 'horizontal',
  className = '',
  animated = false,
}: { 
  direction?: 'horizontal' | 'vertical' | 'diagonal'
  className?: string
  animated?: boolean
}) {
  return (
    <svg
      className={`${className} ${animated ? 'animate-pulse' : ''}`}
      viewBox="0 0 100 2"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line
        x1="0"
        y1="1"
        x2="100"
        y2="1"
        stroke="url(#lineGradient)"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export function ScheduleLineArt() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-full opacity-20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="scheduleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Calendar grid */}
      <g stroke="url(#scheduleGradient)" strokeWidth="1.5" fill="none">
        {/* Main calendar box */}
        <rect x="20" y="20" width="160" height="160" rx="8" />

        {/* Grid lines */}
        <line x1="20" y1="50" x2="180" y2="50" />
        <line x1="20" y1="80" x2="180" y2="80" />
        <line x1="20" y1="110" x2="180" y2="110" />
        <line x1="20" y1="140" x2="180" y2="140" />

        <line x1="50" y1="20" x2="50" y2="180" />
        <line x1="80" y1="20" x2="80" y2="180" />
        <line x1="110" y1="20" x2="110" y2="180" />
        <line x1="140" y1="20" x2="140" y2="180" />

        {/* Time markers */}
        <circle cx="40" cy="40" r="2" />
        <circle cx="100" cy="60" r="2" />
        <circle cx="160" cy="90" r="2" />
        <circle cx="70" cy="130" r="2" />
      </g>

      {/* Time block indicators */}
      <g stroke="url(#scheduleGradient)" strokeWidth="1" fill="none">
        <rect x="35" y="55" width="25" height="20" rx="2" />
        <rect x="75" y="75" width="30" height="25" rx="2" />
        <rect x="125" y="95" width="35" height="30" rx="2" />
      </g>
    </svg>
  )
}

export function TimelineLineArt() {
  return (
    <svg
      viewBox="0 0 300 100"
      className="w-full h-full opacity-25"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
          <stop offset="50%" stopColor="currentColor" stopOpacity="0.4" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Main timeline */}
      <line
        x1="20"
        y1="50"
        x2="280"
        y2="50"
        stroke="url(#timelineGradient)"
        strokeWidth="2"
      />

      {/* Timeline points */}
      <g fill="currentColor" opacity="0.3">
        <circle cx="50" cy="50" r="4" />
        <circle cx="120" cy="50" r="4" />
        <circle cx="190" cy="50" r="4" />
        <circle cx="260" cy="50" r="4" />
      </g>

      {/* Connecting lines */}
      <g stroke="currentColor" strokeWidth="1" opacity="0.2" strokeDasharray="3,2">
        <line x1="50" y1="50" x2="50" y2="20" />
        <line x1="120" y1="50" x2="120" y2="20" />
        <line x1="190" y1="50" x2="190" y2="20" />
        <line x1="260" y1="50" x2="260" y2="20" />
      </g>
    </svg>
  )
}

export function DotGrid() {
  return (
    <svg
      viewBox="0 0 400 400"
      className="w-full h-full opacity-30"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="dotPattern"
          x="20"
          y="20"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="20" cy="20" r="1.5" fill="currentColor" opacity="0.4" />
        </pattern>
      </defs>
      <rect width="400" height="400" fill="url(#dotPattern)" />
    </svg>
  )
}

export function AbstractLineAccent() {
  return (
    <svg
      viewBox="0 0 200 30"
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="20%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="80%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Wavy line accent */}
      <path
        d="M 10 15 Q 30 5 50 15 T 90 15 T 130 15 T 170 15 T 210 15"
        stroke="url(#accentGradient)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Subtle dots */}
      <circle cx="50" cy="15" r="1" fill="currentColor" opacity="0.4" />
      <circle cx="110" cy="15" r="1" fill="currentColor" opacity="0.4" />
      <circle cx="170" cy="15" r="1" fill="currentColor" opacity="0.4" />
    </svg>
  )
}
