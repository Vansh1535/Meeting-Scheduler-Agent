'use client'

import { Brain, Calendar, User, Briefcase, Users, Heart, PartyPopper, type LucideIcon } from 'lucide-react'

export type EventCategory = 'ai-platform' | 'google' | 'meeting' | 'personal' | 'work' | 'social' | 'health'

export interface EventCardProps {
  number: string
  title: string
  subtitle?: string
  gradient: 'navy-red' | 'orange-red' | 'red-dark' | 'green'
  hexColor?: string
  eventDate?: string
  category?: EventCategory
  className?: string
  variant?: 'default' | 'compact'
  onClick?: () => void
}

const categoryIcons: Record<EventCategory, LucideIcon> = {
  'ai-platform': Brain,
  'google': Calendar,
  'meeting': Users,
  'personal': User,
  'work': Briefcase,
  'social': PartyPopper,
  'health': Heart,
}

export function EventCard({
  number,
  title,
  subtitle,
  gradient,
  hexColor = '000000',
  eventDate,
  category = 'meeting',
  className = '',
  variant = 'default',
  onClick,
}: EventCardProps) {
  const bgGradient = gradient === 'navy-red'
    ? 'from-slate-900 to-red-600'
    : gradient === 'red-dark'
    ? 'from-red-600 to-red-900'
    : gradient === 'green'
    ? 'from-green-500 to-emerald-700'
    : 'from-amber-400 to-red-500'
  
  const IconComponent = categoryIcons[category] || Users

  return (
    <div
      onClick={onClick}
      className={`relative h-80 rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-elevation-4 hover:scale-105 group shadow-elevation-2 ${className}`}
    >
      {/* Gradient Background - Simplified */}
      <div className={`absolute inset-0 bg-gradient-to-b ${bgGradient}`} />

      {/* Content with high z-index to ensure visibility */}
      <div className="relative z-50 h-full flex flex-col justify-between p-6" style={{ color: '#ffffff' }}>
        {/* Top: Icon and Category */}
        <div className="flex items-start justify-between">
          <div className="p-3 rounded-2xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
            <IconComponent className="w-12 h-12" style={{ color: '#ffffff', strokeWidth: 2 }} />
          </div>
          <div className="text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{subtitle || 'Event'}</div>
        </div>

        {/* Bottom: Title and Date */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold line-clamp-2 min-h-[3.5rem]" style={{ color: '#ffffff' }}>
            {title}
          </h3>
          <div className="text-sm font-medium line-clamp-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            {eventDate || `#${hexColor.toUpperCase()}`}
          </div>
        </div>
      </div>
    </div>
  )
}
