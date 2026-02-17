/**
 * API Route: /api/auth/google/url
 * Returns Google OAuth authorization URL.
 */

import { NextResponse } from 'next/server'
import { getAuthorizationUrl } from '@/lib/googleAuth'

export async function GET() {
  try {
    const authUrl = getAuthorizationUrl()
    return NextResponse.json({ auth_url: authUrl })
  } catch (error: any) {
    console.error('Failed to get auth URL:', error)
    return NextResponse.json(
      { error: 'OAuth initialization failed', message: error.message },
      { status: 500 }
    )
  }
}
