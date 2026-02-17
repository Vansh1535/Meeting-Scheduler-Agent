"use client"

import { usePathname } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { UserNavbar } from '@/components/user-navbar'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLanding = pathname === '/landing' || pathname === '/'

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className={`flex-1 w-full pb-16 lg:pb-0 ${isLanding ? '' : 'lg:ml-64'}`}>
        {!isLanding && <UserNavbar />}
        {children}
      </main>
    </div>
  )
}
