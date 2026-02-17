import { DashboardHeader } from '@/components/dashboard/header'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { UpcomingEvents } from '@/components/dashboard/upcoming-events'
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">
          <DashboardHeader />
          <StatsCards />
          <UpcomingEvents />
        </div>
      </div>
    </ProtectedRoute>
  )
}
