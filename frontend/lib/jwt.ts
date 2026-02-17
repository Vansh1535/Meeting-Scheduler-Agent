/**
 * JWT Utilities for Authentication
 * 
 * Helper functions for token management
 */

import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface DecodedToken {
  id: string
  email: string
  iat: number
  exp: number
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken
    return decoded
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = verifyToken(token)
  if (!decoded) return true

  const now = Date.now() / 1000
  return decoded.exp < now
}

/**
 * Create a new JWT token
 */
export function createToken(id: string, email: string): string {
  return jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '7d' })
}
