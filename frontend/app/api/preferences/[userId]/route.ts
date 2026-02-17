/**
 * API Route: /api/preferences/[userId]
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const DEFAULT_PREFERENCES = {
  notifications: true,
  emailReminders: true,
  darkMode: 'system',
  workHoursStart: '09:00',
  workHoursEnd: '17:00',
  weekStartDay: 'monday',
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const { data, error } = await supabase
      .from('user_preferences')
      .select('settings')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return NextResponse.json(DEFAULT_PREFERENCES)
    }

    return NextResponse.json({
      ...DEFAULT_PREFERENCES,
      ...(data.settings || {}),
    })
  } catch (error: any) {
    console.error('Preferences error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences', message: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const settings = await request.json()

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: userId,
          settings,
        },
        { onConflict: 'user_id' }
      )
      .select('settings')
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      ...DEFAULT_PREFERENCES,
      ...(data?.settings || settings),
    })
  } catch (error: any) {
    console.error('Preferences update error:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences', message: error.message },
      { status: 500 }
    )
  }
}
