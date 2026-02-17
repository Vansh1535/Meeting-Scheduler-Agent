import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@/contexts/user-context'
import { api } from '@/lib/api'

// ==================== ANALYTICS HOOKS ====================

export function useAnalytics(period: 'week' | 'month' | 'year' = 'month') {
  const { user, loading } = useUser()
  const userId = user?.id || 'test-user'

  return useQuery({
    queryKey: ['analytics', userId, period],
    queryFn: () => api.getAnalytics(userId, period),
    enabled: !loading && !!user,
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
    queryFn: () => api.getProductivityInsights(userId),
    enabled: !loading && !!user,
  })
}

// ==================== CALENDAR HOOKS ====================

export function useCalendarEvents(startDate?: string, endDate?: string) {
  const { user, loading } = useUser()
  const userId = user?.id || 'test-user'

  return useQuery({
    queryKey: ['calendarEvents', userId, startDate, endDate],
    queryFn: () => api.getCalendarEvents(userId, startDate, endDate),
    enabled: !loading && !!user,
  })
}

export function useSyncGoogleCalendar() {
  const { user, loading } = useUser()
  const userId = user?.id || 'test-user'
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => api.syncGoogleCalendar(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
    },
  })
}

export function useWriteToGoogleCalendar() {
  const { user, loading } = useUser()
  const userId = user?.id || 'test-user'
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (eventData: any) => api.writeToGoogleCalendar(userId, eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
    },
  })
}

// ==================== SCHEDULE HOOKS ====================

export function useCreateSchedule() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.createSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export function useScheduleRecommendations(preferences: any) {
  return useQuery({
    queryKey: ['recommendations', preferences],
    queryFn: () => api.getScheduleRecommendations(preferences),
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
  })
}

export function useUpdatePreferences() {
  const { user } = useUser()
  const userId = user?.id || 'test-user'
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (preferences: any) => api.updatePreferences(userId, preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] })
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
  })
}

export function useUpdateAvailability() {
  const { user } = useUser()
  const userId = user?.id || 'test-user'
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (availability: any) => api.updateAvailability(userId, availability),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] })
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
