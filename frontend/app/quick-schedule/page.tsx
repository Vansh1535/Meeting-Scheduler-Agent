import { QuickScheduleForm } from '@/components/quick-schedule/form'
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function QuickSchedulePage() {
  return (
    <ProtectedRoute>
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="mb-8 sm:mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-2">Quick Schedule</h1>
        <p className="text-base sm:text-lg text-muted-foreground">Create events in seconds with our streamlined form</p>
      </div>
      <QuickScheduleForm />
    </div>
    </ProtectedRoute>
  )
}
