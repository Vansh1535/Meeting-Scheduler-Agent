/**
 * API Route: /api/auth/google/initiate
 * 
 * Initiates Google OAuth flow by redirecting user to Google consent screen.
 * User will be redirected to /api/auth/google/callback after authorization.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/googleAuth';

export async function GET(request: NextRequest) {
  try {
    // Generate OAuth authorization URL
    const authUrl = getAuthorizationUrl();

    // Redirect user to Google consent screen
    return NextResponse.redirect(authUrl);

  } catch (error: any) {
    console.error('Failed to initiate Google OAuth:', error);

    return NextResponse.json(
      {
        error: 'OAuth initialization failed',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
