/**
 * API Route: /api/auth/signup
 * 
 * Creates a new user account
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

interface SignupRequest {
  email: string
  password: string
  fullName: string
}

interface SignupResponse {
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
    const { email, password, fullName }: SignupRequest = await request.json()

    // Validate input
    if (!email || !password || !fullName) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Invalid input',
          message: 'Email, password, and fullName are required',
        },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Invalid password',
          message: 'Password must be at least 6 characters',
        },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('user_accounts')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'User exists',
          message: 'An account with this email already exists',
        },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user
    const { data: newUser, error: createError } = await supabase
      .from('user_accounts')
      .insert([
        {
          email,
          display_name: fullName,
          password_hash: hashedPassword,
          is_active: true,
          calendar_sync_enabled: true,
        },
      ])
      .select('id, email, display_name, is_active')
      .single()

    if (createError) {
      console.error('Create user error:', createError)
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Creation failed',
          message: 'Failed to create user account',
        },
        { status: 500 }
      )
    }

    // Create JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json<SignupResponse>(
      {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          display_name: newUser.display_name,
          is_active: newUser.is_active,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json<ErrorResponse>(
      {
        error: 'Server error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
