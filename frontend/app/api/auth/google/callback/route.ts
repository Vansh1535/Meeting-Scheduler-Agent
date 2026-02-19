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
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Extract authorization code and state from query params
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

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

    // SECURITY: Extract userId from state parameter
    let expectedUserId: string | undefined;
    if (state) {
      try {
        const stateData = JSON.parse(state);
        expectedUserId = stateData.userId;
      } catch (e) {
        console.warn('Failed to parse state parameter:', e);
      }
    }

    console.log('📝 Exchanging authorization code for tokens...');

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    console.log('👤 Fetching user profile from Google...');

    // Get user profile
    const profile = await getUserProfile(tokens.access_token);

    console.log(`✅ User authenticated: ${profile.email}`);

    // SECURITY FIX: If we have expectedUserId, validate email matches
    if (expectedUserId) {
      const { data: expectedUser, error: userError } = await supabaseAdmin
        .from('user_accounts')
        .select('email')
        .eq('id', expectedUserId)
        .single();

      if (!userError && expectedUser && expectedUser.email !== profile.email) {
        console.error(`❌ Email mismatch: Expected ${expectedUser.email}, got ${profile.email}`);
        return NextResponse.redirect(
          new URL(
            `/?error=email_mismatch&message=${encodeURIComponent(
              `Please connect the Google account associated with ${expectedUser.email}, not ${profile.email}`
            )}`,
            request.url
          )
        );
      }
    }

    // Use expectedUserId if available, otherwise create/find user
    const userId = expectedUserId || (await upsertUserAccount(profile));

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = body?.code;

    if (!code) {
      return NextResponse.json(
        { error: 'missing_code', message: 'Authorization code not provided' },
        { status: 400 }
      );
    }

    const tokens = await exchangeCodeForTokens(code);
    const profile = await getUserProfile(tokens.access_token);
    const userId = await upsertUserAccount(profile);
    await storeOAuthTokens(userId, tokens);

    return NextResponse.json({
      success: true,
      user_id: userId,
      email: profile.email,
    });
  } catch (error: any) {
    console.error('❌ OAuth callback POST failed:', error);

    return NextResponse.json(
      { error: 'auth_failed', message: error.message },
      { status: 500 }
    );
  }
}
