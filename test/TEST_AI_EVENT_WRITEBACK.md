# Testing AI Event Write-Back to Google Calendar

## Current Situation
- ✅ Meetings exist in database
- ❌ Meetings NOT written to Google Calendar (google_event_id is NULL)
- ❌ Can't mark existing events as AI Platform without google_event_id

## Solution: Test End-to-End Flow

### Step 1: Create a Test Meeting

1. **Go to Quick Schedule page** in your app
2. **Schedule a test meeting** with these details:
   - Title: "AI Test Meeting"
   - Duration: 30 minutes
   - Participants: Just yourself
   
3. **Submit the scheduling request**

### Step 2: Verify Google Calendar Write-Back

**Check 1: Database**
```sql
-- Check if google_event_id was populated
SELECT 
    id,
    title,
    google_event_id,
    status,
    created_at
FROM meetings
WHERE title ILIKE '%AI Test Meeting%'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**
- `google_event_id` should have a value (like "abc123xyz_20260219T100000Z")
- If NULL, the write-back failed

**Check 2: Google Calendar**
- Open your Google Calendar (calendar.google.com)
- Look for "AI Test Meeting"
- Check the description - should contain "🤖 This event was created by the AI Meeting Scheduler"

### Step 3: Sync Your Calendar

1. **Click "Sync Calendar"** button in your app
2. This will fetch the event from Google Calendar into `calendar_events` table

**Verify sync worked:**
```sql
SELECT 
    id,
    summary,
    google_event_id,
    source_platform
FROM calendar_events
WHERE summary ILIKE '%AI Test Meeting%';
```

**Expected Result:**
- Event should exist in calendar_events
- `google_event_id` should match the one from meetings table
- `source_platform` should be 'ai_platform' (thanks to the enhanced sync logic)

### Step 4: Verify Event Detection

**Check the frontend console logs:**
- Should see: "📊 Found 1 existing AI Platform events for user ..."
- Should see the event detected during sync

**Check the UI:**
- Event should appear with RED color scheme
- Event detail should show "AI PLATFORM" badge
- Should be listed under "AI Platform" in sidebar

## If Write-Back Fails

### Common Issues

**1. Google Calendar API Not Authorized**
```sql
-- Check OAuth status
SELECT 
    email,
    google_access_token IS NOT NULL as has_token,
    google_refresh_token IS NOT NULL as has_refresh
FROM user_accounts;
```

**Solution:** Reconnect your Google account in Settings

**2. Check Browser Console for Errors**
- Open DevTools (F12)
- Look for errors during meeting creation
- Share any error messages related to "calendar" or "google"

**3. Check Backend Logs**
- Look for errors in your terminal running Next.js
- Search for "createGoogleCalendarEvent" errors

## If Everything Works

Once you've confirmed:
- ✅ New meeting has google_event_id in meetings table
- ✅ Event appears in Google Calendar with AI marker
- ✅ Sync brings event into calendar_events
- ✅ Event shows as AI Platform in UI

Then you know the system is working! 🎉

### For Existing Meetings (if any exist)

If you have old meetings that need google_event_ids:

**Option A: Re-schedule them**
- Cancel old meetings
- Create new ones using Quick Schedule
- They'll get proper google_event_ids

**Option B: Manual write-back (requires custom script)**
- Would need to loop through all meetings without google_event_id
- Write each to Google Calendar
- Update meetings table with returned event IDs

## Summary

**Right now:** 
- Migration is correct ✅
- Sync logic is correct ✅
- Database schema is correct ✅

**What's missing:**
- Meetings need to be written to Google Calendar to get google_event_id
- Once that happens, everything will work automatically

**Next action:** 
Test creating a new meeting and verify the complete flow works end-to-end.
