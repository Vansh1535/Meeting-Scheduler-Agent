'use client'

import { useEffect, useState } from 'react'
import { MonthView } from '@/components/calendar/month-view'
import { CategoriesSidebar } from '@/components/calendar/categories-sidebar'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { usePathname } from 'next/navigation'

export default function CalendarPage() {
  const [highlightEvent, setHighlightEvent] = useState<any>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const pathname = usePathname()

  useEffect(() => {
    // Check for event to highlight from category navigation (when coming from another page)
    const checkHighlight = () => {
      const storedEvent = localStorage.getItem('highlightEvent')
      if (storedEvent) {
        try {
          const eventData = JSON.parse(storedEvent)
          console.log('📍 Highlight event found from localStorage:', eventData)
          setHighlightEvent(eventData)
          // Clear after reading
          localStorage.removeItem('highlightEvent')
        } catch (e) {
          console.error('Failed to parse highlight event:', e)
        }
      }
    }

    // Check immediately on mount
    checkHighlight()

    // Also check on visibility change (when returning to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkHighlight()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [pathname])

  // Handle event click directly from sidebar (when already on calendar page)
  const handleEventHighlight = (event: any, category: string) => {
    console.log('🎯 Direct event highlight from sidebar:', { event, category })
    // Create new object with new timestamp to trigger re-render
    setHighlightEvent({
      event,
      category,
      timestamp: Date.now()
    })
  }

  // Handle month change from calendar
  const handleMonthChange = (date: Date) => {
    setCurrentDate(date)
  }

  return (
    <ProtectedRoute>
    <div className="pl-4 pr-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Calendar</h1>
        <p className="text-muted-foreground">View and manage your events by date</p>
      </div>
      
      {/* 2-Column Layout: Calendar + Categories Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 lg:gap-8">
        {/* Left: Calendar */}
        <div className="min-w-0">
          <MonthView highlightEvent={highlightEvent} onMonthChange={handleMonthChange} />
        </div>

        {/* Right: Categories Sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-6">
            <CategoriesSidebar onEventClick={handleEventHighlight} viewedDate={currentDate} />
          </div>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  )
}
