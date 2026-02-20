'use client'

import { useState } from 'react'
import { QuickScheduleForm } from '@/components/quick-schedule/form'
import { SuggestionsPanel } from '@/components/quick-schedule/suggestions-panel'
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function QuickSchedulePage() {
  const [formData, setFormData] = useState({
    title: '',
    category: 'meeting',
    date: '',
    time: '',
    duration: '30',
    description: '',
    participants: '',
    showAnalysis: false,
  })

  return (
    <ProtectedRoute>
      <div className="pl-4 pr-8 py-8 max-w-7xl mx-auto">
        {/* Simple Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-2">
            Quick Schedule
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Create events in seconds - optionally see detailed AI analysis
          </p>
        </div>

        {/* Full Width Layout */}
        <div className="w-full">
          <QuickScheduleForm formData={formData} setFormData={setFormData} />
        </div>

        {/* Floating AI Assistant */}
        <SuggestionsPanel formData={formData} />
      </div>
    </ProtectedRoute>
  )
}
