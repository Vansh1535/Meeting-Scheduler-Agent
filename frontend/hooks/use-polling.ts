/**
 * Use Polling Hook
 * Automatically syncs data from backend at regular intervals
 * 
 * This ensures calendar events, analytics, and other data
 * stay fresh without requiring user to manually refresh
 */

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useUser } from '@/contexts/user-context'
import { dataSyncManager } from '@/lib/data-sync'
import { api } from '@/lib/api'

interface PollingConfig {
  calendarInterval?: number // milliseconds
  analyticsInterval?: number
  preferencesInterval?: number
  enabled?: boolean
}

const DEFAULT_CONFIG: PollingConfig = {
  calendarInterval: 30000, // 30 seconds
  analyticsInterval: 60000, // 1 minute
  preferencesInterval: 5 * 60 * 1000, // 5 minutes
  enabled: true,
}

/**
 * Hook to enable automatic data polling
 * Place in root layout to keep all data fresh
 */
export function useDataPolling(config: PollingConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const queryClient = useQueryClient()
  const { user, loading } = useUser()

  useEffect(() => {
    if (!finalConfig.enabled || loading || !user?.id) return

    const userId = user.id

    // Start calendar polling
    if (finalConfig.calendarInterval) {
      dataSyncManager.startPolling(
        userId,
        'calendar',
        async () => {
          try {
            await queryClient.refetchQueries({
              queryKey: ['calendarEvents', userId],
              type: 'active',
            })
          } catch (error) {
            console.error('Calendar polling failed:', error)
          }
        },
        finalConfig.calendarInterval
      )
    }

    // Start analytics polling
    if (finalConfig.analyticsInterval) {
      dataSyncManager.startPolling(
        userId,
        'analytics',
        async () => {
          try {
            await queryClient.refetchQueries({
              queryKey: ['analytics', userId],
              type: 'active',
            })
          } catch (error) {
            console.error('Analytics polling failed:', error)
          }
        },
        finalConfig.analyticsInterval
      )
    }

    // Start preferences polling (less often)
    if (finalConfig.preferencesInterval) {
      dataSyncManager.startPolling(
        userId,
        'preferences',
        async () => {
          try {
            await queryClient.refetchQueries({
              queryKey: ['preferences', userId],
              type: 'active',
            })
          } catch (error) {
            console.error('Preferences polling failed:', error)
          }
        },
        finalConfig.preferencesInterval
      )
    }

    // Cleanup on unmount
    return () => {
      dataSyncManager.stopAllPolling()
    }
  }, [user?.id, loading, queryClient, finalConfig])
}

/**
 * Hook for manual sync of a specific resource
 */
export function useSyncResource(resource: 'calendar' | 'analytics' | 'preferences') {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return async () => {
    if (!user?.id) return

    try {
      switch (resource) {
        case 'calendar':
          await queryClient.refetchQueries({
            queryKey: ['calendarEvents', user.id],
          })
          break
        case 'analytics':
          await queryClient.refetchQueries({
            queryKey: ['analytics', user.id],
          })
          break
        case 'preferences':
          await queryClient.refetchQueries({
            queryKey: ['preferences', user.id],
          })
          break
      }
    } catch (error) {
      console.error(`Failed to sync ${resource}:`, error)
      throw error
    }
  }
}
