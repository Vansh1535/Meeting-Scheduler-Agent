/**
 * API Route: /api/schedule/recommendations
 * Generates scheduling recommendations based on stored patterns or preferences.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userId = body.userId

    let recommendations: any[] = []

    if (userId) {
      const { data } = await supabase
        .from('compressed_calendars')
        .select('preferred_meeting_times')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      const preferredTimes = data?.preferred_meeting_times || []
      if (Array.isArray(preferredTimes) && preferredTimes.length > 0) {
        recommendations = preferredTimes.slice(0, 5).map((slot: any) => ({
          day_of_week: slot.day_of_week,
          start_hour: slot.start_hour,
          start_minute: slot.start_minute,
          duration_minutes: slot.duration_minutes,
          preference_score: slot.preference_score,
          rationale: slot.rationale || 'Matches historical availability patterns',
        }))
      }
    }

    return NextResponse.json({
      recommendations,
    })
  } catch (error: any) {
    console.error('Recommendations error:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations', message: error.message },
      { status: 500 }
    )
  }
}
