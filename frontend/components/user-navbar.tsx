'use client'

import { useUser } from '@/contexts/user-context'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RefreshCw, Calendar, LogOut, Settings, User, CheckCircle, XCircle } from 'lucide-react'
import { useSyncGoogleCalendar } from '@/hooks/use-calendar'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export function UserNavbar() {
  const { user, loading, logout } = useUser()
  const syncMutation = useSyncGoogleCalendar()
  const [oauthConnected, setOauthConnected] = useState(false)
  const [checkingOauth, setCheckingOauth] = useState(true)
  const hasCheckedRef = useRef(false) // Prevent re-checking on every render

  // Check OAuth status (only once per user)
  useEffect(() => {
    if (!user?.id || hasCheckedRef.current) return

    const checkOAuthStatus = async () => {
      try {
        const response = await fetch(`/api/auth/google/status/${user.id}`)
        const data = await response.json()
        setOauthConnected(data.connected || false)
      } catch (error) {
        console.error('Failed to check OAuth status:', error)
        setOauthConnected(false)
      } finally {
        setCheckingOauth(false)
        hasCheckedRef.current = true // Mark as checked
      }
    }

    checkOAuthStatus()
  }, [user?.id])

  const handleSyncCalendar = async () => {
    try {
      await syncMutation.mutateAsync()
      // Show success notification (you can add toast here)
    } catch (error) {
      console.error('Sync failed:', error)
      // Show error notification
    }
  }

  const handleConnectCalendar = () => {
    if (user?.id) {
      // Reset check flag so status gets re-checked after OAuth flow completes
      hasCheckedRef.current = false
      window.location.href = `/api/auth/google/initiate?userId=${user.id}`
    }
  }

  if (loading || !user) {
    return (
      <div className="flex items-center gap-4 px-4 py-3 bg-card border-b border-border">
        <div className="flex-1" />
        <div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  // Get user initials for avatar
  const initials = user.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email[0].toUpperCase()

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between px-4 lg:px-8 py-3 bg-card/95 backdrop-blur-lg border-b border-border shadow-sm">
      {/* Left side - Calendar Sync */}
      <div className="flex items-center gap-3">
        {oauthConnected ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncCalendar}
            disabled={syncMutation.isPending}
            className="gap-2 rounded-lg"
          >
            <RefreshCw className={cn(
              "w-4 h-4",
              syncMutation.isPending && "animate-spin"
            )} />
            <span className="hidden sm:inline">
              {syncMutation.isPending ? 'Syncing...' : 'Sync Calendar'}
            </span>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleConnectCalendar}
            className="gap-2 rounded-lg border-orange-500/50 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Connect Calendar</span>
          </Button>
        )}

        {/* OAuth Status Indicator */}
        {!checkingOauth && (
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            {oauthConnected ? (
              <>
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Calendar Connected</span>
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3 text-orange-500" />
                <span>Calendar Not Connected</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right side - User Menu */}
      <div className="flex items-center gap-3">
        {/* User Info */}
        <div className="hidden lg:flex flex-col items-end">
          <span className="text-sm font-semibold text-foreground">
            {user.displayName || 'User'}
          </span>
          <span className="text-xs text-muted-foreground">
            {user.email}
          </span>
        </div>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.profilePictureUrl} alt={user.displayName || user.email} />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            {oauthConnected ? (
              <DropdownMenuItem onClick={handleSyncCalendar} className="cursor-pointer">
                <RefreshCw className="mr-2 h-4 w-4" />
                <span>Sync Calendar</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={handleConnectCalendar} className="cursor-pointer text-orange-600">
                <Calendar className="mr-2 h-4 w-4" />
                <span>Connect Calendar</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
