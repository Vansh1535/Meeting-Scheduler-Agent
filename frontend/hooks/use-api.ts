import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@/contexts/user-context'
import { api } from '@/lib/api'
import { dataSyncManager } from '@/lib/data-sync'

// NOTE: Calendar hooks are in separate file: @/hooks/use-calendar
// Import from there to avoid circular dependencies

// ==================== INITIALIZATION HOOK ====================

/**
 * Initialize data sync manager - call once in root layout
 * Must be called before any other API hooks
 */
export function useInitializeSync(queryClient: any) {
  if (queryClient) {
    dataSyncManager.initialize(queryClient)
  }
}

// ==================== ANALYTICS HOOKS ====================

export function useAnalytics(period: 'week' | 'month' | 'year' | 'current_month' = 'month') {
  const { user, loading } = useUser()
  const userId = user?.id || 'test-user'

  return useQuery({
    queryKey: ['analytics', userId, period],
    queryFn: () => api.getAnalytics(userId, period),
    enabled: !loading && !!user,
    staleTime: 30 * 1000, // 30 seconds - real-time feel without spam
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true, // Update when user returns to tab
    refetchOnMount: true, // Update when component mounts
    refetchOnReconnect: true, // Update when connection restored
  })
}

export function useTimeSaved() {
  const { user, loading } = useUser()
  const userId = user?.id || 'test-user'

  return useQuery({
    queryKey: ['timeSaved', userId],
    queryFn: () => api.getTimeSaved(userId),
    enabled: !loading && !!user,
  })
}

export function useMeetingQuality() {
  const { user, loading } = useUser()
  const userId = user?.id || 'test-user'

  return useQuery({
    queryKey: ['meetingQuality', userId],
    queryFn: () => api.getMeetingQuality(userId),
    enabled: !loading && !!user,
  })
}

export function useProductivityInsights() {
  const { user, loading } = useUser()
  const userId = user?.id || 'test-user'

  return useQuery({
    queryKey: ['insights', userId],
    queryFn: () => api.getInsights(userId),
    enabled: !loading && !!user,
  })
}

// ==================== SCHEDULE HOOKS ====================

export function useCreateSchedule() {
  const { user } = useUser()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.createSchedule,
    onSuccess: (data) => {
      // Aggressive cache invalidation for calendar and analytics
      const userId = user?.id || 'test-user'
      dataSyncManager.invalidateDataTree('event', userId)
      
      // Refetch all related data
      queryClient.refetchQueries({
        queryKey: ['calendarEvents'],
        type: 'active',
      })
      queryClient.refetchQueries({
        queryKey: ['analytics'],
        type: 'active',
      })
      queryClient.refetchQueries({
        queryKey: ['insights'],
        type: 'active',
      })
    },
    onError: (error: any) => {
      console.error('Schedule creation failed:', error)
    },
  })
}

export function useScheduleRecommendations(preferences: any) {
  return useQuery({
    queryKey: ['recommendations', preferences],
    queryFn: () => api.getRecommendations(preferences),
    enabled: !!preferences,
  })
}

// ==================== PREFERENCES HOOKS ====================

export function usePreferences() {
  const { user, loading } = useUser()
  const userId = user?.id || 'test-user'

  return useQuery({
    queryKey: ['preferences', userId],
    queryFn: () => api.getPreferences(userId),
    enabled: !loading && !!user,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })
}

export function useUpdatePreferences() {
  const { user } = useUser()
  const userId = user?.id || 'test-user'
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (preferences: any) => api.updatePreferences(userId, preferences),
    onSuccess: () => {
      // Invalidate preferences and related data
      dataSyncManager.invalidateDataTree('preferences', userId)
      
      // Refetch preferences immediately
      queryClient.refetchQueries({
        queryKey: ['preferences', userId],
      })
    },
    onError: (error: any) => {
      console.error('Preferences update failed:', error)
    },
  })
}

// ==================== AVAILABILITY HOOKS ====================

export function useAvailability(startDate: string, endDate: string) {
  const { user, loading } = useUser()
  const userId = user?.id || 'test-user'

  return useQuery({
    queryKey: ['availability', userId, startDate, endDate],
    queryFn: () => api.getAvailability(userId, startDate, endDate),
    enabled: !loading && !!user && !!startDate && !!endDate,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })
}

export function useUpdateAvailability() {
  const { user } = useUser()
  const userId = user?.id || 'test-user'
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (availability: any) => api.updateAvailability(userId, availability),
    onSuccess: () => {
      dataSyncManager.invalidateDataTree('availability', userId)
      
      queryClient.refetchQueries({
        queryKey: ['availability'],
      })
    },
    onError: (error: any) => {
      console.error('Availability update failed:', error)
    },
  })
}

// ==================== GOOGLE AUTH HOOKS ====================

export function useGoogleAuthUrl() {
  const { user, loading } = useUser()
  const userId = user?.id || 'test-user'

  return useQuery({
    queryKey: ['googleAuthUrl', userId],
    queryFn: () => api.getGoogleAuthUrl(userId),
    enabled: !loading && !!user && false, // Only fetch when explicitly requested
  })
}

export function useGoogleConnection() {
  const { user, loading } = useUser()
  const userId = user?.id || 'test-user'

  return useQuery({
    queryKey: ['googleConnection', userId],
    queryFn: () => api.checkGoogleConnection(userId),
    enabled: !loading && !!user,
  })
}

export function useCompleteGoogleAuth() {
  const { user } = useUser()
  const userId = user?.id || 'test-user'
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ code }: { code: string }) => api.completeGoogleAuth(code, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['googleConnection'] })
    },
  })
}

// ==================== COMPRESSION HOOKS ====================

export function useCompressionStats() {
  const { user, loading } = useUser()
  const userId = user?.id || 'test-user'

  return useQuery({
    queryKey: ['compressionStats', userId],
    queryFn: () => api.getCompressionStats(userId),
    enabled: !loading && !!user,
  })
}

export function useApplyCompression() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.applyCompression,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
      queryClient.invalidateQueries({ queryKey: ['compressionStats'] })
    },
  })
}
