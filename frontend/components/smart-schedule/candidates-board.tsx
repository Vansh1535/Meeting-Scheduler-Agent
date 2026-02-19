'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Trophy } from 'lucide-react'
import { CandidatesList } from './candidates-list'
import { ScoreBreakdown } from './score-breakdown'
import { ReasoningPanel } from './reasoning-panel'
import { CalendarHeatmap } from './calendar-heatmap'
import type { ScheduleResponse, MeetingSlotCandidate } from '@/types/scheduling'

interface CandidatesBoardProps {
  results: ScheduleResponse
  onReset: () => void
}

export function CandidatesBoard({ results, onReset }: CandidatesBoardProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<MeetingSlotCandidate>(
    results.candidates[0] || null
  )

  if (!selectedCandidate) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No candidates available</p>
        <Button onClick={onReset} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Form
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6 text-yellow-500" />
          <div>
            <h2 className="text-2xl font-bold">
              {results.candidates.length} Meeting Options Found
            </h2>
            <p className="text-sm text-muted-foreground">
              Analyzed {results.total_candidates_evaluated} slots in {results.processing_time_ms}ms
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={onReset}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          New Search
        </Button>
      </div>

      {/* 4-Column Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Column 1: Ranked List */}
        <div className="xl:col-span-1">
          <CandidatesList
            candidates={results.candidates}
            selectedCandidate={selectedCandidate}
            onSelect={setSelectedCandidate}
          />
        </div>

        {/* Column 2: Calendar Heatmap */}
        <div className="xl:col-span-1">
          <CalendarHeatmap
            candidates={results.candidates}
            selectedCandidate={selectedCandidate}
          />
        </div>

        {/* Column 3: Score Breakdown */}
        <div className="xl:col-span-1">
          <ScoreBreakdown candidate={selectedCandidate} />
        </div>

        {/* Column 4: Reasoning & Warnings */}
        <div className="xl:col-span-1">
          <ReasoningPanel candidate={selectedCandidate} />
        </div>
      </div>

      {/* Mobile: Stacked layout for smaller screens */}
      <div className="xl:hidden space-y-4">
        <p className="text-xs text-muted-foreground text-center">
          💡 Tip: Use a larger screen for the full 4-column analysis view
        </p>
      </div>
    </div>
  )
}
