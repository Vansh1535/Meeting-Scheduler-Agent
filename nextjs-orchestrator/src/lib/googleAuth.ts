/**
 * Google OAuth Configuration and Token Management
 * 
 * Handles OAuth 2.0 flow for Google Calendar API access.
 * Manages token storage, refresh, and validation.
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { supabase } from './supabase';

// OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

// Required scopes for calendar access
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly', // Read calendar events (covers all event details)
  'https://www.googleapis.com/auth/userinfo.email', // Get user email
  'https://www.googleapis.com/auth/userinfo.profile', // Get user profile
];

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date: number; // Unix timestamp
  scope: string;
  token_type: string;
}

export interface UserProfile {
  google_user_id: string;
  email: string;
  display_name?: string;
  profile_picture_url?: string;
}

/**
 * Create OAuth2 client instance
 */
export function createOAuth2Client(): OAuth2Client {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local');
  }

  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

/**
 * Generate OAuth authorization URL
 */
export function getAuthorizationUrl(): string {
  const oauth2Client = createOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Request refresh token
    scope: SCOPES,
    prompt: 'consent', // Force consent screen to ensure refresh token
    include_granted_scopes: true,
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const oauth2Client = createOAuth2Client();
  
  const { tokens } = await oauth2Client.getToken(code);
  
  if (!tokens.access_token || !tokens.expiry_date) {
    throw new Error('Invalid tokens received from Google');
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || undefined,
    expiry_date: tokens.expiry_date,
    scope: tokens.scope || SCOPES.join(' '),
    token_type: tokens.token_type || 'Bearer',
  };
}

/**
 * Get user profile from Google
 */
export async function getUserProfile(accessToken: string): Promise<UserProfile> {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();

  if (!data.id || !data.email) {
    throw new Error('Failed to fetch user profile from Google');
  }

  return {
    google_user_id: data.id,
    email: data.email,
    display_name: data.name || undefined,
    profile_picture_url: data.picture || undefined,
  };
}

/**
 * Store or update user account in database
 */
export async function upsertUserAccount(profile: UserProfile): Promise<string> {
  // Check if user exists
  const { data: existingUser } = await supabase
    .from('user_accounts')
    .select('id')
    .eq('google_user_id', profile.google_user_id)
    .single();

  if (existingUser) {
    // Update existing user
    const { error } = await supabase
      .from('user_accounts')
      .update({
        email: profile.email,
        display_name: profile.display_name,
        profile_picture_url: profile.profile_picture_url,
        last_login_at: new Date().toISOString(),
      })
      .eq('id', existingUser.id);

    if (error) throw error;
    return existingUser.id;
  } else {
    // Create new user
    const { data: newUser, error } = await supabase
      .from('user_accounts')
      .insert({
        google_user_id: profile.google_user_id,
        email: profile.email,
        display_name: profile.display_name,
        profile_picture_url: profile.profile_picture_url,
        last_login_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;
    if (!newUser) throw new Error('Failed to create user account');

    return newUser.id;
  }
}

/**
 * Store OAuth tokens in database
 * ⚠️ TODO: Implement token encryption for production
 */
export async function storeOAuthTokens(
  userId: string,
  tokens: GoogleTokens
): Promise<void> {
  const { error } = await supabase
    .from('oauth_tokens')
    .upsert({
      user_id: userId,
      provider: 'google',
      access_token: tokens.access_token, // ⚠️ Encrypt in production
      refresh_token: tokens.refresh_token, // ⚠️ Encrypt in production
      token_type: tokens.token_type,
      expires_at: new Date(tokens.expiry_date).toISOString(),
      scopes: tokens.scope.split(' '),
      last_refreshed_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,provider',
    });

  if (error) throw error;
}

/**
 * Get OAuth tokens from database
 */
export async function getOAuthTokens(userId: string): Promise<GoogleTokens | null> {
  const { data, error } = await supabase
    .from('oauth_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single();

  if (error || !data) return null;

  return {
    access_token: data.access_token, // ⚠️ Decrypt in production
    refresh_token: data.refresh_token || undefined, // ⚠️ Decrypt in production
    expiry_date: new Date(data.expires_at).getTime(),
    scope: data.scopes.join(' '),
    token_type: data.token_type,
  };
}

/**
 * Refresh expired access token
 */
export async function refreshAccessToken(userId: string): Promise<GoogleTokens> {
  const tokens = await getOAuthTokens(userId);
  
  if (!tokens || !tokens.refresh_token) {
    throw new Error('No refresh token available. User needs to re-authenticate.');
  }

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: tokens.refresh_token,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  if (!credentials.access_token || !credentials.expiry_date) {
    throw new Error('Failed to refresh access token');
  }

  const newTokens: GoogleTokens = {
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token || tokens.refresh_token,
    expiry_date: credentials.expiry_date,
    scope: credentials.scope || tokens.scope,
    token_type: credentials.token_type || tokens.token_type,
  };

  // Update tokens in database
  await storeOAuthTokens(userId, newTokens);

  return newTokens;
}

/**
 * Get valid OAuth2 client for user (auto-refreshes if expired)
 */
export async function getAuthenticatedClient(userId: string): Promise<OAuth2Client> {
  let tokens = await getOAuthTokens(userId);

  if (!tokens) {
    throw new Error('User not authenticated with Google. Please complete OAuth flow.');
  }

  // Check if token is expired
  const now = Date.now();
  const buffer = 5 * 60 * 1000; // 5 minute buffer

  if (tokens.expiry_date < now + buffer) {
    console.log('Access token expired, refreshing...');
    tokens = await refreshAccessToken(userId);
  }

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
    token_type: tokens.token_type,
    scope: tokens.scope,
  });

  return oauth2Client;
}

/**
 * Check if user has valid OAuth connection
 */
export async function hasValidOAuthConnection(userId: string): Promise<boolean> {
  const tokens = await getOAuthTokens(userId);
  if (!tokens) return false;

  // Check if token is not expired or can be refreshed
  const now = Date.now();
  if (tokens.expiry_date > now) return true;
  if (tokens.refresh_token) return true;

  return false;
}

/**
 * Revoke OAuth access and delete tokens
 */
export async function revokeOAuthAccess(userId: string): Promise<void> {
  const tokens = await getOAuthTokens(userId);
  
  if (tokens) {
    try {
      // Revoke token with Google
      const oauth2Client = createOAuth2Client();
      await oauth2Client.revokeToken(tokens.access_token);
    } catch (error) {
      console.error('Failed to revoke token with Google:', error);
      // Continue with database deletion even if revocation fails
    }
  }

  // Delete tokens from database
  const { error } = await supabase
    .from('oauth_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('provider', 'google');

  if (error) throw error;
}
