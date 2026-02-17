/**
 * API Route: /api/auth/login
 * 
 * Authenticates a user with email and password
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  token: string
  user: {
    id: string
    email: string
    display_name: string
    is_active: boolean
  }
}

interface ErrorResponse {
  error: string
  message: string
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function POST(request: NextRequest) {
  try {
    const { email, password }: LoginRequest = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Invalid input',
          message: 'Email and password are required',
        },
        { status: 400 }
      )
    }

    // Get user from database
    const { data: user, error: fetchError } = await supabase
      .from('user_accounts')
      .select('id, email, display_name, password_hash, is_active')
      .eq('email', email)
      .single()

    if (fetchError || !user) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Account disabled',
          message: 'This account has been disabled',
        },
        { status: 403 }
      )
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash || '')

    if (!passwordMatch) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        },
        { status: 401 }
      )
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json<LoginResponse>(
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          is_active: user.is_active,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json<ErrorResponse>(
      {
        error: 'Server error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
