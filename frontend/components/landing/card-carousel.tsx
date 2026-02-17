'use client'

import { useState, useEffect } from 'react'
import { EventCard } from '@/components/event-card'
import { useIntersection } from '@/lib/animations'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const carouselCards = [
  {
    number: '01',
    title: 'Product Launch',
    subtitle: 'Business Event',
    gradient: 'navy-red' as const,
    hexColor: '5a5a5a',
  },
  {
    number: '02',
    title: 'Team Meeting',
    subtitle: 'Internal Sync',
    gradient: 'orange-red' as const,
    hexColor: 'f59e0b',
  },
  {
    number: '03',
    title: 'Client Presentation',
    subtitle: 'Premium Event',
    gradient: 'navy-red' as const,
    hexColor: '7a7a7a',
  },
  {
    number: '04',
    title: 'Networking Session',
    subtitle: 'Community',
    gradient: 'orange-red' as const,
    hexColor: 'ef4444',
  },
]

export function CardCarousel() {
  const [current, setCurrent] = useState(0)
  const { ref, isVisible } = useIntersection()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % carouselCards.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const next = () => setCurrent((prev) => (prev + 1) % carouselCards.length)
  const prev = () => setCurrent((prev) => (prev - 1 + carouselCards.length) % carouselCards.length)

  return (
    <section ref={ref} className="py-20 sm:py-28 lg:py-32 bg-gradient-to-b from-slate-50/50 to-white dark:from-card/50 dark:to-background/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className={`text-center mb-16 lg:mb-20 transition-all duration-700 ${
            isVisible ? 'animate-fadeInUp' : 'opacity-0 translate-y-8'
          }`}>
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 text-balance leading-tight">
                Beautiful Event Cards
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground text-balance max-w-3xl mx-auto leading-relaxed">
                See your events come to life with stunning gradient designs
              </p>
              <div className="w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mt-8 opacity-50" />
            </div>
          </div>

        {/* Carousel */}
        <div className={`relative transition-all duration-700 ${
          isVisible ? 'animate-fadeIn' : 'opacity-0'
        }`}>
          {/* Cards Grid - Show multiple cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {carouselCards.map((card, idx) => (
              <div
                key={idx}
                className={`transition-all duration-500 ${
                  idx === current ? 'md:col-span-2 lg:col-span-2 md:row-span-2' : ''
                } ${idx <= 1 ? 'block' : 'hidden md:block'}`}
              >
                <EventCard
                  {...card}
                  className={`h-full ${idx === current ? 'ring-2 ring-primary' : ''}`}
                />
              </div>
            ))}
          </div>

          {/* Carousel Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="icon" onClick={prev} className="rounded-full">
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {/* Indicators */}
            <div className="flex gap-2">
              {carouselCards.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrent(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === current
                      ? 'w-8 bg-primary'
                      : 'bg-primary/30 hover:bg-primary/50'
                  }`}
                  suppressHydrationWarning
                />
              ))}
            </div>

            <Button variant="outline" size="icon" onClick={next} className="rounded-full">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
    </section>
  )
}
