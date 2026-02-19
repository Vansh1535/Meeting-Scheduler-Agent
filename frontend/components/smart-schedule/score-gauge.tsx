'use client'

import { cn } from '@/lib/utils'

interface ScoreGaugeProps {
  value: number
  label: string
  size?: 'sm' | 'md' | 'lg'
}

export function ScoreGauge({ value, label, size = 'lg' }: ScoreGaugeProps) {
  const normalizedValue = Math.max(0, Math.min(100, value))
  
  const sizes = {
    sm: { container: 'w-24 h-24', text: 'text-xl', label: 'text-xs' },
    md: { container: 'w-32 h-32', text: 'text-2xl', label: 'text-sm' },
    lg: { container: 'w-40 h-40', text: 'text-4xl', label: 'text-base' },
  }

  const getColor = (score: number) => {
    if (score >= 75) return 'text-green-600 dark:text-green-400'
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getStrokeColor = (score: number) => {
    if (score >= 75) return 'stroke-green-600 dark:stroke-green-400'
    if (score >= 50) return 'stroke-yellow-600 dark:stroke-yellow-400'
    return 'stroke-red-600 dark:stroke-red-400'
  }

  const radius = 60
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (normalizedValue / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn('relative', sizes[size].container)}>
        <svg className="transform -rotate-90 w-full h-full">
          {/* Background circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            className="stroke-muted fill-none"
            strokeWidth="10"
          />
          {/* Progress circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            className={cn('fill-none transition-all duration-500', getStrokeColor(normalizedValue))}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold', sizes[size].text, getColor(normalizedValue))}>
            {normalizedValue.toFixed(0)}
          </span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      
      <span className={cn('font-semibold text-center', sizes[size].label)}>
        {label}
      </span>
    </div>
  )
}
