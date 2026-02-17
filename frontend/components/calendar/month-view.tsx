'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useUser } from '@/contexts/user-context'
import { useCalendarEvents } from '@/hooks/use-api'

export function MonthView() {
  const [date, setDate] = useState(new Date())
  const { user } = useUser()
  
  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const previousMonth = () => {
    setDate(new Date(date.getFullYear(), date.getMonth() - 1))
  }

  const nextMonth = () => {
    setDate(new Date(date.getFullYear(), date.getMonth() + 1))
  }

  const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const days = Array.from({ length: daysInMonth(date) }, (_, i) => i + 1)
  const emptyDays = firstDayOfMonth(date)

  // Calculate start and end dates for the current month
  const startDate = new Date(date.getFullYear(), date.getMonth(), 1).toISOString()
  const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString()

  // Fetch events for the current month
  const { data: events, isLoading } = useCalendarEvents(startDate, endDate)

  // Calculate which days have events
  const eventDates = new Set<number>()
  const eventsByDate = new Map<number, any[]>()
  
  if (events && Array.isArray(events)) {
    events.forEach((event: any) => {
      const eventDate = new Date(event.startTime)
      if (eventDate.getMonth() === date.getMonth() && eventDate.getFullYear() === date.getFullYear()) {
        const day = eventDate.getDate()
        eventDates.add(day)
        
        if (!eventsByDate.has(day)) {
          eventsByDate.set(day, [])
        }
        eventsByDate.get(day)?.push(event)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{monthName}</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center font-semibold text-muted-foreground text-sm py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty days */}
              {Array.from({ length: emptyDays }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Days */}
              {days.map((day) => {
                const hasEvents = eventDates.has(day)
                const dayEvents = eventsByDate.get(day) || []
                const eventCount = dayEvents.length
                
                return (
                  <div
                    key={day}
                    className={`aspect-square flex items-center justify-center rounded-xl text-sm font-semibold transition-all border cursor-pointer ${
                      hasEvents
                        ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white border-transparent shadow-elevation-2 hover:shadow-elevation-3'
                        : 'bg-muted/70 text-foreground border-border/70 hover:bg-muted'
                    }`}
                    title={hasEvents ? `${eventCount} event${eventCount > 1 ? 's' : ''}` : ''}
                  >
                    <div className="text-center">
                      <div>{day}</div>
                      {hasEvents && (
                        <div className="text-xs mt-1">
                          {eventCount > 1 ? `${eventCount}●` : '●'}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  <span className="inline-block w-3 h-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mr-2" />
                  Days with events
                </p>
                {events && events.length > 0 && (
                  <p className="text-sm font-semibold text-primary">
                    {events.length} event{events.length !== 1 ? 's' : ''} this month
                  </p>
                )}
              </div>
            </div>

            {/* Empty state */}
            {!isLoading && (!events || events.length === 0) && (
              <div className="mt-6 p-6 rounded-lg bg-muted/30 border border-border/40 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  No events this month. Create your first event to see it here!
                </p>
                <a 
                  href="/quick-schedule" 
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Create Event
                </a>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
