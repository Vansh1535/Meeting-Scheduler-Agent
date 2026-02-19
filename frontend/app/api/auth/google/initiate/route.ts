/**
 * API Route: /api/auth/google/initiate
 * 
 * Initiates Google OAuth flow by redirecting user to Google consent screen.
 * User will be redirected to /api/auth/google/callback after authorization.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/googleAuth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Get userId from query params to validate correct account
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      // No userId provided - allow OAuth but won't validate email match
      console.warn('⚠️ OAuth initiated without userId - email validation disabled');
      const authUrl = getAuthorizationUrl();
      return NextResponse.redirect(authUrl);
    }

    // Get user's email to pass as login_hint (pre-selects correct Google account)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('user_accounts')
      .select('email')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.warn(`⚠️ User ${userId} not found, proceeding without email hint`);
      const authUrl = getAuthorizationUrl(userId);
      return NextResponse.redirect(authUrl);
    }

    // Generate OAuth authorization URL with user context
    const authUrl = getAuthorizationUrl(userId, userData.email);

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
