'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  user: any | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, fullName: string) => Promise<void>
  logout: () => void
  googleAuth: (token: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (token) {
          // Verify token with backend
          const response = await fetch('/api/auth/user', {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (response.ok) {
            const userData = await response.json()
            setUser(userData)
            setIsAuthenticated(true)
          } else {
            localStorage.removeItem('authToken')
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const { token, user: userData } = await response.json()
        localStorage.setItem('authToken', token)
        setUser(userData)
        setIsAuthenticated(true)
      } else {
        throw new Error('Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const signup = async (email: string, password: string, fullName: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      })

      if (response.ok) {
        const { token, user: userData } = await response.json()
        localStorage.setItem('authToken', token)
        setUser(userData)
        setIsAuthenticated(true)
      } else {
        throw new Error('Signup failed')
      }
    } catch (error) {
      console.error('Signup error:', error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    setUser(null)
    setIsAuthenticated(false)
  }

  const googleAuth = async (token: string) => {
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (response.ok) {
        const { token: authToken, user: userData } = await response.json()
        localStorage.setItem('authToken', authToken)
        setUser(userData)
        setIsAuthenticated(true)
      } else {
        throw new Error('Google auth failed')
      }
    } catch (error) {
      console.error('Google auth error:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        signup,
        logout,
        googleAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
