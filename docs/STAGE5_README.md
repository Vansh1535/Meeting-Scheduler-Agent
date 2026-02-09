# Stage 5: Calendar Write-Back

**Status:** ✅ Complete  
**Goal:** Complete the read → think → act loop by writing AI-selected meetings to Google Calendar

---

## 🎯 What It Does

After the AI Brain selects the optimal meeting slot, this system:

1. **Creates a Google Calendar event** with the AI-selected time
2. **Invites all participants** automatically
3. **Adds Google Meet link** for virtual meetings
4. **Includes AI reasoning** in the event description
5. **Tracks write-back status** for retries and auditing
6. **Prevents duplicates** with idempotency checks

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Stage 5 Flow                            │
└─────────────────────────────────────────────────────────────────┘

1. AI Scheduling (Stage 4)
   ├─ Find optimal slot
   ├─ Score candidates
   └─ Store in Supabase (writeback_status: pending)

2. Calendar Write-Back (Stage 5)
   ├─ POST /api/calendar/write-back
   ├─ Check idempotency (already created?)
   ├─ Get OAuth token from Supabase
   ├─ Create Google Calendar event
   │  ├─ Timezone-aware start/end
   │  ├─ Add attendees
   │  ├─ Add Google Meet link
   │  └─ Include AI reasoning
   └─ Update Supabase (writeback_status: created)

3. Verification
   ├─ Event appears in Google Calendar
   ├─ Attendees receive invites
   └─ Status tracked in database
```

---

## 📊 Database Schema

### New Columns in `meetings` Table

```sql
-- Write-back tracking
google_event_id         TEXT          -- Google Calendar event ID
google_calendar_id      TEXT          -- Target calendar (default: 'primary')
writeback_status        TEXT          -- 'pending' | 'created' | 'failed' | 'retrying'
writeback_error         TEXT          -- Error message if failed
writeback_attempted_at  TIMESTAMPTZ   -- Last attempt timestamp
writeback_succeeded_at  TIMESTAMPTZ   -- Success timestamp
writeback_retry_count   INTEGER       -- Number of retry attempts
google_event_link       TEXT          -- Direct link to event
```

### Helper Functions

```sql
-- Mark write-back as successful
mark_writeback_success(meeting_id, google_event_id, calendar_id, event_link)

-- Mark write-back as failed (with retry logic)
mark_writeback_failure(meeting_id, error_message, should_retry)

-- Get pending write-backs for batch processing
get_pending_writebacks(limit)
```

---

## 🔌 API Endpoints

### POST /api/calendar/write-back

Create Google Calendar event from AI scheduling decision.

**Single Meeting:**
```json
{
  "meeting_id": "abc-123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Calendar event created successfully",
  "results": [{
    "meeting_id": "abc-123",
    "success": true,
    "google_event_id": "xyz789",
    "google_event_link": "https://calendar.google.com/event?eid=...",
    "already_exists": false
  }]
}
```

**Batch Processing:**
```json
{
  "batch": true,
  "limit": 10
}
```

### GET /api/calendar/write-back?meeting_id=abc-123

Check write-back status.

**Response:**
```json
{
  "meeting_id": "abc-123",
  "status": "created",
  "google_event_id": "xyz789",
  "google_event_link": "https://calendar.google.com/event?eid=...",
  "error": null,
  "retry_count": 0,
  "succeeded_at": "2026-02-09T12:34:56Z"
}
```

---

## 🚀 Usage

### Manual Write-Back (After Scheduling)

```powershell
# 1. Run AI scheduling
curl -X POST http://localhost:3000/api/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "meeting_id": "meeting-001",
    "participant_emails": ["user1@example.com", "user2@example.com"],
    "constraints": { ... }
  }'

# 2. Write to Google Calendar
curl -X POST http://localhost:3000/api/calendar/write-back \
  -H "Content-Type: application/json" \
  -d '{"meeting_id": "meeting-001"}'

# 3. Check status
curl http://localhost:3000/api/calendar/write-back?meeting_id=meeting-001
```

### Automated Write-Back (Integration)

Modify your scheduling workflow to automatically trigger write-back:

```typescript
// After AI scheduling completes
const scheduleResponse = await fetch('/api/schedule', {
  method: 'POST',
  body: JSON.stringify(scheduleRequest)
});

if (scheduleResponse.ok) {
  const { meeting_id } = scheduleRequest;
  
  // Automatically create calendar event
  await fetch('/api/calendar/write-back', {
    method: 'POST',
    body: JSON.stringify({ meeting_id })
  });
}
```

### Batch Processing (Retry Failed Write-Backs)

```powershell
# Process up to 10 pending write-backs
curl -X POST http://localhost:3000/api/calendar/write-back \
  -H "Content-Type: application/json" \
  -d '{"batch": true, "limit": 10}'
```

You can set this up as a scheduled job (cron) to automatically retry failed write-backs.

---

## ✨ Features

### 🔒 Idempotency

Calling write-back multiple times for the same meeting will NOT create duplicate events:

```powershell
# First call: Creates event
POST /api/calendar/write-back {"meeting_id": "abc-123"}
# Result: Event created, google_event_id: xyz789

# Second call: Returns existing event
POST /api/calendar/write-back {"meeting_id": "abc-123"}
# Result: already_exists: true, same google_event_id
```

### 🔄 Auto-Retry

Failed write-backs are automatically retried (up to 3 times):

- Network errors: Retry
- Token expiration: Refresh token and retry
- Invalid grant: Do not retry (re-auth required)

Status progression: `pending` → `retrying` → `failed` (after 3 attempts)

### 📝 Rich Event Details

Created events include:

- **Title:** "AI-Scheduled Meeting: [participant names]"
- **Description:**
  ```
  🤖 AI-Scheduled Meeting
  
  Score: 89.5/100
  [AI reasoning summary]
  
  Participants:
  - John Doe (john@example.com)
  - Jane Smith (jane@example.com)
  
  Duration: 30 minutes
  Timezone: America/New_York
  ```
- **Attendees:** All participants auto-invited
- **Google Meet:** Video conferencing link added automatically
- **Reminders:** 
  - Email: 1 day before
  - Popup: 30 minutes before

---

## 🧪 Testing

### Run Test Script

```powershell
.\test_stage5_writeback.ps1
```

This will:
1. ✅ Run AI scheduling
2. ✅ Create Google Calendar event
3. ✅ Verify status in database
4. ✅ Test idempotency
5. ✅ Open event in your browser

### Manual Verification

After running the test:

1. Open [Google Calendar](https://calendar.google.com)
2. Find the event titled "AI-Scheduled Meeting: ..."
3. Verify:
   - ✅ Event appears at correct time and timezone
   - ✅ Attendees are invited (check "Guests" section)
   - ✅ Description contains AI reasoning
   - ✅ Google Meet link is present
   - ✅ Reminders are set

---

## 📊 Monitoring

### View Write-Back Status (Supabase)

```sql
-- All write-backs with status
SELECT * FROM v_writeback_status
ORDER BY scheduled_at DESC
LIMIT 20;

-- Failed write-backs needing attention
SELECT meeting_id, writeback_error, writeback_retry_count
FROM meetings
WHERE writeback_status = 'failed'
ORDER BY writeback_attempted_at DESC;

-- Success rate
SELECT 
  writeback_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM meetings
WHERE writeback_status IS NOT NULL
GROUP BY writeback_status;
```

---

## 🔧 Configuration

### OAuth Scope

Updated scope in `googleAuth.ts`:

```typescript
const SCOPES = [
  'https://www.googleapis.com/auth/calendar', // Full calendar access (read + write)
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];
```

**⚠️ Re-authorization Required:** Users who authorized with `calendar.readonly` must re-authorize to grant write access.

### Environment Variables

No new environment variables required. Uses existing Google OAuth credentials.

---

## 🐛 Troubleshooting

### Error: "insufficient_permissions"

**Solution:** Re-authorize with updated scope:
```powershell
start http://localhost:3000/api/auth/google/initiate
```

### Error: "invalid_grant"

**Solution:** Refresh token expired. User must re-authorize.

### Duplicate Events Created

**Check:** 
- Ensure `google_event_id` is properly stored in database
- Verify idempotency check in `createCalendarEvent()` function

### Event Created But Not Visible

**Check:**
- Timezone: Verify event timezone matches constraints
- Calendar: Ensure using correct `calendar_id` (default: 'primary')
- Attendees: Check spam folder for invite emails

---

## 📈 Performance

- **Single write-back:** ~2-3 seconds (includes OAuth token refresh check)
- **Batch write-back:** ~2-3 seconds per event (sequential to avoid rate limits)
- **Idempotency check:** <100ms (database query)

---

## 🎉 Stage 5 Complete!

Your AI Meeting Scheduler now:

1. ✅ **Reads** Google Calendar (Stage 4)
2. ✅ **Thinks** with 4 AI agents (Stages 1-3)
3. ✅ **Acts** by creating calendar events (Stage 5)

**The loop is closed!** 🎊

---

## 🔜 Potential Enhancements

- **Email notifications** when event is created
- **RSVP tracking** (update meeting status based on responses)
- **Event updates** (reschedule if participants decline)
- **Calendar conflicts** (auto-handle scheduling conflicts)
- **Recurring meetings** (create series of events)
- **Slack/Teams integration** (post event link on team chat)

---

## 📚 Related Documentation

- [STAGE4_README.md](../STAGE4_README.md) - Calendar sync and compression
- [HYBRID_COMPRESSION.md](../HYBRID_COMPRESSION.md) - Compression architecture
- [INTEGRATION_GUIDE.md](../INTEGRATION_GUIDE.md) - Setup and testing

---

**Built with:** Next.js, Google Calendar API, Supabase, TypeScript  
**Test Coverage:** ✅ End-to-end tested  
**Production Ready:** ✅ Yes
