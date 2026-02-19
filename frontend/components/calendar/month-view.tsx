'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useUser } from '@/contexts/user-context'
import { useCalendarEvents } from '@/hooks/use-calendar'
import { EventDetailDialog } from './event-detail-dialog'

// Category color mapping for glow effects
const categoryGlowColors = {
  meeting: { from: 'from-blue-500', to: 'to-purple-500', shadow: 'shadow-blue-500/50' },
  personal: { from: 'from-green-500', to: 'to-emerald-500', shadow: 'shadow-green-500/50' },
  work: { from: 'from-slate-500', to: 'to-gray-600', shadow: 'shadow-slate-500/50' },
  social: { from: 'from-orange-500', to: 'to-amber-500', shadow: 'shadow-orange-500/50' },
  health: { from: 'from-red-500', to: 'to-pink-500', shadow: 'shadow-red-500/50' },
}

interface MonthViewProps {
  highlightEvent?: {
    event: any
    category: string
    timestamp: number
  } | null
  onMonthChange?: (date: Date) => void
}

export function MonthView({ highlightEvent, onMonthChange }: MonthViewProps) {
  const [date, setDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [highlightedDay, setHighlightedDay] = useState<number | null>(null)
  const [highlightCategory, setHighlightCategory] = useState<string>('meeting')
  const [showGlowOnDialog, setShowGlowOnDialog] = useState(false)
  const { user } = useUser()
  
  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const previousMonth = () => {
    const newDate = new Date(date.getFullYear(), date.getMonth() - 1)
    setDate(newDate)
    onMonthChange?.(newDate)
  }

  const nextMonth = () => {
    const newDate = new Date(date.getFullYear(), date.getMonth() + 1)
    setDate(newDate)
    onMonthChange?.(newDate)
  }

  const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const days = Array.from({ length: daysInMonth(date) }, (_, i) => i + 1)
  const emptyDays = firstDayOfMonth(date)

  // Calculate start and end dates for the current month
  const startDate = new Date(date.getFullYear(), date.getMonth(), 1).toISOString()
  const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString()

  // Fetch events for the current month
  const { data: events, isLoading, error } = useCalendarEvents(startDate, endDate)

  // Handle highlighted event from category navigation
  useEffect(() => {
    if (!highlightEvent || !highlightEvent.event) return
    
    console.log('✨ Highlight event received:', highlightEvent)
    
    const eventDate = new Date(highlightEvent.event.startTime || highlightEvent.event.start_time)
    const day = eventDate.getDate()
    
    console.log('🎯 Highlighting day:', day, 'with category:', highlightEvent.category)
    
    // Track all timers for cleanup
    let startTimer: NodeJS.Timeout | null = null
    let openTimer: NodeJS.Timeout | null = null
    let glowTimer: NodeJS.Timeout | null = null
    
    // Close any existing dialog first to prevent flickering
    const wasDialogOpen = showEventDialog
    if (wasDialogOpen) {
      setShowEventDialog(false)
      // Clear any existing highlights immediately
      setHighlightedDay(null)
      setShowGlowOnDialog(false)
    }
    
    // Wait longer if dialog was open to ensure smooth close
    const startDelay = wasDialogOpen ? 300 : 0
    
    startTimer = setTimeout(() => {
      // Set highlight with category color
      setHighlightedDay(day)
      setHighlightCategory(highlightEvent.category)
      setShowGlowOnDialog(true)
      
      // After 2.5 seconds, open the event dialog
      openTimer = setTimeout(() => {
        console.log('⏰ Opening dialog for day:', day)
        const clickedDate = new Date(date.getFullYear(), date.getMonth(), day)
        
        // Clear glow and highlight before opening dialog to prevent flicker
        setHighlightedDay(null)
        setShowGlowOnDialog(false)
        
        // Small delay to ensure animations complete
        setTimeout(() => {
          setSelectedDate(clickedDate)
          setShowEventDialog(true)
          setHighlightCategory(highlightEvent.category) // Re-set for dialog ring effect
          
          // Clear dialog glow effect after 2 seconds
          glowTimer = setTimeout(() => {
            setHighlightCategory(null)
          }, 2000)
        }, 100)
      }, 2500)
    }, startDelay)
    
    // Cleanup all timers
    return () => {
      if (startTimer) clearTimeout(startTimer)
      if (openTimer) clearTimeout(openTimer)
      if (glowTimer) clearTimeout(glowTimer)
    }
  }, [highlightEvent?.timestamp]) // Only re-run when timestamp changes

  // Notify parent of initial/current month
  useEffect(() => {
    onMonthChange?.(date)
  }, [date])

  console.log('📅 Calendar Month View:', {
    startDate,
    endDate,
    eventsCount: events?.length || 0,
    isLoading,
    hasError: !!error
  })

  // Calculate which days have events
  const eventDates = new Set<number>()
  const eventsByDate = new Map<number, any[]>()
  
  if (events && Array.isArray(events)) {
    events.forEach((event: any) => {
      const eventDate = new Date(event.startTime || event.start_time)
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

  console.log('📊 Calendar stats:', {
    eventDatesCount: eventDates.size,
    eventsByDateCount: eventsByDate.size
  })

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
                const isHighlighted = highlightedDay === day
                
                // Get category-specific glow colors
                const glowColors = categoryGlowColors[highlightCategory as keyof typeof categoryGlowColors] || categoryGlowColors.meeting
                
                const handleDayClick = () => {
                  if (hasEvents) {
                    const clickedDate = new Date(date.getFullYear(), date.getMonth(), day)
                    setSelectedDate(clickedDate)
                    setShowEventDialog(true)
                  }
                }
                
                return (
                  <div
                    key={day}
                    onClick={handleDayClick}
                    className={`aspect-square flex items-center justify-center rounded-xl text-sm font-semibold transition-all border cursor-pointer ${
                      isHighlighted
                        ? `bg-gradient-to-br ${glowColors.from} ${glowColors.to} text-white border-transparent shadow-2xl ${glowColors.shadow} scale-110 animate-pulse`
                        : hasEvents
                        ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white border-transparent shadow-elevation-2 hover:shadow-elevation-3 hover:scale-105'
                        : 'bg-muted/70 text-foreground border-border/70 hover:bg-muted'
                    }`}
                    title={hasEvents ? `${eventCount} event${eventCount > 1 ? 's' : ''} - Click to view` : ''}
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

      {/* Event Detail Dialog */}
      <EventDetailDialog
        open={showEventDialog}
        onOpenChange={setShowEventDialog}
        events={selectedDate ? eventsByDate.get(selectedDate.getDate()) || [] : []}
        selectedDate={selectedDate || undefined}
        highlightCategory={showGlowOnDialog ? highlightCategory : undefined}
      />
    </Card>
  )
}
