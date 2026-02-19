'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, User, Briefcase, PartyPopper, Heart, ChevronDown, ChevronUp, Calendar, Brain } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useCalendarEvents } from '@/hooks/use-calendar'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type EventCategory = 'meeting' | 'personal' | 'work' | 'social' | 'health'

function detectCategory(title: string, description?: string): EventCategory {
  const text = `${title} ${description || ''}`.toLowerCase()
  
  if (text.includes('personal') || text.includes('family') || text.includes('birthday') || 
      text.includes('anniversary') || text.includes('vacation') || text.includes('holiday')) {
    return 'personal'
  }
  
  if (text.includes('work') || text.includes('standup') || text.includes('sprint') || 
      text.includes('review') || text.includes('1:1') || text.includes('one-on-one') ||
      text.includes('project') || text.includes('deadline') || text.includes('presentation')) {
    return 'work'
  }
  
  if (text.includes('social') || text.includes('party') || text.includes('dinner') || 
      text.includes('lunch') || text.includes('coffee') || text.includes('hangout') ||
      text.includes('celebration') || text.includes('gathering')) {
    return 'social'
  }
  
  if (text.includes('health') || text.includes('doctor') || text.includes('gym') || 
      text.includes('workout') || text.includes('exercise') || text.includes('therapy') ||
      text.includes('medical') || text.includes('appointment')) {
    return 'health'
  }
  
  return 'meeting'
}

const categoryConfig = {
  meeting: {
    icon: Users,
    label: 'Meeting',
    gradient: 'from-blue-500/20 to-purple-500/20',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-500/30',
  },
  personal: {
    icon: User,
    label: 'Personal',
    gradient: 'from-green-500/20 to-emerald-500/20',
    textColor: 'text-green-600 dark:text-green-400',
    borderColor: 'border-green-500/30',
  },
  work: {
    icon: Briefcase,
    label: 'Work',
    gradient: 'from-slate-500/20 to-gray-600/20',
    textColor: 'text-slate-600 dark:text-slate-400',
    borderColor: 'border-slate-500/30',
  },
  social: {
    icon: PartyPopper,
    label: 'Social',
    gradient: 'from-orange-500/20 to-amber-500/20',
    textColor: 'text-orange-600 dark:text-orange-400',
    borderColor: 'border-orange-500/30',
  },
  health: {
    icon: Heart,
    label: 'Health',
    gradient: 'from-red-500/20 to-pink-500/20',
    textColor: 'text-red-600 dark:text-red-400',
    borderColor: 'border-red-500/30',
  },
}

interface CategoriesSidebarProps {
  onEventClick?: (event: any, category: EventCategory) => void
  viewedDate?: Date
}

export function CategoriesSidebar({ onEventClick, viewedDate }: CategoriesSidebarProps = {}) {
  const { data: events = [] } = useCalendarEvents()
  const router = useRouter()
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    meeting: false,
    personal: false,
    work: false,
    social: false,
    health: false,
    google: false,
    ai: false,
  })

  const toggleCategory = (category: EventCategory) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))
  }

  const handleEventClick = (event: any, category: EventCategory) => {
    console.log('🎯 Event clicked:', { event, category })
    
    // If a callback is provided (when rendered on calendar page), use it directly
    if (onEventClick) {
      console.log('📞 Using callback to highlight event')
      onEventClick(event, category)
      return
    }
    
    // Otherwise, store to localStorage and navigate (when coming from another page)
    console.log('💾 Storing to localStorage and navigating')
    const eventData = {
      event,
      category,
      timestamp: Date.now()
    }
    localStorage.setItem('highlightEvent', JSON.stringify(eventData))
    
    // Navigate to calendar page
    router.push('/calendar')
  }

  const categorizedEvents = useMemo(() => {
    // Filter to viewed month (or current month if not specified)
    const dateToUse = viewedDate || new Date()
    const viewedMonth = dateToUse.getMonth()
    const viewedYear = dateToUse.getFullYear()
    
    const currentMonthEvents = events.filter((event: any) => {
      const eventDate = new Date(event.startTime || event.start_time)
      return eventDate.getMonth() === viewedMonth && eventDate.getFullYear() === viewedYear
    })

    const categories: Record<EventCategory, any[]> = {
      meeting: [],
      personal: [],
      work: [],
      social: [],
      health: [],
    }

    currentMonthEvents.forEach((event: any) => {
      const category = detectCategory(event.title || event.summary || '', event.description)
      categories[category].push(event)
    })

    return categories
  }, [events, viewedDate])

  const eventsBySource = useMemo(() => {
    // Filter to viewed month (or current month if not specified)
    const dateToUse = viewedDate || new Date()
    const viewedMonth = dateToUse.getMonth()
    const viewedYear = dateToUse.getFullYear()
    
    const currentMonthEvents = events.filter((event: any) => {
      const eventDate = new Date(event.startTime || event.start_time)
      return eventDate.getMonth() === viewedMonth && eventDate.getFullYear() === viewedYear
    })

    const sources = {
      google: [] as any[],
      ai: [] as any[],
    }

    currentMonthEvents.forEach((event: any) => {
      if (event.source === 'google') {
        sources.google.push(event)
      } else {
        sources.ai.push(event)
      }
    })

    return sources
  }, [events, viewedDate])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    })
  }

  return (
    <div className="space-y-6">
      {/* Events by Category */}
      <Card className="border border-border rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Events by Category</CardTitle>
          <p className="text-sm text-muted-foreground">Quick access to your labeled events</p>
        </CardHeader>
      <CardContent className="space-y-4">
        {(Object.entries(categoryConfig) as [EventCategory, typeof categoryConfig.meeting][]).map(([category, config]) => {
          const categoryEvents = categorizedEvents[category]
          const Icon = config.icon
          const isExpanded = expandedCategories[category]

          return (
            <div key={category} className="space-y-2">
              <div 
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity flex-nowrap"
                onClick={() => toggleCategory(category)}
              >
                <div className={`p-1.5 rounded-lg bg-gradient-to-br ${config.gradient} flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${config.textColor}`} />
                </div>
                <span className="font-medium text-sm flex-1 min-w-0">{config.label}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="secondary" className="text-xs min-w-[28px] text-center">
                    {categoryEvents.length}
                  </Badge>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {categoryEvents.length > 0 && isExpanded && (
                <div className="ml-8 space-y-1.5">
                  {categoryEvents.map((event: any, idx: number) => {
                    const isGoogleEvent = event.source === 'google'
                    
                    return (
                      <div
                        key={idx}
                        onClick={() => handleEventClick(event, category)}
                        className={`p-2 rounded-lg border ${config.borderColor} bg-card/50 hover:bg-card transition-colors cursor-pointer`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium line-clamp-1 flex-1">
                            {event.title || event.summary || 'Untitled Event'}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] px-1.5 py-0 h-4 ${
                              isGoogleEvent 
                                ? 'border-orange-500/30 text-orange-600' 
                                : 'border-red-500/30 text-red-600'
                            }`}
                          >
                            {isGoogleEvent ? 'GOOGLE' : 'AI'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTime(event.startTime || event.start_time)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}

              {categoryEvents.length === 0 && (
                <p className="ml-8 text-xs text-muted-foreground italic">No events</p>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>

    {/* Events by Source */}
    <Card className="border border-border rounded-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold">Events by Source</CardTitle>
        <p className="text-sm text-muted-foreground">View events by creation platform</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google Calendar Events */}
        <div className="space-y-2">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity flex-nowrap"
            onClick={() => setExpandedCategories(prev => ({ ...prev, google: !prev.google }))}
          >
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex-shrink-0">
              <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="font-medium text-sm flex-1 min-w-0">Google Calendar</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="secondary" className="text-xs min-w-[28px] text-center">
                {eventsBySource.google.length}
              </Badge>
              {expandedCategories.google ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>

          {eventsBySource.google.length > 0 && expandedCategories.google && (
            <div className="ml-8 space-y-1.5">
              {eventsBySource.google.map((event: any, idx: number) => {
                const category = detectCategory(event.title || event.summary || '', event.description)
                
                return (
                  <div
                    key={idx}
                    onClick={() => handleEventClick(event, category)}
                    className="p-2 rounded-lg border border-orange-500/30 bg-card/50 hover:bg-card transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium line-clamp-1 flex-1">
                        {event.title || event.summary || 'Untitled Event'}
                      </p>
                      <Badge 
                        variant="outline" 
                        className="text-[10px] px-1.5 py-0 h-4 border-orange-500/30 text-orange-600"
                      >
                        GOOGLE
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(event.startTime || event.start_time)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {eventsBySource.google.length === 0 && (
            <p className="ml-8 text-xs text-muted-foreground italic">No events</p>
          )}
        </div>

        {/* AI Platform Events */}
        <div className="space-y-2">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity flex-nowrap"
            onClick={() => setExpandedCategories(prev => ({ ...prev, ai: !prev.ai }))}
          >
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-slate-800/20 to-red-600/20 flex-shrink-0">
              <Brain className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <span className="font-medium text-sm flex-1 min-w-0">AI Platform</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="secondary" className="text-xs min-w-[28px] text-center">
                {eventsBySource.ai.length}
              </Badge>
              {expandedCategories.ai ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>

          {eventsBySource.ai.length > 0 && expandedCategories.ai && (
            <div className="ml-8 space-y-1.5">
              {eventsBySource.ai.map((event: any, idx: number) => {
                const category = detectCategory(event.title || event.summary || '', event.description)
                
                return (
                  <div
                    key={idx}
                    onClick={() => handleEventClick(event, category)}
                    className="p-2 rounded-lg border border-red-500/30 bg-card/50 hover:bg-card transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium line-clamp-1 flex-1">
                        {event.title || event.summary || 'Untitled Event'}
                      </p>
                      <Badge 
                        variant="outline" 
                        className="text-[10px] px-1.5 py-0 h-4 border-red-500/30 text-red-600"
                      >
                        AI
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(event.startTime || event.start_time)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {eventsBySource.ai.length === 0 && (
            <p className="ml-8 text-xs text-muted-foreground italic">No events</p>
          )}
        </div>
      </CardContent>
    </Card>
  </div>
  )
}
