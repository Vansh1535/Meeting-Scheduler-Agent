'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Clock, CheckCircle, TrendingUp } from 'lucide-react'
import { useAnalytics } from '@/hooks/use-api'
import { Skeleton } from '@/components/ui/skeleton'

export function StatsCards() {
  const { data: analytics, isLoading, error } = useAnalytics('month')

  // Use real API data only - no fake fallbacks
  const statsData = analytics || {
    totalEvents: 0,
    timeScheduled: 0,
    completedEvents: 0,
    productivity: 0,
  }

  const stats = [
    {
      title: 'Total Events',
      value: statsData.totalEvents?.toString() || '0',
      description: 'This month',
      icon: BarChart3,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Time Scheduled',
      value: `${statsData.timeScheduled || 0}h`,
      description: 'This week',
      icon: Clock,
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Completed',
      value: statsData.completedEvents?.toString() || '0',
      description: 'Last 30 days',
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Productivity',
      value: `${statsData.productivity || 0}%`,
      description: 'Schedule adherence',
      icon: TrendingUp,
      color: 'from-orange-500 to-red-500',
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="rounded-2xl border-border/60">
            <CardHeader className="pb-2 sm:pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card key={idx} className="relative overflow-hidden group rounded-2xl border-border/60 hover:border-primary/40 transition-all duration-500 hover:shadow-elevation-3 backdrop-blur-soft bg-card/80">
              {/* Background gradient */}
              <div className={`absolute inset-0 opacity-5 bg-gradient-to-br ${stat.color} group-hover:opacity-15 transition-opacity duration-500`} />
              
              {/* Top accent line */}
              <div className={`absolute top-0 left-0 h-1 w-0 bg-gradient-to-r ${stat.color} group-hover:w-full transition-all duration-700`} />

              <CardHeader className="pb-2 sm:pb-3 relative z-10">
                <div className="flex items-center justify-between gap-3 sm:gap-4">
                  <CardTitle className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-elevation-2 group-hover:shadow-elevation-3 group-hover:scale-110 transition-all duration-300`}>
                    <Icon className="w-4 sm:w-5 h-4 sm:h-5" />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative z-10 pt-1 sm:pt-2">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-1">{stat.value}</div>
                <CardDescription className="text-xs font-medium text-muted-foreground">{stat.description}</CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {/* Show helpful message when no data */}
      {!isLoading && statsData.totalEvents === 0 && (
        <Card className="rounded-2xl border-border/60 bg-muted/30 mb-8">
          <CardContent className="pt-6 pb-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                No events yet. Get started by creating your first event or syncing your Google Calendar.
              </p>
              <div className="flex gap-3 justify-center">
                <a 
                  href="/quick-schedule" 
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Create First Event
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {error && (
        <div className="mb-6 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            ⚠️ Analytics data not available yet. Sync your calendar to populate stats.
          </p>
        </div>
      )}
    </>
  )
}
