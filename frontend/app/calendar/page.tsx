import { MonthView } from '@/components/calendar/month-view'
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function CalendarPage() {
  return (
    <ProtectedRoute>
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Calendar</h1>
          <p className="text-muted-foreground">View and manage your events by date</p>
        </div>
        <div className="max-w-4xl mx-auto">
          <MonthView />
        </div>
      </div>
    </div>
    </ProtectedRoute>
  )
}
