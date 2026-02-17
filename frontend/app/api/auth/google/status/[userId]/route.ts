/**
 * API Route: /api/auth/google/status/[userId]
 */

import { NextRequest, NextResponse } from 'next/server'
import { hasValidOAuthConnection } from '@/lib/googleAuth'
import { supabase } from '@/lib/supabase'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const connected = await hasValidOAuthConnection(userId)

    const { data } = await supabase
      .from('oauth_tokens')
      .select('expires_at')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .single()

    return NextResponse.json({
      connected,
      expires_at: data?.expires_at || null,
    })
  } catch (error: any) {
    console.error('Google status error:', error)
    return NextResponse.json(
      { error: 'Failed to check Google connection', message: error.message },
      { status: 500 }
    )
  }
}
