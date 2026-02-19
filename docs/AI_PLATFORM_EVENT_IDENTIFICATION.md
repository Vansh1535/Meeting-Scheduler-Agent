# AI Platform Event Identification System

## Overview
This system permanently marks and identifies events created by the AI Meeting Scheduler, distinguishing them from native Google Calendar events throughout the platform.

## Implementation Strategy

### 1. **Database Column: `source_platform`**
Added to `calendar_events` table to permanently store event source.

**Values:**
- `'google'` - Native Google Calendar events
- `'ai_platform'` - Events created by AI Meeting Scheduler

**Migration SQL:**
```sql
-- Add source_platform column
ALTER TABLE calendar_events
ADD COLUMN IF NOT EXISTS source_platform TEXT DEFAULT 'google' 
CHECK (source_platform IN ('google', 'ai_platform'));

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_calendar_events_source_platform 
ON calendar_events(source_platform);

-- RETROACTIVELY mark all existing AI Platform events
UPDATE calendar_events ce
SET source_platform = 'ai_platform'
FROM meetings m
WHERE ce.google_event_id = m.google_event_id
  AND m.google_event_id IS NOT NULL
  AND ce.source_platform = 'google';
```

**Location:** `supabase/migrations/005_add_source_platform.sql`

**Handles Existing Events:** ✅ Yes! The migration automatically identifies and marks all existing AI Platform events by checking the meetings table.

### 2. **Google Calendar Extended Properties**
When creating events, we embed metadata directly in the Google Calendar event.

**Implementation:** `frontend/lib/googleCalendarWrite.ts`

```typescript
extendedProperties: {
  private: {
    'source_platform': 'ai_platform',
    'ai_meeting_id': meeting_id,
    'created_by': 'ScaleDown AI Meeting Scheduler',
  },
}
```

**Benefits:**
- Survives calendar sync operations
- Accessible via Google Calendar API
- Not visible to end users
- Reliable source-of-truth

### 3. **Event Description Marker**
Added human-readable identifier in event description.

**Implementation:** `frontend/lib/googleCalendarWrite.ts`

```typescript
const aiPlatformLabel = '\n\n---\n🤖 This event was created by the AI Meeting Scheduler\n---';
const fullDescription = description 
  ? `${description}${aiPlatformLabel}` 
  : aiPlatformLabel.trim();
```

**Example:**
```
Meeting with design team to review wireframes

---
🤖 This event was created by the AI Meeting Scheduler
---
```

### 4. **Calendar Sync Detection**
When syncing from Google Calendar, we detect AI Platform events using **multiple methods** to ensure both new and existing events are properly identified.

**Implementation:** `frontend/lib/googleCalendar.ts`

```typescript
// Fetch all AI meetings for this user (for existing events without extended properties)
const { data: aiMeetings } = await supabase
  .from('meetings')
  .select('google_event_id')
  .eq('user_id', userId)
  .not('google_event_id', 'is', null);

const aiEventIds = new Set(aiMeetings.map(m => m.google_event_id));

// For each event during sync
const hasExtendedProperty = event.raw_event?.extendedProperties?.private?.source_platform === 'ai_platform';
const isInMeetingsTable = aiEventIds.has(event.google_event_id);
const sourcePlatform = (hasExtendedProperty || isInMeetingsTable) ? 'ai_platform' : 'google';
```

**Detection Priority (Multiple Fallbacks):**
1. **Extended Properties** (for new events created after this feature) - `raw_event.extendedProperties.private.source_platform`
2. **Meetings Table Lookup** (for existing events created before this feature) - Check if `google_event_id` exists in meetings table
3. **Database Column** (cached from previous sync) - `calendar_events.source_platform`
4. **Default** - Assume `'google'` if unknown

**Handles Existing Events:** ✅ Yes! The sync process checks the meetings table for ALL events, ensuring existing AI Platform events are correctly identified even if they don't have extended properties.

### 5. **API Response Formatting**
Events returned from API include proper source indicator.

**Implementation:** `frontend/app/api/calendar/events/route.ts`

```typescript
const transformedEvents = (events || []).map((event: any) => ({
  ...event,
  source: event.source_platform === 'ai_platform' ? 'ai' : 'google',
}));
```

**Frontend receives:**
```typescript
{
  id: "uuid",
  title: "Team Sync",
  source: "ai", // or "google"
  source_platform: "ai_platform", // Database value
  ...
}
```

## Visual Color Scheme

### AI Platform Events (RED)
- **Calendar Days**: `from-slate-800 to-red-600` gradient
- **Event Badge**: "AI PLATFORM" with red styling
- **Sidebar**: Red border and red AI icon
- **Event Cards**: Navy-red gradient background

### Google Calendar Events (BLUE/ORANGE)
- **Calendar Days**: `from-blue-500 to-purple-500` gradient
- **Event Badge**: "GOOGLE CAL" with orange styling
- **Sidebar**: Orange calendar icon
- **Event Cards**: Amber-red gradient background

### Mixed Days (GRADIENT)
- **Calendar Days**: `from-red-500 via-purple-500 to-blue-500`
- Shows days containing both AI and Google events

## Usage Examples

### Creating AI Platform Event
```typescript
// In googleCalendarWrite.ts
const result = await createCalendarEvent({
  meeting_id: 'abc-123',
  organizer_user_id: userId,
  summary: 'Team Retrospective',
  description: 'Quarterly review of team performance',
  start_time: '2026-03-01T14:00:00Z',
  end_time: '2026-03-01T15:00:00Z',
  timezone: 'America/New_York',
  attendees: ['alice@example.com', 'bob@example.com'],
});

// Automatically adds:
// 1. Extended properties: source_platform = 'ai_platform'
// 2. Description marker: "🤖 This event was created by the AI Meeting Scheduler"
// 3. Database entry: source_platform = 'ai_platform'
```

### Filtering by Source
```typescript
// Frontend component
const aiEvents = events.filter(e => e.source === 'ai');
const googleEvents = events.filter(e => e.source === 'google');
```

### Database Query
```sql
-- Get all AI Platform events
SELECT * FROM calendar_events 
WHERE source_platform = 'ai_platform';

-- Count by source
SELECT 
  source_platform,
  COUNT(*) as event_count
FROM calendar_events
GROUP BY source_platform;
```

## Testing & Verification

### 1. Apply Database Migration

6. **Verify:** Check the output shows how many AI Platform events were marked

**Option B: PowerShell Script**
```powershell
cd test
./add_source_platform_column.ps1
```

**Expected Result:**
```
source_platform | event_count | percentage
----------------+-------------+------------
google          | 15          | 75.0
ai_platform     | 5           | 25.0
```

### 2. Mark Existing Events (Optional - for verification)

If you want to double-check or re-mark events:

```powershell
cd test
./mark_existing_ai_events.ps1
```

This script:
- ✅ Checks statistics first (how many events need marking)
- ✅ Asks for confirmation before making changes
- ✅ Marks all existing AI Platform events
- ✅ Shows detailed results

**API Endpoint:** `POST /api/calendar/mark-existing-ai-events`

**Example Usage:**
```bash
# Check statistics only (GET)
curl http://localhost:3000/api/calendar/mark-existing-ai-events

# Mark all events (POST)
curl -X POST http://localhost:3000/api/calendar/mark-existing-ai-events \
  -H "Content-Type: application/json" \
  -d '{}'

# Mark for specific user (POST)
curl -X POST http://localhost:3000/api/calendar/mark-existing-ai-events \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user-uuid-here"}'
```

### 3. Sync Calendar

Click "Sync Calendar" button to:
- ✅ Detect and mark new events
- ✅ Verify existing event markers
- ✅ Update source_platform for all events

**Note:** The calendar sync now automatically checks the meetings table, so existing AI events will be properly marked even without extended properties.roper source_platform marking

### 3. Sync Calendar
```typescript
// Triggers sync which will detect and mark events
await syncUserCalendar(userId);
```

### 4. Verify Visual Distinction
Check that:
- ✅ Calendar days with AI events show **red gradient**
- ✅ Event detail dialog shows "**AI PLATFORM**" badge
- ✅ Events appear under "**AI Platform**" in sidebar
- ✅ Event cards use **navy-red gradient**
- ✅ Legend shows all three indicators (Google Cal, AI Platform, Both)

## File Changes Summary

### Database
- `supabase/migrations/005_add_source_platform.sql` - NEW migration file
4. Event created before this feature was implemented

**Solutions:**

**Option 1: Run Retroactive Marking Script**
```powershell
cd test
./mark_existing_ai_events.ps1
```

**Option 2: Manually mark via SQL**
```sql
-- Mark all existing AI events
UPDATE calendar_events ce
SET source_platform = 'ai_platform'
FROM meetings m
WHERE ce.google_event_id = m.google_event_id
  AND m.google_event_id IS NOT NULL;

-- Verify results
SELECT 
  source_platform,
  COUNT(*) as count
FROM calendar_events
GROUP BY source_platform;
```

**Option 3: Sync Calendar**
- Click "Sync Calendar" button
- The sync process will automatically detect and mark AI events using the meetings table lookup

### Colors Not Updating

**Solution:**
1. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Restart Next.js dev server
3. Clear browser cache
4. Verify API response includes `source: "ai"` for AI events
## Benefits

1. **Permanent Identification**: Events remain marked even after multiple syncs
2. **Reliable Detection**: Multiple fallback mechanisms (extended properties → database → meetings table)
3. **User-Friendly**: Clear visual distinction throughout the UI
4. **Transparent**: Human-readable description marker
5. **Queryable**: Easy to filter and analyze by source
6. **Scalable**: Handles mixed days and batch operations

## Troubleshooting

### Events Not Showing as AI Platform

**Possible Causes:**
1. Database column `source_platform` not created
2. Calendar not synced after write-back
3. Extended properties not set during creation

**Solutions:**
```sql
-- Manually mark existing AI events
UPDATE calendar_events ce
SET source_platform = 'ai_platform'
FROM meetings m
WHERE ce.google_event_id = m.google_event_id
  AND m.google_event_id IS NOT NULL;
```

### Colors Not Updating

**Solution:**
1. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Restart Next.js dev server
3. Clear browser cache

### Database Column Missing

**Solution:**
Run the migration SQL in Supabase SQL Editor (see Testing section above)

## Future Enhancements

1. **Batch Operations**: Mark multiple events as AI Platform in one operation
2. **Analytics**: Track adoption rate of AI scheduling vs manual
3. **User Preferences**: Allow users to change default source colors
4. **Export**: Include source_platform in calendar exports
5. **Search**: Filter events by source in search functionality
