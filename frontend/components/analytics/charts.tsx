'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useCalendarEvents } from '@/hooks/use-api'

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b']

function getDateRange(days: number) {
  const end = new Date()
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  }
}

export function AnalyticsCharts() {
  const { startDate, endDate } = getDateRange(30)
  const { data: events = [], isLoading } = useCalendarEvents(startDate, endDate)

  const { weeklyData, categoryData, trendData, summary } = useMemo(() => {
    const data = Array.isArray(events) ? events : []
    const now = new Date()

    const weeklyBuckets = [
      { day: 'Mon', events: 0 },
      { day: 'Tue', events: 0 },
      { day: 'Wed', events: 0 },
      { day: 'Thu', events: 0 },
      { day: 'Fri', events: 0 },
      { day: 'Sat', events: 0 },
      { day: 'Sun', events: 0 },
    ]

    const categoryCounts: Record<string, number> = {}
    const weekCounts = [0, 0, 0, 0]

    data.forEach((event: any) => {
      const start = new Date(event.startTime || event.start_time || event.start)
      if (Number.isNaN(start.getTime())) return

      const weekday = (start.getDay() + 6) % 7 // Monday first
      weeklyBuckets[weekday].events += 1

      const category = event.category || 'Other'
      categoryCounts[category] = (categoryCounts[category] || 0) + 1

      const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      const weekIndex = Math.min(3, Math.max(0, Math.floor(diffDays / 7)))
      if (weekIndex >= 0 && weekIndex < 4) {
        weekCounts[3 - weekIndex] += 1
      }
    })

    const categoryEntries = Object.entries(categoryCounts)
    const totalCategories = categoryEntries.reduce((sum, [, count]) => sum + count, 0) || 1
    const categoryDataComputed = categoryEntries.slice(0, 4).map(([name, count]) => ({
      name,
      value: Math.round((count / totalCategories) * 100),
    }))

    const trendDataComputed = weekCounts.map((count, idx) => ({
      week: `Week ${idx + 1}`,
      scheduled: count,
      completed: count,
    }))

    const totalEvents = data.length
    const totalMinutes = data.reduce((sum: number, e: any) => {
      const start = new Date(e.startTime || e.start_time || e.start)
      const end = new Date(e.endTime || e.end_time || e.end)
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return sum
      return sum + (end.getTime() - start.getTime()) / (1000 * 60)
    }, 0)

    return {
      weeklyData: weeklyBuckets,
      categoryData: categoryDataComputed.length > 0 ? categoryDataComputed : [{ name: 'Other', value: 100 }],
      trendData: trendDataComputed,
      summary: {
        avgDailyHours: totalEvents > 0 ? Math.round((totalMinutes / 60 / 30) * 10) / 10 : 0,
        completionRate: totalEvents > 0 ? 100 : 0,
        totalEvents,
      },
    }
  }, [events])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-72 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Weekly Events */}
      <Card>
        <CardHeader>
          <CardTitle>Events Per Day</CardTitle>
          <CardDescription>This week's activity</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="events" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Events by Category</CardTitle>
            <CardDescription>Distribution of event types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name} ${entry.value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Completion Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule Adherence</CardTitle>
            <CardDescription>Events scheduled vs completed</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="scheduled" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold mb-1">{summary.avgDailyHours}h</div>
            <p className="text-muted-foreground text-sm">Avg daily time scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold mb-1">{summary.completionRate}%</div>
            <p className="text-muted-foreground text-sm">Schedule completion rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold mb-1">{summary.totalEvents}</div>
            <p className="text-muted-foreground text-sm">Total events this month</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
