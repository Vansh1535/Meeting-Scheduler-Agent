'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import type { MeetingSlotCandidate } from '@/types/scheduling'

interface ReasoningPanelProps {
  candidate: MeetingSlotCandidate
}

export function ReasoningPanel({ candidate }: ReasoningPanelProps) {
  const getSeverityIcon = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return <AlertCircle className="h-4 w-4" />
      case 'medium':
        return <AlertTriangle className="h-4 w-4" />
      case 'low':
        return <Info className="h-4 w-4" />
    }
  }

  const getSeverityVariant = (severity: 'low' | 'medium' | 'high'): 'default' | 'destructive' => {
    switch (severity) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'default'
    }
  }

  const hasWarnings = candidate.warning_details && candidate.warning_details.length > 0

  return (
    <Card className="h-[700px] flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          AI Reasoning
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-6">
            {/* AI Reasoning Text */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Why this time?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {candidate.reasoning || 'No detailed reasoning available for this candidate.'}
              </p>
            </div>

            {/* Availability Status */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Availability</h3>
              {candidate.all_participants_available ? (
                <Badge variant="default" className="bg-green-600">
                  ✅ All participants free
                </Badge>
              ) : (
                <div className="space-y-2">
                  <Badge variant="secondary" className="bg-yellow-600/20">
                    ⚠️ Some conflicts detected
                  </Badge>
                  {candidate.conflicts.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Affected: {candidate.conflicts.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Participant Scores (if available) */}
            {candidate.participant_scores && Object.keys(candidate.participant_scores).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Per-Participant Scoring</h3>
                <div className="space-y-3">
                  {Object.entries(candidate.participant_scores).map(([userId, scores]) => (
                    <div key={userId} className="border-l-2 border-primary/30 pl-3">
                      <p className="text-xs font-medium truncate">{userId}</p>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        <span>Avail: {scores.availability}</span>
                        <span>Pref: {scores.preference}</span>
                        {scores.has_conflict && (
                          <Badge variant="secondary" className="text-xs h-5">
                            Conflict
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings & Alerts */}
            {hasWarnings && (
              <div>
                <h3 className="text-sm font-semibold mb-3">⚠️ Warnings & Considerations</h3>
                <div className="space-y-3">
                  {candidate.warning_details!.map((warning, idx) => (
                    <Alert key={idx} variant={getSeverityVariant(warning.severity)}>
                      <div className="flex items-start gap-2">
                        {getSeverityIcon(warning.severity)}
                        <div className="flex-1">
                          <AlertTitle className="text-sm">{warning.reason}</AlertTitle>
                          {warning.affected_participant && (
                            <AlertDescription className="text-xs mt-1">
                              Affects: {warning.affected_participant}
                            </AlertDescription>
                          )}
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {!hasWarnings && (
              <div className="text-center py-4">
                <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  No warnings for this time slot
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
