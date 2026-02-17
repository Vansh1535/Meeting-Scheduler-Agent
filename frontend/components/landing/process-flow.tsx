'use client'

import { useIntersection } from '@/lib/animations'
import { Plus, Layers, TrendingUp, Zap } from 'lucide-react'

const steps = [
  {
    icon: Plus,
    title: 'Create',
    description: 'Add events in 30 seconds with our smart form',
  },
  {
    icon: Layers,
    title: 'Organize',
    description: 'Categorize and manage your schedule beautifully',
  },
  {
    icon: TrendingUp,
    title: 'Analyze',
    description: 'Get insights into your time and productivity',
  },
  {
    icon: Zap,
    title: 'Sync',
    description: 'Keep everything in sync across devices',
  },
]

export function ProcessFlow() {
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
                How It Works
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground text-balance max-w-3xl mx-auto leading-relaxed">
                A seamless four-step process to master your schedule
              </p>
              <div className="w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mt-8 opacity-50" />
            </div>
          </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, idx) => {
              const Icon = step.icon
              return (
                <div
                  key={idx}
                  className={`relative transition-all duration-700 ${
                    isVisible ? 'animate-fadeInUp' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ animationDelay: `${100 + idx * 100}ms` }}
                >
                  {/* Number Circle */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center group hover:scale-125 transition-all duration-300 shadow-elevation-2 hover:shadow-elevation-3">
                      <Icon className="w-10 h-10 text-white group-hover:scale-125 transition-transform duration-300" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="text-center">
                    <h3 className="text-2xl font-semibold text-foreground mb-3 font-outfit">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-base">{step.description}</p>
                  </div>

                  {/* Arrow Indicator (hidden on mobile) */}
                  {idx < steps.length - 1 && (
                    <div className="hidden lg:block absolute -right-4 top-24 text-primary/30 text-2xl">
                      →
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
    </section>
  )
}
