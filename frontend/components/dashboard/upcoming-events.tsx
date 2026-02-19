'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EventCard, type EventCategory } from '@/components/event-card'
import { useUpcomingMeetings } from '@/hooks/use-meetings'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import { useUser } from '@/contexts/user-context'
import { api } from '@/lib/api'
import { EventDetailDialog } from '@/components/calendar/event-detail-dialog'

// Helper function to detect category from event title/description
function detectCategory(title: string, description?: string): EventCategory {
  const text = `${title} ${description || ''}`.toLowerCase()
  
  // Personal events
  if (text.includes('personal') || text.includes('family') || text.includes('birthday') || 
      text.includes('anniversary') || text.includes('vacation') || text.includes('holiday')) {
    return 'personal'
  }
  
  // Work events
  if (text.includes('work') || text.includes('standup') || text.includes('sprint') || 
      text.includes('review') || text.includes('1:1') || text.includes('one-on-one') ||
      text.includes('project') || text.includes('deadline') || text.includes('presentation')) {
    return 'work'
  }
  
  // Social events
  if (text.includes('social') || text.includes('party') || text.includes('dinner') || 
      text.includes('lunch') || text.includes('coffee') || text.includes('hangout') ||
      text.includes('celebration') || text.includes('gathering')) {
    return 'social'
  }
  
  // Health events
  if (text.includes('health') || text.includes('doctor') || text.includes('gym') || 
      text.includes('workout') || text.includes('exercise') || text.includes('therapy') ||
      text.includes('medical') || text.includes('appointment')) {
    return 'health'
  }
  
  // Default to meeting
  return 'meeting'
}

export function UpcomingEvents() {
  const [selectedEvent, setSelectedEvent] = React.useState<any>(null)
  const [showEventDialog, setShowEventDialog] = React.useState(false)
  
  // Inline calendar events hook to avoid initialization issues
  const { user, loading: userLoading } = useUser()
  const userId = user?.id || 'test-user'
  
  // Memoize date calculations to prevent infinite re-renders
  const { startDate, endDate } = React.useMemo(() => {
    const today = new Date()
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    return {
      startDate: today.toISOString().split('T')[0],
      endDate: thirtyDaysLater.toISOString().split('T')[0]
    }
  }, []) // Empty deps = calculate only once
  
  const { data: events = [], isLoading: eventsLoading, error: eventsError } = useQuery({
    queryKey: ['calendarEvents', userId, startDate, endDate],
    queryFn: () => api.getEvents(userId, startDate, endDate),
    enabled: !userLoading && !!user,
    staleTime: 30 * 1000, // 30 seconds - real-time updates
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: true, // Update when user returns to tab
    refetchOnMount: true, // Update when component mounts
    refetchOnReconnect: true, // Update when connection restored
  })
  
  const { data: aiMeetings = [], isLoading: meetingsLoading } = useUpcomingMeetings()

  const isLoading = eventsLoading || meetingsLoading

  if (isLoading) {
    return (
      <Card className="col-span-full rounded-2xl border-border/60 shadow-elevation-2 hover:shadow-elevation-3 transition-all duration-500 backdrop-blur-soft bg-card/80">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-2xl sm:text-3xl font-outfit font-bold">Upcoming Events</CardTitle>
          <CardDescription className="text-sm sm:text-base font-medium">Your next scheduled events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="h-40 rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Use calendar events if available, otherwise fall back to AI meetings
  const useCalendarEvents = events && events.length > 0
  const displaySource = useCalendarEvents ? events : aiMeetings

  // Merge calendar events and AI meetings, mark source
  const allEvents = [
    ...(events || []).map((e: any) => ({ ...e, source: 'google' })),
    ...(aiMeetings || []).map((m: any) => ({ ...m, source: 'platform' }))
  ].sort((a, b) => {
    const aTime = new Date(a.startTime || a.start_time || a.earliest_date).getTime()
    const bTime = new Date(b.startTime || b.start_time || b.earliest_date).getTime()
    return aTime - bTime
  })

  // Transform to display format
  const displayEvents = allEvents.slice(0, 4).map((item: any, idx: number) => {
    const isGoogleEvent = item.source === 'google'
    
    if (isGoogleEvent) {
      // Calendar event format (from Google Calendar)
      const startTime = new Date(item.startTime || item.start_time)
      const endTime = new Date(item.endTime || item.end_time)
      const eventDate = startTime.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })
      const eventTime = startTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
      const eventEndTime = endTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
      
      const eventTitle = item.title || item.summary || 'Untitled Event'
      const eventCategory = detectCategory(eventTitle, item.description)
      
      return {
        number: String(idx + 1).padStart(2, '0'),
        title: eventTitle,
        subtitle: 'GOOGLE CAL',
        gradient: 'orange-red' as const, // Yellow/Orange for Google Calendar
        hexColor: 'f59e0b',
        eventDate: `${eventDate}: ${eventTime} - ${eventEndTime}`,
        category: eventCategory,
        eventData: item,
      }
    } else {
      // AI meeting format
      const candidate = item.meeting_candidates?.[0]
      const startTime = candidate ? new Date(candidate.slot_start) : new Date(item.earliest_date)
      const endTime = candidate ? new Date(candidate.slot_end) : new Date(new Date(item.earliest_date).getTime() + (item.duration_minutes || 30) * 60000)
      const eventDate = startTime.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })
      const eventTime = startTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
      const eventEndTime = endTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
      
      const eventTitle = item.title || `AI Meeting: ${item.participant_count || 0} participants`
      const eventCategory = detectCategory(eventTitle, item.description)
      
      return {
        number: String(idx + 1).padStart(2, '0'),
        title: eventTitle,
        subtitle: 'AI PLATFORM',
        gradient: 'navy-red' as const, // Red for AI Platform events
        hexColor: '5a5a5a',
        eventDate: `${eventDate}: ${eventTime} - ${eventEndTime}`,
        category: eventCategory,
        eventData: item,
      }
    }
  })

  // If no events from either source, show placeholder
  if (displayEvents.length === 0) {
    return (
      <Card className="col-span-full rounded-2xl border-border/60 shadow-elevation-2 hover:shadow-elevation-3 transition-all duration-500 backdrop-blur-soft bg-card/80">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-2xl sm:text-3xl font-outfit font-bold">Upcoming Events</CardTitle>
          <CardDescription className="text-sm sm:text-base font-medium">Your next scheduled events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No calendar events in the next 30 days</p>
            {eventsError && (
              <div className="mb-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-yellow-600 dark:text-yellow-400 font-semibold mb-2">
                  📊 Calendar sync not set up
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Sync your Google Calendar to see upcoming events here.
                </p>
                <a 
                  href="/settings"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Sync Google Calendar
                </a>
              </div>
            )}
            {!eventsError && (
              <a 
                href="/quick-schedule"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors mt-2"
              >
                Create Event
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-full rounded-2xl border-border/60 shadow-elevation-2 hover:shadow-elevation-3 transition-all duration-500 backdrop-blur-soft bg-card/80">
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="text-2xl sm:text-3xl font-outfit font-bold">Upcoming Events</CardTitle>
        <CardDescription className="text-sm sm:text-base font-medium">
          {useCalendarEvents ? 'From your Google Calendar' : 'From AI scheduling'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {displayEvents.map((event, idx) => (
            <EventCard
              key={`event-${idx}`}
              number={event.number}
              title={event.title}
              subtitle={event.subtitle}
              gradient={event.gradient}
              hexColor={event.hexColor}
              eventDate={event.eventDate}
              category={event.category}
              variant="compact"
              onClick={() => {
                setSelectedEvent(event.eventData)
                setShowEventDialog(true)
              }}
            />
          ))}
        </div>
      </CardContent>
      
      {/* Event Detail Dialog */}
      <EventDetailDialog
        open={showEventDialog}
        onOpenChange={setShowEventDialog}
        events={selectedEvent ? [selectedEvent] : []}
        selectedDate={selectedEvent ? new Date(selectedEvent.startTime || selectedEvent.start_time) : undefined}
      />
    </Card>
  )
}
