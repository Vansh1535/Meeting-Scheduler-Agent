/**
 * Calendar-specific hooks
 * Separated to avoid initialization issues
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@/contexts/user-context'
import { api } from '@/lib/api'

// Use function declarations for proper hoisting
function useCalendarEvents(startDate?: string, endDate?: string) {
  const { user, loading } = useUser()
  const userId = user?.id || 'test-user'

  return useQuery({
    queryKey: ['calendarEvents', userId, startDate, endDate],
    queryFn: () => api.getEvents(userId, startDate, endDate),
    enabled: !loading && !!user,
    staleTime: 30 * 1000, // 30 seconds - real-time updates
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: true, // Update when user returns to tab
    refetchOnMount: true, // Update when component mounts
    refetchOnReconnect: true, // Update when connection restored
  })
}

function useSyncGoogleCalendar() {
  const { user, loading } = useUser()
  const userId = user?.id || 'test-user'
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => api.syncGoogle(userId),
    onSuccess: (data) => {
      console.log(`✅ Sync complete: ${data.events_added} added, ${data.events_updated} updated, ${data.events_deleted} deleted`)
      
      // Immediately refetch ALL related queries for real-time updates
      queryClient.invalidateQueries({
        queryKey: ['calendarEvents'],
      })
      queryClient.invalidateQueries({
        queryKey: ['analytics'],
      })
      queryClient.invalidateQueries({
        queryKey: ['aiMeetings'],
      })
      
      // Force refetch to ensure UI updates immediately
      queryClient.refetchQueries({
        queryKey: ['analytics', userId],
      })
    },
    onError: (error: any) => {
      console.error('❌ Calendar sync failed:', error)
    },
  })
}

function useWriteToGoogleCalendar() {
  const { user, loading } = useUser()
  const userId = user?.id || 'test-user'
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (eventData: any) => api.writeToGoogle(userId, eventData),
    onSuccess: () => {
      // Refetch calendar events
      queryClient.invalidateQueries({
        queryKey: ['calendarEvents'],
      })
    },
    onError: (error: any) => {
      console.error('Write to calendar failed:', error)
    },
  })
}

// Export at the end
export { useCalendarEvents, useSyncGoogleCalendar, useWriteToGoogleCalendar }
