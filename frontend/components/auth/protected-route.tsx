'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/user-context'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * Wrapper component that protects routes from unauthenticated access
 * Redirects to landing page if user is not logged in
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Not authenticated, redirect to landing page
      router.push('/')
    }
  }, [isAuthenticated, loading, router])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Authenticated, render children
  return <>{children}</>
}
