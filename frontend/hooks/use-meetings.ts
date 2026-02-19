/**
 * Custom hooks for fetching AI-scheduled meetings from the meetings table
 * This is separate from calendar_events (Google Calendar sync)
 */

import { useQuery } from '@tanstack/react-query'
import { useUser } from '@/contexts/user-context'
import { useMemo } from 'react'

interface Meeting {
  id: string
  meeting_id: string
  requested_at: string
  participant_count: number
  duration_minutes: number
  earliest_date: string
  latest_date: string
  success: boolean
  status: string
  selected_candidate_id?: string
  google_event_id?: string
  meeting_candidates?: Array<{
    slot_start: string
    slot_end: string
    final_score: number
    rank: number
  }>
}

/**
 * Fetch AI-scheduled meetings for a user
 */
export function useAIScheduledMeetings(startDate?: string, endDate?: string) {
  const { user, loading } = useUser()
  const userId = user?.id

  return useQuery({
    queryKey: ['aiMeetings', userId, startDate, endDate],
    queryFn: async () => {
      if (!userId) return []

      const params = new URLSearchParams({ userId })
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/meetings?${params.toString()}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch meetings')
      }

      const data = await response.json()
      return data.meetings || []
    },
    enabled: !loading && !!user,
    staleTime: 30 * 1000, // 30 seconds - real-time updates
    refetchOnWindowFocus: true, // Update when user returns to tab
    refetchOnMount: true, // Update when component mounts
    refetchOnReconnect: true, // Update when connection restored
  })
}

/**
 * Fetch upcoming AI-scheduled meetings (next 30 days)
 */
export function useUpcomingMeetings() {
  // Memoize dates to prevent infinite re-renders
  const { startDate, endDate } = useMemo(() => {
    const today = new Date()
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    // Use just the date part (YYYY-MM-DD) to avoid millisecond changes
    return {
      startDate: today.toISOString().split('T')[0],
      endDate: thirtyDaysLater.toISOString().split('T')[0]
    }
  }, []) // Empty deps = calculate only once

  return useAIScheduledMeetings(startDate, endDate)
}
