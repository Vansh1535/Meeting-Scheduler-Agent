'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar, Clock, MapPin, Users, FileText, User, Briefcase, PartyPopper, Heart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

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
  if (!selectedDate || events.length === 0) return null

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

                  {/* Attendees */}
                  {event.attendeeCount > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{event.attendeeCount} participant{event.attendeeCount !== 1 ? 's' : ''}</span>
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
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
