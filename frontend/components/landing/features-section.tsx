'use client'

import { Clock, BarChart3, Zap, Share2 } from 'lucide-react'
import { useIntersection } from '@/lib/animations'
import { FeatureCard } from './feature-card'

const features = [
  {
    icon: Clock,
    title: 'Smart Quick Schedule',
    description: 'Create events in just 30 seconds with our intelligent form. Perfect for busy professionals.',
    gradient: 'navy-red' as const,
  },
  {
    icon: BarChart3,
    title: 'Beautiful Analytics',
    description: 'Gain insights into how you spend your time with stunning visualizations and trends.',
    gradient: 'orange-red' as const,
  },
  {
    icon: Zap,
    title: 'Seamless Integration',
    description: 'Connect your existing calendars and sync effortlessly across all your devices.',
    gradient: 'navy-red' as const,
  },
  {
    icon: Share2,
    title: 'Dark & Light Modes',
    description: 'Perfect your experience with automatic theme switching based on your preference.',
    gradient: 'orange-red' as const,
  },
]

export function FeaturesSection() {
  const { ref, isVisible } = useIntersection()

  return (
    <section ref={ref} className="py-20 sm:py-28 lg:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className={`text-center mb-16 lg:mb-20 transition-all duration-700 ${
            isVisible ? 'animate-fadeInUp' : 'opacity-0 translate-y-8'
          }`}>
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 text-balance leading-tight">
                Powerful Features for Modern Scheduling
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground text-balance max-w-3xl mx-auto leading-relaxed">
                Everything you need to manage your time beautifully
              </p>
              <div className="w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mt-8 opacity-50" />
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 max-w-6xl w-full">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className={`transition-all duration-700 ${
                  isVisible ? 'animate-fadeInUp' : 'opacity-0 translate-y-8'
                }`}
                style={{ animationDelay: `${100 + idx * 100}ms` }}
              >
                <FeatureCard {...feature} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
