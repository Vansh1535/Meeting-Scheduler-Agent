'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'
import { LayoutGrid, FastForward, Calendar, BarChart3, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutGrid,
  },
  {
    label: 'Quick Schedule',
    href: '/quick-schedule',
    icon: FastForward,
  },
  {
    label: 'Calendar',
    href: '/calendar',
    icon: Calendar,
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export function Navigation() {
  const pathname = usePathname()
  const isLanding = pathname === '/landing' || pathname === '/'

  if (isLanding) {
    return null
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex-col p-4 space-y-8 z-40">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center justify-center h-16 rounded-lg bg-primary text-primary-foreground font-bold text-xl hover:opacity-90 transition-opacity">
          BF
        </Link>

        {/* Navigation Items */}
        <div className="flex-1 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3 rounded-lg',
                    isActive && 'ring-2 ring-primary'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            )
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-border pt-4 space-y-3">
          <ThemeToggle />
          <Link href="/landing">
            <Button variant="ghost" className="w-full justify-start gap-3">
              <LogOut className="w-5 h-5" />
              <span>Back to Landing</span>
            </Button>
          </Link>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-4 z-40">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'h-12 w-12 p-0',
                  isActive && 'ring-2 ring-primary'
                )}
              >
                <Icon className="w-5 h-5" />
              </Button>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
