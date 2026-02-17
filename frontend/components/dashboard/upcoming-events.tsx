'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EventCard } from '@/components/event-card'
import { useCalendarEvents } from '@/hooks/use-api'
import { Skeleton } from '@/components/ui/skeleton'

export function UpcomingEvents() {
  // Fetch real calendar events for the next 30 days
  const today = new Date()
  const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  
  const startDate = today.toISOString().split('T')[0]
  const endDate = thirtyDaysLater.toISOString().split('T')[0]
  
  const { data: events = [], isLoading, error } = useCalendarEvents(startDate, endDate)

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

  // Transform real events to display format
  const displayEvents = (events || []).slice(0, 4).map((event: any, idx: number) => ({
    number: String(idx + 1).padStart('02', '0'),
    title: event.title || event.summary || 'Untitled Event',
    subtitle: event.category || 'Meeting',
    gradient: idx % 2 === 0 ? ('navy-red' as const) : ('orange-red' as const),
    hexColor: idx % 2 === 0 ? '5a5a5a' : 'f59e0b',
  }))

  // If no events, show placeholder
  if (displayEvents.length === 0) {
    return (
      <Card className="col-span-full rounded-2xl border-border/60 shadow-elevation-2 hover:shadow-elevation-3 transition-all duration-500 backdrop-blur-soft bg-card/80">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-2xl sm:text-3xl font-outfit font-bold">Upcoming Events</CardTitle>
          <CardDescription className="text-sm sm:text-base font-medium">Your next scheduled events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No events scheduled for the next 30 days</p>
            {error && (
              <p className="text-sm text-yellow-600 mt-2">⚠️ Could not load calendar events. Make sure the backend is running.</p>
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
        <CardDescription className="text-sm sm:text-base font-medium">Your next scheduled events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {displayEvents.map((event, idx) => (
            <EventCard
              key={idx}
              {...event}
              variant="compact"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
