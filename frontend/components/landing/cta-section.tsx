'use client'

import { useIntersection } from '@/lib/animations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { useAuthModal } from '@/contexts/auth-modal-context'
import { useUser } from '@/contexts/user-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function CTASection() {
  const { ref, isVisible } = useIntersection()
  const { openAuthModal } = useAuthModal()
  const { isAuthenticated, user } = useUser()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isAuthenticated) {
      router.push('/dashboard')
    } else {
      // Redirect to Google OAuth
      window.location.href = '/api/auth/google/initiate'
    }
  }

  const handleSignIn = () => {
    if (isAuthenticated) {
      router.push('/dashboard')
    } else {
      window.location.href = '/api/auth/google/initiate'
    }
  }

  // If user is authenticated, show a different message
  if (isAuthenticated) {
    return (
      <section ref={ref} className="relative overflow-hidden py-20 sm:py-28 lg:py-32 bg-gradient-to-br from-primary/10 via-background to-accent/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className={`transition-all duration-700 ${
              isVisible ? 'animate-fadeInUp' : 'opacity-0 translate-y-8'
            }`}>
              {/* Heading */}
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 text-balance leading-tight">
                Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!
              </h2>

              {/* Subheading */}
              <p className="text-lg sm:text-xl text-muted-foreground mb-10 text-balance max-w-2xl mx-auto leading-relaxed">
                Ready to manage your schedule? Head over to your dashboard.
              </p>

              {/* CTA Button */}
              <Button onClick={() => router.push('/dashboard')} size="lg" className="px-10 h-14 text-base font-semibold rounded-2xl shadow-elevation-3 hover:shadow-elevation-4 transition-all duration-300 hover:scale-105">
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Background Accent */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-accent/10 rounded-full blur-3xl opacity-50" />
        </div>
      </section>
    )
  }

  return (
    <section ref={ref} className="relative overflow-hidden py-20 sm:py-28 lg:py-32 bg-gradient-to-br from-primary/10 via-background to-accent/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className={`transition-all duration-700 ${
            isVisible ? 'animate-fadeInUp' : 'opacity-0 translate-y-8'
          }`}>
            {/* Heading */}
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 text-balance leading-tight">
              Ready to Schedule Beautifully?
            </h2>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 text-balance max-w-2xl mx-auto leading-relaxed">
              Start your free trial today. No credit card required. Join thousands of satisfied users.
            </p>

            {/* Google OAuth Button */}
            <div className="flex justify-center mb-8">
              <Button onClick={handleSignIn} size="lg" className="px-10 h-14 text-base font-semibold rounded-2xl shadow-elevation-3 hover:shadow-elevation-4 transition-all duration-300 hover:scale-105">
                Get Started with Google
              </Button>
            </div>

            {/* Terms */}
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Background Accent */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-accent/10 rounded-full blur-3xl opacity-50" />
      </div>
    </section>
  )
}
