'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { getAuthSession, clearAuthSession, saveAuthSession, type AuthSession } from '@/lib/auth-session'
import { useRouter, usePathname } from 'next/navigation'

export interface User {
  id: string
  email: string
  displayName?: string
  profilePictureUrl?: string
  isActive: boolean
  calendarSyncEnabled: boolean
}

interface UserContextType {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  logout: () => void
  isAuthenticated: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/landing']

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Initialize auth session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have a valid session
        const session = getAuthSession()
        
        if (session) {
          // Load full user data from API
          const response = await fetch('/api/auth/user', {
            headers: {
              'X-User-Id': session.userId,
              'X-User-Email': session.email,
            },
          })

          if (response.ok) {
            const userData = await response.json()
            setUser(userData)
          } else {
            // Session invalid, clear it
            clearAuthSession()
            // Redirect to login if on protected route
            if (!PUBLIC_ROUTES.includes(pathname)) {
              router.push('/')
            }
          }
        } else {
          // No session - redirect to login if on protected route
          if (!PUBLIC_ROUTES.includes(pathname)) {
            router.push('/')
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        clearAuthSession()
        if (!PUBLIC_ROUTES.includes(pathname)) {
          router.push('/')
        }
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [pathname, router])

  const logout = () => {
    setUser(null)
    clearAuthSession()
    router.push('/')
  }

  const isAuthenticated = user !== null

  return (
    <UserContext.Provider value={{ user, loading, setUser, logout, isAuthenticated }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within UserProvider')
  }
  return context
}
