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
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Time Grid
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-4">
        <div className="h-full flex flex-col gap-3">
          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-sm flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-green-500/80" />
              <span>Good (75+)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-yellow-500/80" />
              <span>OK (50-74)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-red-500/80" />
              <span>Poor (&lt;50)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-muted/30" />
              <span>None</span>
            </div>
          </div>

          {/* Heatmap Grid - Full view */}
          <div className="flex-1 overflow-y-auto">
            <div className="w-full h-full flex flex-col">
              {/* Header Row */}
              <div className="flex mb-2 sticky top-0 bg-card z-10">
                <div className="w-12 flex-shrink-0" /> {/* Empty corner */}
                {daysOfWeek.map((day) => (
                  <div key={day} className="flex-1 text-center text-sm font-semibold py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Time Rows */}
              <div className="flex-1 flex flex-col justify-between gap-2">
              {hours.map((hour, hourIndex) => (
                <div key={hour} className="flex items-center gap-2 flex-1">
                  <div className="w-12 flex-shrink-0 text-sm text-muted-foreground text-right pr-2">
                    {hour === 12 ? '12p' : hour > 12 ? `${hour - 12}p` : `${hour}a`}
                  </div>
                  {heatmap.map((dayData, dayIndex) => {
                    const cell = dayData[hourIndex]
                    return (
                      <div
                        key={`${dayIndex}-${hourIndex}`}
                        className={cn(
                          'flex-1 h-full rounded-md transition-all min-h-[40px]',
                          getCellColor(cell.count, cell.score),
                          cell.isSelected && 'ring-2 ring-primary ring-offset-1',
                          cell.count > 0 && 'cursor-pointer hover:opacity-80'
                        )}
                        title={cell.count > 0 ? `${cell.count} option(s), score: ${cell.score.toFixed(0)}` : 'No options'}
                      >
                        {cell.count > 0 && (
                          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white">
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
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
