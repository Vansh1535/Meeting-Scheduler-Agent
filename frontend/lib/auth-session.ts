/**
 * Client-side authentication session management
 * Handles user session storage and validation
 */

export interface AuthSession {
  userId: string
  email: string
  displayName: string
  profilePictureUrl?: string
  isActive: boolean
  authenticatedAt: number
}

const SESSION_KEY = 'auth_session'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

/**
 * Save authentication session to localStorage
 */
export function saveAuthSession(session: Omit<AuthSession, 'authenticatedAt'>): void {
  const authSession: AuthSession = {
    ...session,
    authenticatedAt: Date.now(),
  }
  
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(authSession))
  } catch (error) {
    console.error('Failed to save auth session:', error)
  }
}

/**
 * Get current authentication session
 * Returns null if session is expired or invalid
 */
export function getAuthSession(): AuthSession | null {
  try {
    const sessionData = localStorage.getItem(SESSION_KEY)
    if (!sessionData) {
      return null
    }

    const session: AuthSession = JSON.parse(sessionData)
    
    // Check if session is expired
    const now = Date.now()
    const sessionAge = now - session.authenticatedAt
    
    if (sessionAge > SESSION_DURATION) {
      clearAuthSession()
      return null
    }

    return session
  } catch (error) {
    console.error('Failed to get auth session:', error)
    return null
  }
}

/**
 * Clear authentication session (logout)
 */
export function clearAuthSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch (error) {
    console.error('Failed to clear auth session:', error)
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthSession() !== null
}

/**
 * Get current user ID
 */
export function getCurrentUserId(): string | null {
  const session = getAuthSession()
  return session?.userId || null
}

/**
 * Refresh session timestamp (extend expiration)
 */
export function refreshSession(): void {
  const session = getAuthSession()
  if (session) {
    saveAuthSession(session)
  }
}
