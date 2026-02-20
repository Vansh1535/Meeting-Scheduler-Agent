'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle, Medal } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MeetingSlotCandidate } from '@/types/scheduling'

interface CandidatesListProps {
  candidates: MeetingSlotCandidate[]
  selectedCandidate: MeetingSlotCandidate
  onSelect: (candidate: MeetingSlotCandidate) => void
}

export function CandidatesList({ candidates, selectedCandidate, onSelect }: CandidatesListProps) {
  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const getMedalIcon = (rank: number) => {
    if (rank === 0) return <Medal className="h-4 w-4 text-yellow-500" />
    if (rank === 1) return <Medal className="h-4 w-4 text-gray-400" />
    if (rank === 2) return <Medal className="h-4 w-4 text-amber-600" />
    return null
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600 dark:text-green-400'
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Medal className="h-5 w-5" />
          Ranked Options
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-4 pb-4 pt-1">
          <div className="space-y-3">
            {candidates.map((candidate, index) => (
              <button
                key={index}
                onClick={() => onSelect(candidate)}
                className={cn(
                  'w-full text-left p-4 rounded-lg border-2 transition-all hover:shadow-md',
                  selectedCandidate === candidate
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getMedalIcon(index)}
                    <span className="font-bold text-sm text-muted-foreground">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {candidate.all_participants_available ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className={cn('font-bold text-xl', getScoreColor(candidate.score))}>
                      {candidate.score.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="font-semibold text-sm">
                    {formatTime(candidate.slot.start)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(candidate.slot.end).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </p>
                </div>

                {candidate.conflicts.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {candidate.conflicts.slice(0, 2).map((conflict, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs py-0 h-5">
                        ⚠️ {conflict.split('@')[0]}
                      </Badge>
                    ))}
                    {candidate.conflicts.length > 2 && (
                      <Badge variant="secondary" className="text-xs py-0 h-5">
                        +{candidate.conflicts.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
