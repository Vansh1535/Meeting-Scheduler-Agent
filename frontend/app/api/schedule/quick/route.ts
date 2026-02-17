/**
 * API Route: /api/schedule/quick
 * Accepts simplified scheduling requests from the frontend.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface QuickScheduleRequest {
  userId: string
  title: string
  description?: string
  duration: number
  category?: string
  preferredDate: string
  preferredTime: string
  priority?: string
  flexibility?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: QuickScheduleRequest = await request.json()

    if (!body.userId || !body.title || !body.preferredDate || !body.preferredTime) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data: user, error: userError } = await supabase
      .from('user_accounts')
      .select('email')
      .eq('id', body.userId)
      .single()

    if (userError || !user?.email) {
      return NextResponse.json(
        { error: 'User not found', message: 'Invalid userId' },
        { status: 404 }
      )
    }

    const preferredDateTime = new Date(`${body.preferredDate}T${body.preferredTime}:00`)
    const earliestDate = new Date(preferredDateTime)
    earliestDate.setDate(earliestDate.getDate() - 2)

    const latestDate = new Date(preferredDateTime)
    latestDate.setDate(latestDate.getDate() + 2)

    const scheduleRequest = {
      meeting_id: `quick-${Date.now()}`,
      participant_emails: [user.email, user.email],
      constraints: {
        duration_minutes: body.duration || 30,
        earliest_date: earliestDate.toISOString(),
        latest_date: latestDate.toISOString(),
        working_hours_start: 9,
        working_hours_end: 17,
        buffer_minutes: 15,
        timezone: 'America/New_York',
        max_candidates: 5,
        allowed_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      },
      preferences: {
        priority: body.priority || 'medium',
        category: body.category || 'meeting',
        preferred_time: preferredDateTime.toISOString(),
        flexibility: body.flexibility || 'flexible',
      },
    }

    const response = await fetch(`${request.nextUrl.origin}/api/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scheduleRequest),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json({
      success: true,
      meetingId: scheduleRequest.meeting_id,
      result: data,
    })
  } catch (error: any) {
    console.error('Quick schedule error:', error)
    return NextResponse.json(
      { error: 'Failed to create schedule', message: error.message },
      { status: 500 }
    )
  }
}
