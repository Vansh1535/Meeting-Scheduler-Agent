'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'
import { ScoreGauge } from './score-gauge'
import { ScoreBar } from './score-bar'
import type { MeetingSlotCandidate } from '@/types/scheduling'

interface ScoreBreakdownProps {
  candidate: MeetingSlotCandidate
}

export function ScoreBreakdown({ candidate }: ScoreBreakdownProps) {
  // Use breakdown data if available, otherwise fallback to root level scores
  const breakdown = candidate.breakdown || {
    availability: candidate.availability_score || 0,
    preference: candidate.preference_score || 0,
    conflict_proximity: 0,
    fragmentation: 0,
    optimization: candidate.optimization_score || 0,
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Score Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-5">
        <div className="flex gap-6 h-full">
          {/* Left: Overall Score Gauge */}
          <div className="flex-shrink-0 flex items-center justify-center w-36">
            <ScoreGauge value={candidate.score} label="Overall" size="lg" />
          </div>

          {/* Right: Score Breakdown Bars */}
          <div className="flex-1 space-y-3">
            <div className="text-sm font-semibold text-muted-foreground mb-3">
              Factor Breakdown
            </div>

            <ScoreBar
              label="Availability"
              value={breakdown.availability}
              weight={35}
              color="green"
              description="All participants free?"
            />

            <ScoreBar
              label="Preference"
              value={breakdown.preference}
              weight={25}
              color="blue"
              description="Matches your patterns"
            />

            <ScoreBar
              label="Conflict Buffer"
              value={breakdown.conflict_proximity}
              weight={20}
              color="yellow"
              description="Spacing from other meetings"
            />

            <ScoreBar
              label="Calendar Grouping"
              value={breakdown.fragmentation}
              weight={15}
              color="purple"
              description="Reduces calendar fragmentation"
            />

            {breakdown.optimization !== undefined && breakdown.optimization > 0 && (
              <ScoreBar
                label="Optimization"
                value={breakdown.optimization}
                weight={5}
                color="indigo"
                description="Additional AI adjustments"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
