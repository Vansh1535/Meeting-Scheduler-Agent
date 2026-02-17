/**
 * API Route: /api/auth/user
 * 
 * Gets the current user based on email or user ID header
 * Used by the frontend to initialize the logged-in user
 * Supports both X-User-Email and X-User-Id headers
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface ErrorResponse {
  error: string
  message: string
}

export async function GET(request: NextRequest) {
  try {
    // Get email or user ID from headers (supports both for flexibility)
    const email = request.headers.get('X-User-Email')
    const userId = request.headers.get('X-User-Id')

    if (!email && !userId) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Missing credentials',
          message: 'Either X-User-Email or X-User-Id header is required',
        },
        { status: 400 }
      )
    }

    // Try to get user from database (prefer user ID if both provided)
    let query = supabase
      .from('user_accounts')
      .select('id, email, display_name, profile_picture_url, is_active, calendar_sync_enabled, created_at')
    
    if (userId) {
      query = query.eq('id', userId)
    } else if (email) {
      query = query.eq('email', email)
    }

    const { data: user, error: fetchError } = await query.single()

    if (fetchError) {
      // User doesn't exist - only auto-create if looking up by email (for testing)
      if (email && !userId) {
        const { data: newUser, error: createError } = await supabase
          .from('user_accounts')
          .insert([
            {
              email,
              display_name: 'Test User',
              is_active: true,
              calendar_sync_enabled: true,
            },
          ])
          .select('id, email, display_name, profile_picture_url, is_active, calendar_sync_enabled')
          .single()

        if (createError) {
          console.error('Failed to create user:', createError)
          return NextResponse.json<ErrorResponse>(
            {
              error: 'Failed to create user',
              message: createError.message,
            },
            { status: 500 }
          )
        }

        return NextResponse.json({
          id: newUser.id,
          email: newUser.email,
          displayName: newUser.display_name,
          profilePictureUrl: newUser.profile_picture_url,
          isActive: newUser.is_active,
          calendarSyncEnabled: newUser.calendar_sync_enabled,
        })
      }
      
      // User not found by ID lookup
      return NextResponse.json<ErrorResponse>(
        {
          error: 'User not found',
          message: 'User account not found',
        },
        { status: 404 }
      )
    }

    // User exists
    return NextResponse.json({
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      profilePictureUrl: user.profile_picture_url,
      isActive: user.is_active,
      calendarSyncEnabled: user.calendar_sync_enabled,
    })
  } catch (error: any) {
    console.error('Auth error:', error)
    return NextResponse.json<ErrorResponse>(
      {
        error: 'Authentication error',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
