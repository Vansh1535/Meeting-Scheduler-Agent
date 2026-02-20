import axios, { AxiosInstance } from 'axios'
import { ApiErrorHandler, ApiError } from './api-error-handler'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    })

    // Add response interceptor for error handling - DON'T silently swallow errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Parse and categorize the error
        const parsedError = ApiErrorHandler.parseError(error)
        return Promise.reject(parsedError)
      }
    )
  }

  // ==================== SCHEDULING ====================
  
  /**
   * Create a new schedule with AI optimization
   * @param scheduleRequest - Schedule request data
   */
  async createSchedule(scheduleRequest: ScheduleRequest) {
    const response = await this.client.post('/api/schedule/quick', scheduleRequest)
    return response.data
  }

  /**
   * Get schedule recommendations based on preferences
   */
  async getScheduleRecommendations(preferences: any) {
    const response = await this.client.post('/api/schedule/recommendations', preferences)
    return response.data
  }

  // ==================== CALENDAR ====================

  /**
   * Get user's calendar events
   */
  async getCalendarEvents(userId: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams()
    params.append('userId', userId)
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    
    const response = await this.client.get(`/api/calendar/events?${params}`)
    return response.data || []
  }

  /**
   * Sync calendar with Google Calendar
   */
  async syncGoogleCalendar(userId: string) {
    // Always force refresh to ensure newly created Google Calendar events are fetched
    const response = await this.client.post(`/api/calendar/sync/${userId}`, { force_refresh: true })
    return response.data
  }

  /**
   * Write event back to Google Calendar
   */
  async writeToGoogleCalendar(userId: string, eventData: any) {
    const response = await this.client.post(`/api/calendar/write/${userId}`, eventData)
    return response.data
  }

  // ==================== ANALYTICS ====================

  /**
   * Get user analytics and statistics
   * @param userId - User ID
   * @param period - Time period (week, month, year, current_month)
   */
  async getAnalytics(userId: string, period: 'week' | 'month' | 'year' | 'current_month' = 'month') {
    const response = await this.client.get(`/api/analytics/${userId}?period=${period}`)
    return response.data
  }

  /**
   * Get time saved analytics
   */
  async getTimeSaved(userId: string) {
    const response = await this.client.get(`/api/analytics/${userId}/time-saved`)
    return response.data
  }

  /**
   * Get meeting quality scores
   */
  async getMeetingQuality(userId: string) {
    const response = await this.client.get(`/api/analytics/${userId}/meeting-quality`)
    return response.data
  }

  async getProductivityInsights(userId: string) {
    const response = await this.client.get(`/api/analytics/${userId}/insights`)
    return response.data
  }

  // ==================== PREFERENCES ====================

  /**
   * Get user preferences
   */
  async getPreferences(userId: string) {
    const response = await this.client.get(`/api/preferences/${userId}`)
    return response.data
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, preferences: any) {
    const response = await this.client.put(`/api/preferences/${userId}`, preferences)
    return response.data
  }

  // ==================== AVAILABILITY ====================

  /**
   * Get user availability
   */
  async getAvailability(userId: string, startDate: string, endDate: string) {
    const response = await this.client.get(`/api/availability/${userId}`, {
      params: { startDate, endDate }
    })
    return response.data
  }

  /**
   * Update user availability
   */
  async updateAvailability(userId: string, availability: any) {
    const response = await this.client.put(`/api/availability/${userId}`, availability)
    return response.data
  }

  // ==================== GOOGLE AUTH ====================

  /**
   * Get Google OAuth URL
   */
  async getGoogleAuthUrl(userId: string) {
    const response = await this.client.get(`/api/auth/google/url?userId=${userId}`)
    return response.data
  }

  /**
   * Complete Google OAuth flow
   */
  async completeGoogleAuth(code: string, userId: string) {
    const response = await this.client.post('/api/auth/google/callback', { code, userId })
    return response.data
  }

  /**
   * Check if user has connected Google Calendar
   */
  async checkGoogleConnection(userId: string) {
    const response = await this.client.get(`/api/auth/google/status/${userId}`)
    return response.data
  }

  // ==================== COMPRESSION (ScaleDown) ====================

  /**
   * Get compression statistics
   */
  async getCompressionStats(userId: string) {
    const response = await this.client.get(`/api/compression/${userId}/stats`)
    return response.data
  }

  /**
   * Apply ScaleDown compression to schedule
   */
  async applyCompression(scheduleData: any) {
    const response = await this.client.post('/api/compression/apply', scheduleData)
    return response.data
  }
}

// Types
export interface ScheduleRequest {
  userId: string
  title: string
  description?: string
  duration: number // in minutes
  category?: string
  preferredDate?: string
  preferredTime?: string
  participants?: string[]
  priority?: 'low' | 'medium' | 'high'
  flexibility?: 'rigid' | 'flexible' | 'very_flexible'
}

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  category?: string
  participants?: string[]
  location?: string
  isAllDay?: boolean
  status?: 'confirmed' | 'tentative' | 'cancelled'
}

export interface Analytics {
  totalEvents: number
  timeScheduled: number // in hours
  completedEvents: number
  productivity: number // percentage
  timeSaved: number // in hours
  meetingQuality: number // score 0-100
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export convenience functions
export const api = {
  // Schedule
  createSchedule: (data: ScheduleRequest) => apiClient.createSchedule(data),
  getRecommendations: (preferences: any) => apiClient.getScheduleRecommendations(preferences),
  
  // Calendar
  getEvents: (userId: string, startDate?: string, endDate?: string) => 
    apiClient.getCalendarEvents(userId, startDate, endDate),
  syncGoogle: (userId: string) => apiClient.syncGoogleCalendar(userId),
  writeToGoogle: (userId: string, eventData: any) => apiClient.writeToGoogleCalendar(userId, eventData),
  
  // Analytics
  getAnalytics: (userId: string, period?: 'week' | 'month' | 'year' | 'current_month') => 
    apiClient.getAnalytics(userId, period),
  getTimeSaved: (userId: string) => apiClient.getTimeSaved(userId),
  getMeetingQuality: (userId: string) => apiClient.getMeetingQuality(userId),
  getInsights: (userId: string) => apiClient.getProductivityInsights(userId),
  
  // Preferences
  getPreferences: (userId: string) => apiClient.getPreferences(userId),
  updatePreferences: (userId: string, prefs: any) => apiClient.updatePreferences(userId, prefs),
  
  // Availability
  getAvailability: (userId: string, startDate: string, endDate: string) => 
    apiClient.getAvailability(userId, startDate, endDate),
  updateAvailability: (userId: string, availability: any) => 
    apiClient.updateAvailability(userId, availability),
  
  // Auth
  getGoogleAuthUrl: (userId: string) => apiClient.getGoogleAuthUrl(userId),
  completeGoogleAuth: (code: string, userId: string) => apiClient.completeGoogleAuth(code, userId),
  checkGoogleConnection: (userId: string) => apiClient.checkGoogleConnection(userId),
  
  // Compression
  getCompressionStats: (userId: string) => apiClient.getCompressionStats(userId),
  applyCompression: (scheduleData: any) => apiClient.applyCompression(scheduleData),
}

export default apiClient

