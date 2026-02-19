'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar, Clock, MapPin, Users, FileText, User, Briefcase, PartyPopper, Heart, Video, Trash2, Copy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

// Helper function to detect category from event title/description
function detectCategory(title: string, description?: string): string {
  const text = `${title} ${description || ''}`.toLowerCase()
  
  if (text.includes('personal') || text.includes('family') || text.includes('birthday') || 
      text.includes('anniversary') || text.includes('vacation') || text.includes('holiday')) {
    return 'personal'
  }
  
  if (text.includes('work') || text.includes('standup') || text.includes('sprint') || 
      text.includes('review') || text.includes('1:1') || text.includes('one-on-one') ||
      text.includes('project') || text.includes('deadline') || text.includes('presentation')) {
    return 'work'
  }
  
  if (text.includes('social') || text.includes('party') || text.includes('dinner') || 
      text.includes('lunch') || text.includes('coffee') || text.includes('hangout') ||
      text.includes('celebration') || text.includes('gathering')) {
    return 'social'
  }
  
  if (text.includes('health') || text.includes('doctor') || text.includes('gym') || 
      text.includes('workout') || text.includes('exercise') || text.includes('therapy') ||
      text.includes('medical') || text.includes('appointment')) {
    return 'health'
  }
  
  return 'meeting'
}

function getCategoryConfig(category: string) {
  switch (category) {
    case 'personal':
      return {
        icon: User,
        label: 'Personal',
        gradient: 'from-green-500/20 to-emerald-500/20',
        textColor: 'text-green-600 dark:text-green-400',
        borderColor: 'from-green-500 to-emerald-500'
      }
    case 'work':
      return {
        icon: Briefcase,
        label: 'Work',
        gradient: 'from-slate-500/20 to-gray-600/20',
        textColor: 'text-slate-600 dark:text-slate-400',
        borderColor: 'from-slate-500 to-gray-600'
      }
    case 'social':
      return {
        icon: PartyPopper,
        label: 'Social',
        gradient: 'from-orange-500/20 to-amber-500/20',
        textColor: 'text-orange-600 dark:text-orange-400',
        borderColor: 'from-orange-500 to-amber-500'
      }
    case 'health':
      return {
        icon: Heart,
        label: 'Health',
        gradient: 'from-red-500/20 to-pink-500/20',
        textColor: 'text-red-600 dark:text-red-400',
        borderColor: 'from-red-500 to-pink-500'
      }
    default: // meeting
      return {
        icon: Users,
        label: 'Meeting',
        gradient: 'from-blue-500/20 to-purple-500/20',
        textColor: 'text-blue-600 dark:text-blue-400',
        borderColor: 'from-blue-500 to-purple-500'
      }
  }
}

interface EventDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  events: any[]
  selectedDate?: Date
  highlightCategory?: string
}

export function EventDetailDialog({ open, onOpenChange, events, selectedDate, highlightCategory }: EventDetailDialogProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [notifyAttendees, setNotifyAttendees] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  if (!selectedDate || events.length === 0) return null

  const handleDeleteClick = (event: any) => {
    setSelectedEvent(event)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedEvent) return
    
    setIsDeleting(true)
    try {
      // TODO: Implement delete API call
      console.log('Deleting event:', {
        eventId: selectedEvent.id,
        reason: deleteReason,
        notifyAttendees,
      })
      
      // Close dialogs and reset state
      setDeleteDialogOpen(false)
      setDeleteReason('')
      setNotifyAttendees(true)
      setSelectedEvent(null)
      
      // Refresh events
      window.location.reload()
    } catch (error) {
      console.error('Failed to delete event:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const getDuration = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffMs = endDate.getTime() - startDate.getTime()
    const diffMins = Math.round(diffMs / 60000)
    
    if (diffMins < 60) {
      return `${diffMins} min`
    }
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-2xl max-h-[80vh] overflow-y-auto transition-all duration-300 ${
        highlightCategory 
          ? 'ring-4 ring-primary/30 shadow-2xl animate-in fade-in-0 zoom-in-95' 
          : ''
      }`}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-outfit">
            {formatDate(selectedDate)}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {events.length} event{events.length !== 1 ? 's' : ''} scheduled
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {events.map((event, idx) => {
            const startTime = event.startTime || event.start_time
            const endTime = event.endTime || event.end_time
            
            // Detect category from title/description
            const detectedCategory = detectCategory(event.title || event.summary || '', event.description)
            const categoryConfig = getCategoryConfig(detectedCategory)
            const CategoryIcon = categoryConfig.icon
            
            // Determine if this is a Google Calendar event
            const isGoogleEvent = event.source === 'google'
            
            // Get meeting link (use google_event_link if available, otherwise construct from event ID)
            const meetingLink = event.google_event_link || 
              (event.google_event_id ? `https://calendar.google.com/calendar/event?eid=${event.google_event_id}` : null)
            
            return (
              <div
                key={idx}
                className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-all"
              >
                {/* Event Title */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-lg font-semibold flex items-start gap-2 flex-1">
                    <span className={`w-1 h-6 bg-gradient-to-b ${categoryConfig.borderColor} rounded-full`} />
                    {event.title || event.summary || 'Untitled Event'}
                  </h3>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs font-semibold whitespace-nowrap ${
                      isGoogleEvent 
                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30' 
                        : 'bg-gradient-to-r from-slate-800/20 to-red-600/20 text-red-600 dark:text-red-400 border-red-500/30'
                    }`}
                  >
                    {isGoogleEvent ? 'GOOGLE CAL' : 'AI PLATFORM'}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  {/* Time */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>
                      {formatTime(startTime)} - {formatTime(endTime)}
                      <span className="ml-2 text-xs">
                        ({getDuration(startTime, endTime)})
                      </span>
                    </span>
                  </div>

                  {/* Category/Status */}
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg bg-gradient-to-br ${categoryConfig.gradient}`}>
                      <CategoryIcon className={`w-4 h-4 ${categoryConfig.textColor}`} />
                    </div>
                    <Badge variant="secondary" className="text-xs font-medium">
                      {categoryConfig.label}
                    </Badge>
                  </div>

                  {/* Location */}
                  {event.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}

                  {/* Attendees/Participants */}
                  {(event.attendeeCount > 0 || (event.participant_availability && event.participant_availability.length > 0) || (event.attendees && event.attendees.length > 0)) && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span className="font-medium text-sm">
                          {(event.attendees?.length || event.participant_availability?.length || event.attendeeCount)} participant{((event.attendees?.length || event.participant_availability?.length || event.attendeeCount) !== 1) ? 's' : ''}
                        </span>
                      </div>
                      
                      {/* Participant List */}
                      {((event.participant_availability && event.participant_availability.length > 0) || (event.attendees && event.attendees.length > 0)) && (
                        <div className="ml-6 space-y-2">
                          {/* AI Meeting Participants */}
                          {event.participant_availability?.map((participant: any, pIdx: number) => {
                            const initials = participant.name
                              ?.split(' ')
                              .map((n: string) => n[0])
                              .join('')
                              .toUpperCase()
                              .substring(0, 2) || '??'
                            
                            return (
                              <div key={`ai-${pIdx}`} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                  {initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-foreground truncate">
                                      {participant.name}
                                    </p>
                                    {participant.is_required && (
                                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                        Required
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {participant.email}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                          
                          {/* Google Calendar Attendees */}
                          {event.attendees?.map((attendee: any, aIdx: number) => {
                            const initials = attendee.name
                              ?.split(' ')
                              .map((n: string) => n[0])
                              .join('')
                              .toUpperCase()
                              .substring(0, 2) || '??'
                            
                            const statusColor = {
                              accepted: 'bg-green-100 dark:bg-green-900/20',
                              declined: 'bg-red-100 dark:bg-red-900/20',
                              tentative: 'bg-yellow-100 dark:bg-yellow-900/20',
                              needsAction: 'bg-gray-100 dark:bg-gray-900/20',
                            }[attendee.responseStatus] || 'bg-gray-100 dark:bg-gray-900/20'
                            
                            return (
                              <div key={`google-${aIdx}`} className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full ${statusColor} flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                                  attendee.responseStatus === 'accepted' ? 'text-green-700 dark:text-green-300' :
                                  attendee.responseStatus === 'declined' ? 'text-red-700 dark:text-red-300' :
                                  attendee.responseStatus === 'tentative' ? 'text-yellow-700 dark:text-yellow-300' :
                                  'text-gray-700 dark:text-gray-300'
                                }`}>
                                  {initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-medium text-foreground truncate">
                                      {attendee.name}
                                    </p>
                                    {attendee.organizer && (
                                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                                        Organizer
                                      </Badge>
                                    )}
                                    {!attendee.is_required && (
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                        Optional
                                      </Badge>
                                    )}
                                    {attendee.responseStatus === 'accepted' && (
                                      <span className="text-xs text-green-600 dark:text-green-400">✓ Yes</span>
                                    )}
                                    {attendee.responseStatus === 'declined' && (
                                      <span className="text-xs text-red-600 dark:text-red-400">✗ No</span>
                                    )}
                                    {attendee.responseStatus === 'tentative' && (
                                      <span className="text-xs text-yellow-600 dark:text-yellow-400">? Maybe</span>
                                    )}
                                    {attendee.responseStatus === 'needsAction' && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400">Awaiting</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {attendee.email}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Meeting Link */}
                  {meetingLink && (
                    <div className="flex items-center gap-2 pt-2 mt-2 border-t border-border">
                      <div className="flex items-center gap-2 text-muted-foreground flex-1">
                        <div className="p-1.5 rounded-lg bg-blue-500/10">
                          <Video className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-foreground">Join with Google Meet</p>
                          <a 
                            href={meetingLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
                          >
                            {meetingLink}
                          </a>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(meetingLink)}
                          className="h-7 w-7 p-0"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {event.description && (
                    <div className="flex items-start gap-2 text-muted-foreground pt-2 mt-2 border-t border-border">
                      <FileText className="w-4 h-4 mt-0.5" />
                      <p className="text-xs leading-relaxed">{event.description}</p>
                    </div>
                  )}
                </div>

                {/* Delete Button (only for AI Platform events) */}
                {!isGoogleEvent && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(event)}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Event
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">{selectedEvent?.title || selectedEvent?.summary}</span>?
            </p>

            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-medium">
                Reason for deletion (optional)
              </Label>
              <Input
                id="reason"
                placeholder="e.g., Schedule conflict, Participant unavailable..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="notify" 
                checked={notifyAttendees}
                onCheckedChange={(checked) => setNotifyAttendees(checked as boolean)}
              />
              <Label
                htmlFor="notify"
                className="text-sm font-normal cursor-pointer"
              >
                Notify all attendees about cancellation
              </Label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false)
                  setDeleteReason('')
                  setNotifyAttendees(true)
                }}
                disabled={isDeleting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1"
              >
                {isDeleting ? 'Deleting...' : 'Delete Event'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
