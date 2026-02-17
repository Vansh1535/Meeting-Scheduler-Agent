'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { useUser } from '@/contexts/user-context'

export function DashboardHeader() {
  const { user } = useUser()
  
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-6">
      <div>
        <h1 className="text-5xl sm:text-6xl font-bold text-foreground font-outfit leading-tight mb-2">Dashboard</h1>
        <p className="text-lg text-muted-foreground font-medium">{getGreeting()}, {firstName}! Welcome back to your scheduling hub</p>
      </div>
      <Link href="/quick-schedule">
        <Button className="gap-2 px-8 h-12 rounded-2xl shadow-elevation-2 hover:shadow-elevation-3 transition-all duration-300 hover:scale-105">
          <Plus className="w-5 h-5" />
          New Event
        </Button>
      </Link>
    </div>
  )
}
