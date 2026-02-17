'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { saveAuthSession } from '@/lib/auth-session'
import { toast } from 'sonner'

export default function Page() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Handle OAuth callback
    const authStatus = searchParams.get('auth')
    const userId = searchParams.get('user_id')
    const error = searchParams.get('error')

    if (authStatus === 'success' && userId) {
      // OAuth successful - fetch user data and store session
      const fetchUserAndRedirect = async () => {
        try {
          const response = await fetch(`/api/auth/user`, {
            headers: {
              'X-User-Id': userId,
            },
          })

          if (response.ok) {
            const userData = await response.json()
            
            // Save auth session
            saveAuthSession({
              userId: userData.id,
              email: userData.email,
              displayName: userData.display_name || userData.email,
              profilePictureUrl: userData.profile_picture_url,
              isActive: userData.is_active,
            })

            toast.success('Welcome! You\'re now logged in.')
            
            // Redirect to dashboard
            router.push('/dashboard')
          } else {
            toast.error('Failed to load user data')
            router.push('/landing')
          }
        } catch (err) {
          console.error('Failed to fetch user:', err)
          toast.error('Authentication failed')
          router.push('/landing')
        }
      }

      fetchUserAndRedirect()
    } else if (error) {
      toast.error(`Authentication failed: ${searchParams.get('message') || error}`)
      router.push('/landing')
    } else {
      // No auth params, just redirect to landing
      router.push('/landing')
    }
  }, [searchParams, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
