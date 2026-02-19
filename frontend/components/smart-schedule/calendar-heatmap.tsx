'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MeetingSlotCandidate } from '@/types/scheduling'

interface CalendarHeatmapProps {
  candidates: MeetingSlotCandidate[]
  selectedCandidate: MeetingSlotCandidate
}

export function CalendarHeatmap({ candidates, selectedCandidate }: CalendarHeatmapProps) {
  // Generate a week view grid based on candidates
  const generateHeatmapData = () => {
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    const hours = Array.from({ length: 10 }, (_, i) => i + 9) // 9am to 6pm

    const heatmap = daysOfWeek.map((day, dayIndex) => {
      return hours.map((hour) => {
        // Find candidates that match this day/hour
        const matchingCandidates = candidates.filter((c) => {
          const date = new Date(c.slot.start)
          const candidateDay = date.getDay() // 0=Sun, 1=Mon, etc
          const candidateHour = date.getHours()
          
          // Convert to Mon-Fri (0-4)
          const adjustedDay = candidateDay === 0 ? 6 : candidateDay - 1
          
          return adjustedDay === dayIndex && candidateHour === hour
        })

        const isSelected = matchingCandidates.some((c) => c === selectedCandidate)
        const bestScore = Math.max(...matchingCandidates.map((c) => c.score), 0)
        
        return {
          day,
          hour,
          count: matchingCandidates.length,
          score: bestScore,
          isSelected,
        }
      })
    })

    return { daysOfWeek, hours, heatmap }
  }

  const { daysOfWeek, hours, heatmap } = generateHeatmapData()

  const getCellColor = (count: number, score: number) => {
    if (count === 0) return 'bg-muted/30'
    if (score >= 75) return 'bg-green-500/80'
    if (score >= 50) return 'bg-yellow-500/80'
    return 'bg-red-500/80'
  }

  return (
    <Card className="h-[700px] flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Time Grid
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500/80" />
              <span>Good (75+)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500/80" />
              <span>OK (50-74)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500/80" />
              <span>Poor (&lt;50)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-muted/30" />
              <span>None</span>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="overflow-auto">
            <div className="inline-block min-w-full">
              {/* Header Row */}
              <div className="flex">
                <div className="w-12 flex-shrink-0" /> {/* Empty corner */}
                {daysOfWeek.map((day) => (
                  <div key={day} className="flex-1 text-center text-xs font-semibold py-1 min-w-[60px]">
                    {day}
                  </div>
                ))}
              </div>

              {/* Time Rows */}
              {hours.map((hour, hourIndex) => (
                <div key={hour} className="flex items-center">
                  <div className="w-12 flex-shrink-0 text-xs text-muted-foreground text-right pr-2">
                    {hour === 12 ? '12pm' : hour > 12 ? `${hour - 12}pm` : `${hour}am`}
                  </div>
                  {heatmap.map((dayData, dayIndex) => {
                    const cell = dayData[hourIndex]
                    return (
                      <div
                        key={`${dayIndex}-${hourIndex}`}
                        className={cn(
                          'flex-1 aspect-square rounded m-0.5 transition-all min-w-[50px]',
                          getCellColor(cell.count, cell.score),
                          cell.isSelected && 'ring-2 ring-primary ring-offset-2',
                          cell.count > 0 && 'cursor-pointer hover:opacity-80'
                        )}
                        title={cell.count > 0 ? `${cell.count} option(s), score: ${cell.score.toFixed(0)}` : 'No options'}
                      >
                        {cell.count > 0 && (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                            {cell.count > 1 ? cell.count : ''}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <p className="text-xs text-muted-foreground text-center pt-2">
            📅 Hover over cells to see options · Darker = better score
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
