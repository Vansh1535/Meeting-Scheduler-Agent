'use client'

import { useIntersection } from '@/lib/animations'
import { StatCounter } from './stat-counter'

export function StatsSection() {
  const { ref, isVisible } = useIntersection()

  return (
    <section ref={ref} className="py-20 sm:py-28 lg:py-32 bg-gradient-to-b from-white to-orange-50/30 dark:from-card/50 dark:to-background/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
          <div className={`text-center mb-16 lg:mb-20 transition-all duration-700 ${
            isVisible ? 'animate-fadeInUp' : 'opacity-0 translate-y-8'
          }`}>
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 text-balance leading-tight">
                Trusted by Thousands
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground text-balance max-w-3xl mx-auto leading-relaxed">
                Join our growing community of productivity enthusiasts
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="flex justify-center">
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-4xl w-full transition-all duration-700 ${
              isVisible ? 'animate-fadeIn' : 'opacity-0'
            }`}>
              <div className={`transition-all duration-700 ${
                isVisible ? 'animate-fadeInUp' : 'opacity-0 translate-y-8'
              }`}>
                <StatCounter
                  target={10}
                  suffix="K+"
                  label="Active Users"
                  isVisible={isVisible}
                />
              </div>
              <div className={`transition-all duration-700 ${
                isVisible ? 'animate-fadeInUp' : 'opacity-0 translate-y-8'
              }`} style={{ animationDelay: '100ms' }}>
                <StatCounter
                  target={2}
                  suffix="M+"
                  label="Events Scheduled"
                  isVisible={isVisible}
                />
              </div>
              <div className={`transition-all duration-700 ${
                isVisible ? 'animate-fadeInUp' : 'opacity-0 translate-y-8'
              }`} style={{ animationDelay: '200ms' }}>
                <StatCounter
                  target={98}
                  suffix="%"
                  label="Uptime Guarantee"
                  isVisible={isVisible}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
