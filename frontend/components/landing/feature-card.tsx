'use client'

import { LucideIcon } from 'lucide-react'

export interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  gradient?: 'navy-red' | 'orange-red'
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient = 'navy-red',
}: FeatureCardProps) {
  const gradientClass = gradient === 'navy-red'
    ? 'from-slate-900 to-red-600'
    : 'from-amber-400 to-red-500'

  return (
    <div className="group cursor-pointer h-full">
      <div className="relative p-6 sm:p-8 rounded-2xl bg-card border border-border/50 transition-all duration-500 hover:border-primary/40 hover:shadow-elevation-3 hover:bg-card/80 h-full overflow-hidden backdrop-blur-soft">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Icon Container */}
        <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${gradientClass} mb-6 group-hover:scale-125 transition-all duration-500 relative z-10`}>
          <Icon className="w-7 h-7 text-white" />
        </div>

        {/* Content */}
        <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-2 sm:mb-3 relative z-10 group-hover:text-primary transition-colors duration-300">{title}</h3>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed relative z-10">{description}</p>

        {/* Top accent line */}
        <div className="absolute top-0 left-0 h-0.5 w-0 bg-gradient-to-r from-primary to-accent rounded-full group-hover:w-1/3 transition-all duration-700" />

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-accent rounded-t-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
      </div>
    </div>
  )
}
