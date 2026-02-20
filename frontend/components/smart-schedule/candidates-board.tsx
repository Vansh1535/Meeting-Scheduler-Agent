'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, Trophy, CheckCircle2, Calendar, Users, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

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

  const handleCreateEvent = async () => {
    setIsCreating(true)
    
    try {
      // Store event data in localStorage for calendar page
      const eventData = {
        start: selectedCandidate.slot.start,
        end: selectedCandidate.slot.end,
        participants: selectedCandidate.participants || [],
        score: selectedCandidate.score,
        reasoning: selectedCandidate.reasoning,
      }
      
      localStorage.setItem('pendingEvent', JSON.stringify(eventData))
      
      toast.success('Event scheduled successfully!', {
        description: `Meeting scheduled for ${new Date(selectedCandidate.slot.start).toLocaleString()}`,
      })
      
      // Navigate to calendar
      setTimeout(() => {
        router.push('/calendar')
      }, 1000)
      
    } catch (error) {
      console.error('Failed to create event:', error)
      toast.error('Failed to create event', {
        description: 'Please try again or create the event manually in your calendar.',
      })
    } finally {
      setIsCreating(false)
      setShowCreateDialog(false)
    }
  }

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
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
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onReset}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Form
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} size="lg" className="gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Optimized Grid Layout - All panels aligned at baseline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[650px]">
        {/* Left Column: Ranked Options - Full height */}
        <div className="lg:col-span-3 h-full">
          <CandidatesList
            candidates={results.candidates}
            selectedCandidate={selectedCandidate}
            onSelect={setSelectedCandidate}
          />
        </div>
        
        {/* Right Column: Time Grid + Bottom Row */}
        <div className="lg:col-span-9 h-full flex flex-col gap-4">
          {/* Time Grid - Full calendar view */}
          <div className="flex-[5]">
            <CalendarHeatmap
              candidates={results.candidates}
              selectedCandidate={selectedCandidate}
            />
          </div>

          {/* Bottom Row: Score Analysis + AI Reasoning */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <ScoreBreakdown candidate={selectedCandidate} />
            <ReasoningPanel candidate={selectedCandidate} />
          </div>
        </div>
      </div>

      {/* Create Event Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Create Calendar Event
            </DialogTitle>
            <DialogDescription>
              Schedule this meeting in your calendar
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-semibold">Start Time</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(selectedCandidate.slot.start)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-semibold">End Time</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(selectedCandidate.slot.end)}
                  </p>
                </div>
              </div>
            </div>
            
            {selectedCandidate.participants && selectedCandidate.participants.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-semibold">Participants</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCandidate.participants.join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">AI Score</span>
                <span className="text-2xl font-bold text-green-600">
                  {selectedCandidate.score.toFixed(1)}/100
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedCandidate.reasoning || 'Optimized time based on availability and preferences'}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateEvent} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Confirm & Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
