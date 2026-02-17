'use client'

import { Play } from 'lucide-react'

export interface EventCardProps {
  number: string
  title: string
  subtitle?: string
  gradient: 'navy-red' | 'orange-red'
  hexColor?: string
  className?: string
  variant?: 'default' | 'compact'
  onClick?: () => void
}

export function EventCard({
  number,
  title,
  subtitle,
  gradient,
  hexColor = '000000',
  className = '',
  variant = 'default',
  onClick,
}: EventCardProps) {
  const isNavyRed = gradient === 'navy-red'
  const bgGradient = isNavyRed
    ? 'from-slate-900 to-red-600'
    : 'from-amber-400 to-red-500'

  return (
    <div
      onClick={onClick}
      className={`relative h-80 rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-elevation-4 hover:scale-105 group shadow-elevation-2 ${className}`}
      style={{
        perspective: '1000px',
      }}
    >
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-b ${bgGradient} transition-all duration-700 group-hover:scale-110`} />

      {/* Multi-layer Overlay for Depth */}
      <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-white via-transparent to-black" />
      <div className="absolute inset-0 opacity-10 bg-gradient-to-tr from-transparent via-white to-transparent" />
      <div className="absolute inset-0 opacity-5 backdrop-blur-sm" />

      {/* Shimmer Effect on Hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white to-transparent transition-opacity duration-700" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-8 text-white">
        {/* Header: Number and Badge */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-6xl md:text-7xl font-outfit font-bold tracking-tighter text-white drop-shadow-lg">{number}</div>
          </div>
          <div className="text-right text-xs md:text-sm uppercase tracking-widest opacity-60 font-medium">
            {subtitle || 'Premium Event'}
          </div>
        </div>

        {/* Play Button Center */}
        <div className="flex justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClick?.()
            }}
            className="p-5 rounded-full bg-white/25 backdrop-blur-md hover:bg-white/40 transition-all duration-500 group shadow-elevation-2 hover:shadow-elevation-3 hover:scale-125 active:scale-95"
            suppressHydrationWarning
          >
            <Play className="w-8 h-8 text-white fill-white group-hover:scale-125 transition-transform duration-300" />
          </button>
        </div>

        {/* Footer: Title and Metadata */}
        <div className="space-y-4">
          <h3 className="text-xl md:text-2xl font-outfit font-semibold text-white/95 line-clamp-2 drop-shadow-md">
            {title}
          </h3>
          <div className="flex items-center justify-between text-xs md:text-sm">
            <div className="font-mono text-white/50 tracking-wider">
              {hexColor.toUpperCase()}
            </div>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-white/50 group-hover:bg-white/70 transition-all" />
              <div className="w-2 h-2 rounded-full bg-white/40 group-hover:bg-white/60 transition-all" />
              <div className="w-2 h-2 rounded-full bg-white/30 group-hover:bg-white/50 transition-all" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
