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
      <div className="pl-4 pr-8 py-8">
        {/* Simple Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-2">
            Quick Schedule
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Create events in seconds - optionally see detailed AI analysis
          </p>
        </div>

        {/* 2-Column Layout: Form + Suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_500px] gap-6 lg:gap-8">
          {/* Left: Form */}
          <div className="min-w-0">
            <QuickScheduleForm formData={formData} setFormData={setFormData} />
          </div>

          {/* Right: AI Suggestions Panel */}
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <SuggestionsPanel formData={formData} />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
