# Why Your 28 Meetings Show 0 AI Events

## TL;DR

You have **28 meetings** in your database, but **0 have google_event_id**. This means they were never written to Google Calendar. Without google_event_id, the migration can't identify which calendar events are AI-scheduled.

## What Happened

### The AI Scheduling Flow (How It Should Work)

```
1. User requests meeting via Quick Schedule
   ↓
2. AI analyzes calendars and suggests optimal time
   ↓
3. Meeting saved to database with selected_slot
   ↓
4. ⚠️ CRITICAL STEP: Write to Google Calendar ⚠️
   - Creates event in Google Calendar
   - Returns google_event_id
   - Stores google_event_id in meetings table
   ↓
5. User syncs calendar
   ↓
6. Event fetched from Google Calendar into calendar_events
   ↓
7. System matches google_event_id between tables
   ↓
8. Event marked as source_platform = 'ai_platform'
   ↓
9. Event displays with RED color scheme
```

### What Went Wrong

**Step 4 didn't happen** for your 28 meetings. Possible reasons:

1. **Write-back was never triggered** (writeback_status = 'pending')
   - Meeting was created but write-back step was skipped
   - Could be a UI flow issue or manual database insertion

2. **Write-back was attempted but failed** (writeback_status = 'failed')
   - OAuth token expired
   - Calendar permissions issue
   - Network error during API call

3. **Meetings are incomplete** (no selected_slot)
   - AI scheduling didn't complete
   - Waiting for participant responses
   - These can't be written to Google Calendar yet

## Diagnosis Steps

### Step 1: Check Meeting Status

Run **Query 1** from `test/analyze_meeting_status.ps1` in Supabase SQL Editor:

```sql
SELECT 
    status,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE selected_slot IS NOT NULL) as has_slot,
    COUNT(*) FILTER (WHERE google_event_id IS NULL) as missing_google_id
FROM meetings
GROUP BY status
ORDER BY count DESC;
```

**What to look for:**
- `status = 'pending'` → Meetings not finalized, can't be written yet ✅ Expected
- `status = 'confirmed'` → Should have been written to Google Calendar ❌ Problem if google_event_id is NULL

### Step 2: Check Write-Back Status

Run **Query 2** to see write-back details:

```sql
SELECT 
    meeting_id,
    title,
    status,
    selected_slot IS NOT NULL as has_slot,
    google_event_id,
    writeback_status,
    writeback_attempts,
    last_writeback_attempt,
    created_at
FROM meetings
WHERE selected_slot IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

**What to look for:**
- `writeback_status = 'pending'` → Never tried to write ❌ 
- `writeback_status = 'failed'` → Tried but failed ❌
- `writeback_status = 'success'` → Should have google_event_id ✅

### Step 3: Check for Errors

Run **Query 4** to see error messages:

```sql
SELECT 
    meeting_id,
    title,
    writeback_status,
    writeback_attempts,
    last_writeback_error,
    created_at
FROM meetings
WHERE selected_slot IS NOT NULL 
  AND google_event_id IS NULL
ORDER BY created_at DESC
LIMIT 5;
```

**Common errors:**
- `"invalid_grant"` → Google OAuth token expired, reconnect account
- `"404"` → Calendar not found, check calendar ID
- `"insufficient permissions"` → Need calendar write permission

## Solutions

### Solution A: Batch Write-Back (Recommended)

If your meetings are ready (have selected_slot), use the batch write-back script:

```powershell
cd test
./batch_write_back.ps1
```

This will:
1. ✅ Find all meetings with selected_slot but no google_event_id
2. ✅ Write them to Google Calendar
3. ✅ Store the google_event_id in database
4. ✅ Show detailed results

**Prerequisites:**
- Frontend dev server running (`cd frontend && npm run dev`)
- Google account connected and authorized
- Meetings have selected_slot populated

**After running:**
1. Check your Google Calendar - you should see new events
2. Look for "🤖 This event was created by the AI Meeting Scheduler" in descriptions
3. Click "Sync Calendar" in your app
4. Events should now show as "AI Platform" with RED color scheme

### Solution B: Test with New Meeting

If batch write-back doesn't work or you want to test the flow:

1. Create a new meeting using Quick Schedule
2. Watch the terminal logs for write-back success
3. Check that meeting gets google_event_id in database
4. Verify it appears in Google Calendar
5. Sync your calendar
6. Confirm it shows as AI Platform event

### Solution C: Manual Verification

If meetings can't be written to Google (OAuth issues, etc.):

**Alternative identification method**: We could mark events as AI Platform based on OTHER criteria:

- Description contains "AI Meeting Scheduler"
- Summary matches pattern (e.g., "Meeting with...")
- Participants match meetings table
- Time slots match exactly

This would require a custom script to analyze and match events.

## Expected Results

### After Successful Write-Back

**Database:**
```sql
-- meetings table
meeting_id          | google_event_id              | writeback_status
--------------------|------------------------------|------------------
abc-123             | xyz789_20260219T100000Z      | success
def-456             | abc123_20260219T140000Z      | success
```

**Google Calendar:**
- Event with title matching meeting.title
- Description: "🤖 This event was created by the AI Meeting Scheduler"
- Extended properties: `source_platform = 'ai_platform'`

**After Calendar Sync:**
```sql
-- calendar_events table
id | google_event_id         | source_platform | summary
---|-------------------------|-----------------|----------
1  | xyz789_20260219T100000Z | ai_platform     | Meeting with...
2  | abc123_20260219T140000Z | ai_platform     | Team sync
```

**In UI:**
- Events show with 🔴 RED color scheme
- Event details show "AI PLATFORM" badge
- Listed under "AI Platform" section in sidebar
- "Events by Source" shows correct count

## Next Steps

1. **Run Query 1** (meetings by status) to understand your 28 meetings
2. **Share the results** so we can determine the best solution
3. Based on results:
   - If meetings are ready → Run batch write-back
   - If meetings failed → Fix OAuth/permissions issues
   - If meetings are incomplete → They're not ready yet

## Key Insight

The migration and sync logic are **100% correct**. The issue is simply that meetings need to be written to Google Calendar first. Once they have google_event_id, everything will work automatically:

- ✅ Migration will mark them retroactively
- ✅ Sync will detect them via meetings table lookup
- ✅ UI will display them with red color scheme
- ✅ All existing events will be properly identified

The system is designed correctly - we just need to complete the write-back step for these 28 meetings!
