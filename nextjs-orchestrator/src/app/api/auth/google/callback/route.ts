/**
 * API Route: /api/auth/google/callback
 * 
 * Handles OAuth callback from Google after user authorization.
 * Exchanges authorization code for access token, stores tokens, and creates user account.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeCodeForTokens,
  getUserProfile,
  upsertUserAccount,
  storeOAuthTokens,
} from '@/lib/googleAuth';

export async function GET(request: NextRequest) {
  try {
    // Extract authorization code from query params
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Handle user denial
    if (error) {
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(error)}&message=${encodeURIComponent('Google authorization was denied')}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/?error=missing_code&message=' + encodeURIComponent('Authorization code not provided'), request.url)
      );
    }

    console.log('📝 Exchanging authorization code for tokens...');

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    console.log('👤 Fetching user profile from Google...');

    // Get user profile
    const profile = await getUserProfile(tokens.access_token);

    console.log(`✅ User authenticated: ${profile.email}`);

    // Create or update user account
    const userId = await upsertUserAccount(profile);

    console.log('💾 Storing OAuth tokens...');

    // Store tokens in database
    await storeOAuthTokens(userId, tokens);

    console.log(`✅ OAuth flow completed for user: ${userId}`);

    // Redirect to success page (or dashboard)
    // Pass user ID in query for frontend to handle
    return NextResponse.redirect(
      new URL(`/?auth=success&user_id=${userId}`, request.url)
    );

  } catch (error: any) {
    console.error('❌ OAuth callback failed:', error);

    return NextResponse.redirect(
      new URL(`/?error=auth_failed&message=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}
