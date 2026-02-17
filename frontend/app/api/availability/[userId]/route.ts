/**
 * API Route: /api/availability/[userId]
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const DEFAULT_AVAILABILITY = {
  weekly: [],
  exceptions: [],
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const { data, error } = await supabase
      .from('user_availability')
      .select('availability')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return NextResponse.json(DEFAULT_AVAILABILITY)
    }

    return NextResponse.json({
      ...DEFAULT_AVAILABILITY,
      ...(data.availability || {}),
    })
  } catch (error: any) {
    console.error('Availability error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability', message: error.message },
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
    const availability = await request.json()

    const { data, error } = await supabase
      .from('user_availability')
      .upsert(
        {
          user_id: userId,
          availability,
        },
        { onConflict: 'user_id' }
      )
      .select('availability')
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      ...DEFAULT_AVAILABILITY,
      ...(data?.availability || availability),
    })
  } catch (error: any) {
    console.error('Availability update error:', error)
    return NextResponse.json(
      { error: 'Failed to update availability', message: error.message },
      { status: 500 }
    )
  }
}
