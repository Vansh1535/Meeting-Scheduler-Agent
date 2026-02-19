'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lightbulb, Clock, Users, TrendingUp, AlertCircle, CheckCircle2, Sparkles, Loader2 } from 'lucide-react'
import { useEffect, useState, useMemo } from 'react'
import { useCalendarEvents } from '@/hooks/use-calendar'
import { useProductivityInsights } from '@/hooks/use-api'

interface FormData {
  title: string
  category: string
  date: string
  time: string
  duration: string
  participants: string
  showAnalysis: boolean
}

interface SuggestionsProps {
  formData: FormData
}

export function SuggestionsPanel({ formData }: SuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Array<{
    type: 'tip' | 'warning' | 'insight' | 'success'
    icon: any
    title: string
    message: string
  }>>([])

  // Fetch real user data
  const { data: events = [], isLoading: eventsLoading } = useCalendarEvents()
  const { data: insights, isLoading: insightsLoading } = useProductivityInsights()

  // Calculate real user patterns from events
  const userPatterns = useMemo(() => {
    if (!Array.isArray(events) || events.length === 0) {
      return {
        avgMeetingDuration: 30,
        peakDays: [2, 3, 4], // Tuesday, Wednesday, Thursday
        peakHours: [10, 14, 15],
        totalEvents: 0,
        meetingsThisWeek: 0,
      }
    }

    // Filter to current month only
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    const currentMonthEvents = events.filter((event: any) => {
      const eventDate = new Date(event.startTime || event.start_time)
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
    })

    const durations: number[] = []
    const dayCount: Record<number, number> = {}
    const hourCount: Record<number, number> = {}
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    let meetingsThisWeek = 0

    currentMonthEvents.forEach((event: any) => {
      const start = new Date(event.startTime || event.start_time)
      const end = new Date(event.endTime || event.end_time)
      
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        // Duration
        const duration = (end.getTime() - start.getTime()) / (1000 * 60)
        durations.push(duration)

        // Day of week (0 = Sunday, 6 = Saturday)
        const day = start.getDay()
        dayCount[day] = (dayCount[day] || 0) + 1

        // Hour of day
        const hour = start.getHours()
        hourCount[hour] = (hourCount[hour] || 0) + 1

        // This week count
        if (start.getTime() >= weekAgo.getTime()) {
          meetingsThisWeek++
        }
      }
    })

    const avgDuration = durations.length > 0 
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) 
      : 30

    const peakDays = Object.entries(dayCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([day]) => parseInt(day))

    const peakHours = Object.entries(hourCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour))

    return {
      avgMeetingDuration: avgDuration,
      peakDays,
      peakHours,
      totalEvents: currentMonthEvents.length,
      meetingsThisWeek,
    }
  }, [events])

  useEffect(() => {
    const newSuggestions: typeof suggestions = []

    // General welcome tip
    if (!formData.title) {
      const hasData = userPatterns.totalEvents > 0
      newSuggestions.push({
        type: 'insight',
        icon: Sparkles,
        title: 'Getting Started',
        message: hasData 
          ? `Start by entering your event title. Based on your ${userPatterns.totalEvents} events this month, I'll provide personalized suggestions.`
          : 'Start by entering your event title. Our AI will provide smart suggestions as you fill the form.'
      })
    }

    // Category-specific tips
    if (formData.category === 'meeting' && formData.title) {
      newSuggestions.push({
        type: 'tip',
        icon: Clock,
        title: 'Best Time for Meetings',
        message: 'Tuesday-Thursday, 10 AM - 3 PM typically have higher acceptance rates and fewer conflicts.'
      })
    }

    if (formData.category === 'personal') {
      newSuggestions.push({
        type: 'tip',
        icon: TrendingUp,
        title: 'Personal Time Optimization',
        message: 'Consider scheduling personal activities during your low-energy hours to maximize productivity.'
      })
    }

    // Duration-based suggestions (DYNAMIC)
    const duration = parseInt(formData.duration)
    if (duration > 60) {
      const avgDuration = userPatterns.avgMeetingDuration
      newSuggestions.push({
        type: 'warning',
        icon: AlertCircle,
        title: 'Long Meeting Alert',
        message: userPatterns.totalEvents > 0
          ? `This is longer than your average meeting (${avgDuration} min). Consider breaking into smaller sessions.`
          : 'Meetings over 1 hour have 40% lower engagement. Consider breaking into smaller sessions.'
      })
    }

    if (duration === userPatterns.avgMeetingDuration || Math.abs(duration - userPatterns.avgMeetingDuration) <= 5) {
      newSuggestions.push({
        type: 'success',
        icon: CheckCircle2,
        title: 'Matches Your Pattern',
        message: `${duration}-minute duration matches your typical meeting length. Great consistency!`
      })
    } else if (duration === 30 && userPatterns.totalEvents === 0) {
      newSuggestions.push({
        type: 'success',
        icon: CheckCircle2,
        title: 'Optimal Duration',
        message: '30-minute meetings have the highest productivity scores and completion rates.'
      })
    }

    // Participants suggestions
    if (formData.participants && formData.participants.includes(',')) {
      const participantCount = formData.participants.split(',').filter(e => e.trim()).length
      if (participantCount > 5) {
        newSuggestions.push({
          type: 'warning',
          icon: Users,
          title: 'Large Group Meeting',
          message: `${participantCount} participants detected. Consider if everyone is essential, or if some can be optional.`
        })
      } else {
        newSuggestions.push({
          type: 'insight',
          icon: Users,
          title: 'Multi-Participant Scheduling',
          message: `Analyzing availability for ${participantCount} people. Enable AI Analysis for optimal time slot recommendations.`
        })
      }
    }

    // AI Analysis promotion
    if (formData.participants && !formData.showAnalysis) {
      newSuggestions.push({
        type: 'tip',
        icon: Sparkles,
        title: 'Try AI Analysis',
        message: 'You have multiple participants. Enable "Show AI Analysis" to see all attendees\' availability and get the best time recommendations.'
      })
    }

    // Time-specific suggestions (DYNAMIC based on user patterns)
    if (formData.time) {
      const hour = parseInt(formData.time.split(':')[0])
      const isPeakHour = userPatterns.peakHours.includes(hour)
      const peakHoursStr = userPatterns.peakHours.map(h => `${h}:00`).join(', ')
      
      if (hour < 8) {
        newSuggestions.push({
          type: 'warning',
          icon: Clock,
          title: 'Early Morning Meeting',
          message: userPatterns.totalEvents > 0 && peakHoursStr
            ? `This is earlier than your typical meeting times (${peakHoursStr}). Consider a later time.`
            : 'Meetings before 8 AM have lower attendance rates. Consider 9 AM or later for better engagement.'
        })
      }
      
      if (hour >= 17) {
        newSuggestions.push({
          type: 'warning',
          icon: Clock,
          title: 'Evening Meeting',
          message: 'After-hours meetings may conflict with personal time. Consider scheduling during core work hours (9 AM - 5 PM).'
        })
      }

      if (isPeakHour && userPatterns.totalEvents > 5) {
        newSuggestions.push({
          type: 'success',
          icon: TrendingUp,
          title: 'Your Prime Meeting Time',
          message: `${hour}:00 is one of your peak meeting hours. You historically have good engagement at this time.`
        })
      }

      if (hour >= 11 && hour <= 13 && !isPeakHour) {
        newSuggestions.push({
          type: 'insight',
          icon: AlertCircle,
          title: 'Lunch Time',
          message: 'This time overlaps with typical lunch hours. Attendees may need to reschedule meals.'
        })
      }
    }

    // Date-based suggestions (DYNAMIC based on user patterns)
    if (formData.date) {
      const selectedDate = new Date(formData.date)
      const dayOfWeek = selectedDate.getDay()
      const isPeakDay = userPatterns.peakDays.includes(dayOfWeek)
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        newSuggestions.push({
          type: 'warning',
          icon: AlertCircle,
          title: 'Weekend Selected',
          message: 'You\'ve selected a weekend date. Make sure this is intentional for work-related events.'
        })
      } else if (isPeakDay && userPatterns.totalEvents > 5) {
        newSuggestions.push({
          type: 'success',
          icon: CheckCircle2,
          title: 'Your Peak Day',
          message: `${dayNames[dayOfWeek]} is one of your busiest days. You typically have good availability and engagement on this day.`
        })
      } else if (!isPeakDay && userPatterns.totalEvents > 10) {
        const peakDaysStr = userPatterns.peakDays.map(d => dayNames[d]).join(', ')
        newSuggestions.push({
          type: 'insight',
          icon: Clock,
          title: 'Less Common Day',
          message: `You typically schedule meetings on ${peakDaysStr}. Is ${dayNames[dayOfWeek]} intentional?`
        })
      }

      if (dayOfWeek === 1 && !isPeakDay) {
        newSuggestions.push({
          type: 'insight',
          icon: Clock,
          title: 'Monday Meeting',
          message: 'Monday mornings are often busy with catch-up. Consider Tuesday for strategic meetings.'
        })
      }

      if (dayOfWeek === 5 && formData.time && parseInt(formData.time.split(':')[0]) >= 15) {
        newSuggestions.push({
          type: 'insight',
          icon: Clock,
          title: 'Friday Afternoon',
          message: 'Friday afternoons have higher cancellation rates. Schedule important meetings earlier in the week.'
        })
      }

      // Check if date is very soon
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const diffDays = Math.floor((selectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) {
        newSuggestions.push({
          type: 'warning',
          icon: AlertCircle,
          title: 'Same-Day Meeting',
          message: 'Scheduling for today. Participants may have limited availability. Consider tomorrow for better options.'
        })
      }

      if (diffDays < 0) {
        newSuggestions.push({
          type: 'warning',
          icon: AlertCircle,
          title: 'Past Date',
          message: 'The selected date is in the past. Please choose a future date.'
        })
      }

      if (diffDays > 30) {
        newSuggestions.push({
          type: 'tip',
          icon: Lightbulb,
          title: 'Far Future Event',
          message: 'Scheduling over a month ahead. Great for planning! You may want to send a reminder closer to the date.'
        })
      }
    }

    // AI Analysis suggestions
    if (formData.showAnalysis) {
      newSuggestions.push({
        type: 'success',
        icon: Sparkles,
        title: 'AI Analysis Enabled',
        message: 'You\'ll receive detailed scoring, conflict analysis, and AI reasoning for the top 10 time slot options.'
      })
    }

    // Add weekly activity insight
    if (userPatterns.totalEvents > 0 && newSuggestions.length < 3) {
      newSuggestions.push({
        type: 'insight',
        icon: TrendingUp,
        title: 'Your Activity',
        message: `You have ${userPatterns.meetingsThisWeek} meeting${userPatterns.meetingsThisWeek !== 1 ? 's' : ''} this week and ${userPatterns.totalEvents} total events this month.`
      })
    }

    setSuggestions(newSuggestions)
  }, [
    formData.title, 
    formData.category, 
    formData.date, 
    formData.time, 
    formData.duration, 
    formData.participants, 
    formData.showAnalysis,
    userPatterns.totalEvents,
    userPatterns.meetingsThisWeek,
    userPatterns.avgMeetingDuration
  ])

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-500'
      case 'warning': return 'text-yellow-500'
      case 'tip': return 'text-blue-500'
      case 'insight': return 'text-purple-500'
      default: return 'text-muted-foreground'
    }
  }

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500/10 border-green-500/20'
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/20'
      case 'tip': return 'bg-blue-500/10 border-blue-500/20'
      case 'insight': return 'bg-purple-500/10 border-purple-500/20'
      default: return 'bg-muted/50'
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 pb-4">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Scheduling Assistant
            {eventsLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {userPatterns.totalEvents > 0 
              ? `Personalized insights from your ${userPatterns.totalEvents} events this month`
              : 'Real-time tips and insights as you schedule'}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Fill out the form to see personalized suggestions</p>
            </div>
          ) : (
            suggestions.map((suggestion, index) => {
              const Icon = suggestion.icon
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-all duration-300 ${getBackgroundColor(suggestion.type)}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${getIconColor(suggestion.type)}`} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1">{suggestion.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {suggestion.message}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          )}

          {/* Quick Stats Footer - DYNAMIC from real data */}
          {formData.title && userPatterns.totalEvents > 0 && (
            <div className="mt-8 pt-6 border-t">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Your Patterns
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground mb-1">Avg Meeting Length</div>
                  <div className="text-lg font-bold">{userPatterns.avgMeetingDuration}m</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground mb-1">This Week</div>
                  <div className="text-lg font-bold">{userPatterns.meetingsThisWeek}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground mb-1">Peak Hours</div>
                  <div className="text-sm font-bold">
                    {userPatterns.peakHours.length > 0 ? `${userPatterns.peakHours[0]}:00` : 'N/A'}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground mb-1">Total Events</div>
                  <div className="text-lg font-bold text-primary">{userPatterns.totalEvents}</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Loading state for Quick Stats */}
          {formData.title && eventsLoading && (
            <div className="mt-8 pt-6 border-t">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading your patterns...
              </h4>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
