'use client'

import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { useIntersection } from '@/lib/animations'
import { Background3D } from '@/components/3d-background'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/user-context'
import { ArrowRight } from 'lucide-react'

export function HeroSection() {
  const { ref, isVisible } = useIntersection()
  const router = useRouter()
  const { user, isAuthenticated } = useUser()

  const handleGetStarted = () => {
    if (isAuthenticated) {
      // User is already logged in, go to dashboard
      router.push('/dashboard')
    } else {
      // Redirect to Google OAuth
      window.location.href = '/api/auth/google/initiate'
    }
  }

  return (
    <section ref={ref} className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 dark:from-background dark:via-background dark:to-primary/5 flex flex-col items-center justify-center relative overflow-hidden">
      {/* 3D Background Canvas */}
      <Background3D />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-100/30 dark:bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-100/30 dark:bg-accent/5 rounded-full blur-3xl animate-float animation-delay-200" />
      </div>

      {/* Header with Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Content */}
      <div className={`relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-700 ${
        isVisible ? 'animate-fadeInUp' : 'opacity-0 translate-y-8'
      }`}>
        <div className="max-w-5xl mx-auto">
          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-outfit font-bold tracking-tighter text-balance mb-8 leading-tight">
            <span className="text-gradient-primary">
              Schedule Your Life,
            </span>
            <br />
            <span className="text-foreground font-black">Beautifully</span>
          </h1>

          {/* Subheading */}
          <div className="max-w-4xl mx-auto mb-12">
            <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground text-balance font-sora leading-relaxed font-normal">
              Experience premium event scheduling with stunning gradient cards, smart quick-add, and beautiful analytics. All in one elegant, minimal interface.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 lg:mb-20">
            <Button onClick={handleGetStarted} size="lg" className="w-full sm:w-auto px-10 h-14 text-base font-outfit font-semibold rounded-2xl shadow-elevation-3 hover:shadow-elevation-4 transition-all duration-300 hover:scale-105">
              {isAuthenticated ? (
                <>
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              ) : (
                'Get Started with Google'
              )}
            </Button>
          </div>

          {/* Stats */}
          <div className="flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8 max-w-2xl w-full">
          {[
            { label: '10K+', desc: 'Active Users' },
            { label: '2M+', desc: 'Events' },
            { label: '98%', desc: 'Uptime' },
          ].map((stat, idx) => (
            <div key={idx} className={`p-4 sm:p-6 rounded-2xl bg-card/60 backdrop-blur-medium border border-border/40 transition-all duration-700 hover:bg-card/90 hover:shadow-elevation-2 hover:border-primary/30 group cursor-default ${
              isVisible ? 'animate-fadeInUp' : 'opacity-0 translate-y-8'
            }`} style={{ animationDelay: `${100 + idx * 100}ms` }}>
              <div className="text-2xl sm:text-3xl md:text-4xl font-outfit font-black text-primary group-hover:scale-110 transition-transform duration-300">{stat.label}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-2 sm:mt-3 font-semibold uppercase tracking-widest">{stat.desc}</div>
              <div className="h-0.5 w-0 bg-gradient-to-r from-primary to-accent rounded-full mt-3 group-hover:w-full transition-all duration-500" />
            </div>
          ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-primary rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  )
}
