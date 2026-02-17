# API Integration Reference

## Quick Reference

### Base URL
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
```

---

## Available Hooks

### Analytics
```typescript
import { useAnalytics, useTimeSaved, useMeetingQuality, useProductivityInsights } from '@/hooks/use-api'

// Usage
const { data, isLoading, error } = useAnalytics('month') // 'week' | 'month' | 'year'
```

### Scheduling
```typescript
import { useCreateSchedule, useScheduleRecommendations } from '@/hooks/use-api'

// Create event
const createSchedule = useCreateSchedule()
await createSchedule.mutateAsync({
  userId: 'demo-user-123',
  title: 'Team Meeting',
  duration: 30,
  category: 'meeting',
  preferredDate: '2024-03-20',
  preferredTime: '10:00',
  priority: 'medium',
  flexibility: 'flexible'
})
```

### Calendar
```typescript
import { useCalendarEvents, useSyncGoogleCalendar, useWriteToGoogleCalendar } from '@/hooks/use-api'

// Get events
const { data: events } = useCalendarEvents('user-123', '2024-03-01', '2024-03-31')

// Sync with Google
const syncCalendar = useSyncGoogleCalendar()
await syncCalendar.mutateAsync()
```

### Preferences
```typescript
import { usePreferences, useUpdatePreferences } from '@/hooks/use-api'

const { data: prefs } = usePreferences()
const updatePrefs = useUpdatePreferences()
await updatePrefs.mutateAsync({ workingHours: { start: '09:00', end: '17:00' } })
```

### Google Auth
```typescript
import { useGoogleConnection, useGoogleAuthUrl, useCompleteGoogleAuth } from '@/hooks/use-api'

const { data: isConnected } = useGoogleConnection()
const { data: authUrl, refetch } = useGoogleAuthUrl()
const completeAuth = useCompleteGoogleAuth()
```

---

## API Endpoints

### POST `/api/schedule`
Create a new optimized schedule
```typescript
{
  userId: string
  title: string
  description?: string
  duration: number // minutes
  category?: string
  preferredDate?: string
  preferredTime?: string
  participants?: string[]
  priority?: 'low' | 'medium' | 'high'
  flexibility?: 'rigid' | 'flexible' | 'very_flexible'
}
```

### GET `/api/analytics/:userId`
Get user analytics
```typescript
Query params: period = 'week' | 'month' | 'year'

Response: {
  totalEvents: number
  timeScheduled: number
  completedEvents: number
  productivity: number
}
```

### GET `/api/calendar/:userId`
Get calendar events
```typescript
Query params: startDate, endDate (ISO strings)

Response: {
  events: Array<{
    id: string
    title: string
    startTime: string
    endTime: string
    category: string
  }>
}
```

### POST `/api/calendar/sync/:userId`
Sync with Google Calendar

### POST `/api/calendar/write/:userId`
Write event back to Google Calendar

### GET `/api/preferences/:userId`
Get user preferences

### PUT `/api/preferences/:userId`
Update user preferences

### GET `/api/auth/google/url`
Get Google OAuth URL

### POST `/api/auth/google/callback`
Complete Google OAuth
```typescript
{
  code: string
  userId: string
}
```

---

## Direct API Usage (Without Hooks)

```typescript
import { api } from '@/lib/api'

// Usage with promises
const analytics = await api.getAnalytics('user-123', 'month')
const events = await api.getEvents('user-123', '2024-03-01', '2024-03-31')
await api.createSchedule({
  userId: 'user-123',
  title: 'Meeting',
  duration: 30
})
```

---

## Error Handling

All hooks return standard React Query objects:

```typescript
const { data, isLoading, error, isError } = useAnalytics('month')

if (isLoading) return <Skeleton />
if (isError) return <Error message={error.message} />
return <Dashboard data={data} />
```

---

## Demo User ID

Currently using hardcoded demo user:
```typescript
const DEMO_USER_ID = 'demo-user-123'
```

**For production:** Replace with actual user ID from authentication context.

---

## Cache Invalidation

Hooks automatically invalidate related caches:

```typescript
const createSchedule = useCreateSchedule()
// After mutation, automatically invalidates:
// - ['calendarEvents']
// - ['analytics']

const syncCalendar = useSyncGoogleCalendar()
// After sync, invalidates:
// - ['calendarEvents']
```

---

## Toast Notifications

```typescript
import { toast } from 'sonner'

toast.success('Event created!')
toast.error('Failed to create event')
toast.info('Syncing calendar...')
toast.warning('Backend unavailable')
```

---

## Environment Variables

### `.env.local` (already configured)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

### Access in code
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL
```

**Note:** Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.
