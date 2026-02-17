'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { CardCarousel } from '@/components/landing/card-carousel'
import { ProcessFlow } from '@/components/landing/process-flow'
import { StatsSection } from '@/components/landing/stats-section'
import { CTASection } from '@/components/landing/cta-section'
import { saveAuthSession } from '@/lib/auth-session'
import { toast } from 'sonner'

export default function LandingPage() {
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
          }
        } catch (err) {
          console.error('Failed to fetch user:', err)
          toast.error('Authentication failed')
        }
      }

      fetchUserAndRedirect()
    } else if (error) {
      toast.error(`Authentication failed: ${searchParams.get('message') || error}`)
    }
  }, [searchParams, router])

  return (
    <main className="overflow-hidden">
      <HeroSection />
      <FeaturesSection />
      <CardCarousel />
      <ProcessFlow />
      <StatsSection />
      <CTASection />
    </main>
  )
}
