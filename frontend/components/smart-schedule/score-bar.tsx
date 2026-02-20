'use client'

import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

interface ScoreBarProps {
  label: string
  value: number
  weight?: number
  color?: 'green' | 'blue' | 'yellow' | 'purple' | 'indigo' | 'red'
  description?: string
}

export function ScoreBar({ label, value, weight, color = 'blue', description }: ScoreBarProps) {
  const normalizedValue = Math.max(0, Math.min(100, value))

  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-500',
    red: 'bg-red-500',
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600 dark:text-green-400'
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {label}
            {weight && <span className="text-xs text-muted-foreground ml-1">({weight}%)</span>}
          </span>
        </div>
        <span className={cn('text-sm font-bold', getScoreColor(normalizedValue))}>
          {normalizedValue.toFixed(0)}
        </span>
      </div>
      
      {/* Custom progress bar with color */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn('h-full transition-all duration-500', colorClasses[color])}
          style={{ width: `${normalizedValue}%` }}
        />
      </div>

      {description && (
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  )
}
