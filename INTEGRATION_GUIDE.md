# 🚀 Stage 4 Integration Guide

Complete step-by-step instructions to integrate Google Calendar + ScaleDown with your AI Meeting Scheduler.

---

## Overview

**What we're integrating:**
1. Google OAuth → Connect user calendars
2. Google Calendar API → Fetch 12 months of events
3. ScaleDown AI → Compress calendar data by 80%
4. Modified `/api/schedule` → Use real compressed calendars

**Result:** Your Python AI now schedules meetings based on REAL calendar availability instead of mock data!

---

## Step 1: Database Migration ✅

Run the Stage 4 schema in Supabase:

```bash
# Navigate to Supabase Dashboard
https://supabase.com/dashboard/project/mxvojbnlwxkfkzuojayz

# Go to: SQL Editor → New Query
# Copy and paste contents from:
supabase/migrations/002_google_calendar_scaledown.sql

# Click "Run" or press Ctrl+Enter
```

**Verify tables created:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_accounts', 'oauth_tokens', 'calendar_events', 'compressed_calendars', 'calendar_sync_history');
```

Should return 5 rows.

---

## Step 2: Configure Google OAuth 🔐

### 2.1 Create Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Click "Select a project" → "New Project"
3. Project name: **Meeting Scheduler AI**
4. Click "Create"

### 2.2 Enable Google Calendar API

1. In your new project, go to: **APIs & Services** → **Library**
2. Search: **"Google Calendar API"**
3. Click on it → Click **"Enable"**

### 2.3 Create OAuth 2.0 Credentials

1. Go to: **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
3. If prompted, configure consent screen:
   - User Type: **External**
   - App name: **Meeting Scheduler AI**
   - User support email: **your email**
   - Developer email: **your email**
   - Scopes: Add **calendar.readonly**
   - Test users: Add **your Gmail address**
   - Click **"Save and Continue"**

4. Back to Create OAuth Client:
   - Application type: **Web application**
   - Name: **Meeting Scheduler OAuth**
   
5. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   http://localhost:3001
   ```

6. **Authorized redirect URIs:**
   ```
   http://localhost:3000/api/auth/google/callback
   http://localhost:3001/api/auth/google/callback
   ```

7. Click **"Create"**

8. **COPY THE CREDENTIALS:**
   - Client ID: `something.apps.googleusercontent.com`
   - Client Secret: `something`

### 2.4 Update Environment Variables

Edit `nextjs-orchestrator/.env.local`:

```env
# Add these lines (replace with your actual credentials):
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# ScaleDown (optional - will use mock compression if disabled)
SCALEDOWN_API_KEY=your-api-key-when-available
SCALEDOWN_API_URL=https://api.scaledown.ai/v1
SCALEDOWN_ENABLE=false
```

---

## Step 3: Start Services 🚀

### 3.1 Start Python AI Brain

```powershell
cd python-service
python main.py

# Should see:
# INFO:     Uvicorn running on http://127.0.0.1:8000
```

### 3.2 Start Next.js Orchestrator

```powershell
cd nextjs-orchestrator
npm run dev

# Should see:
# ✓ Ready on http://localhost:3001
```

---

## Step 4: Connect Google Calendar 📅

### 4.1 Initiate OAuth Flow

Open in browser:
```
http://localhost:3001/api/auth/google/initiate
```

**What happens:**
1. Redirects to Google sign-in
2. Shows consent screen (allow calendar access)
3. Redirects back to your app with authorization code
4. System exchanges code for OAuth tokens
5. Redirects to: `http://localhost:3001/?auth=success&user_id=abc-123-xyz`

**⚠️ COPY THE USER_ID from the URL!** You'll need it for next steps.

### 4.2 Verify OAuth in Database

Check Supabase:

```sql
-- User account created
SELECT id, email, display_name, calendar_sync_enabled 
FROM user_accounts;

-- OAuth tokens stored
SELECT user_id, provider, expires_at, scopes 
FROM oauth_tokens;
```

---

## Step 5: Sync Calendar & Compress 🤖

### 5.1 Trigger Calendar Sync

Replace `YOUR_USER_ID` with the user_id from Step 4.1:

```powershell
curl -X POST http://localhost:3001/api/calendar/sync `
  -H "Content-Type: application/json" `
  -d '{"user_id": "YOUR_USER_ID", "force_refresh": true}'
```

**What happens:**
1. ✅ Fetches 12 months of events from Google Calendar
2. ✅ Stores in `calendar_events` table (cache)
3. ✅ Sends to ScaleDown for compression (or uses mock)
4. ✅ Stores compressed patterns in `compressed_calendars` table
5. ✅ Logs operation in `calendar_sync_history`

**Expected Response:**
```json
{
  "success": true,
  "sync_id": "uuid-here",
  "events_fetched": 245,
  "events_added": 240,
  "events_updated": 5,
  "compression_completed": true,
  "compression_ratio": 0.80,
  "duration_ms": 3500
}
```

### 5.2 Verify Sync in Database

```sql
-- Raw calendar events
SELECT COUNT(*) as total_events, 
       MIN(start_time) as earliest,
       MAX(end_time) as latest
FROM calendar_events;

-- Compressed patterns
SELECT user_id, 
       source_event_count,
       compression_ratio,
       period_start,
       period_end,
       is_active
FROM compressed_calendars
WHERE is_active = true;

-- Sync history
SELECT id, 
       status, 
       events_fetched, 
       scaledown_called,
       started_at,
       total_duration_ms
FROM calendar_sync_history
ORDER BY started_at DESC
LIMIT 1;
```

---

## Step 6: Schedule Meeting with Real Data 🎯

### 6.1 Get Connected User Emails

```sql
SELECT email FROM user_accounts WHERE calendar_sync_enabled = true;
```

### 6.2 Create Test Request

Create `test_request_stage4.json`:

```json
{
  "meeting_id": "stage4-real-calendar-test-001",
  "participant_emails": [
    "your-email@gmail.com",
    "another-user@gmail.com"
  ],
  "constraints": {
    "duration_minutes": 60,
    "earliest_date": "2026-02-10T00:00:00Z",
    "latest_date": "2026-02-20T00:00:00Z",
    "working_hours_start": 9,
    "working_hours_end": 17,
    "allowed_days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "buffer_minutes": 15,
    "timezone": "America/New_York",
    "max_candidates": 10
  }
}
```

### 6.3 Request Meeting Times

```powershell
curl -X POST http://localhost:3001/api/schedule `
  -H "Content-Type: application/json" `
  -d (Get-Content test_request_stage4.json -Raw)
```

**What happens:**
1. ✅ System looks up users by email
2. ✅ Fetches compressed calendars from Supabase
3. ✅ Transforms compressed data → Python AI format
4. ✅ **Forwards enriched request to Python AI**
5. ✅ **Python AI uses REAL availability** to rank candidates
6. ✅ Returns optimized meeting times
7. ✅ Persists results to Supabase

**Expected Response:**
```json
{
  "meeting_id": "stage4-real-calendar-test-001",
  "candidates": [
    {
      "slot": {
        "start": "2026-02-11T14:00:00Z",
        "end": "2026-02-11T15:00:00Z",
        "timezone": "America/New_York"
      },
      "score": 98.5,
      "availability_score": 100.0,
      "preference_score": 95.0,
      "optimization_score": 100.0,
      "conflicts": [],
      "all_participants_available": true,
      "reasoning": "Excellent match based on real calendar history..."
    }
  ],
  "success": true,
  "processing_time_ms": 2.5
}
```

---

## Step 7: Verify End-to-End 🔍

### 7.1 Check Logs

**Next.js terminal should show:**
```
📧 Stage 4: Enriching 2 participants with real calendar data...
📊 Using compressed calendar for user@gmail.com
📊 Using compressed calendar for user2@gmail.com
✅ Enriched request with 2 participants
   Real calendars: 2
   Mock calendars: 0
POST /api/schedule 200 in 125ms
✅ Successfully persisted scheduling session: stage4-real-calendar-test-001
```

### 7.2 Verify in Database

```sql
-- Meeting persisted
SELECT * FROM meetings 
WHERE meeting_id = 'stage4-real-calendar-test-001';

-- Candidates ranked
SELECT rank, slot_start, slot_end, final_score, reasoning
FROM meeting_candidates mc
JOIN meetings m ON mc.meeting_id = m.id
WHERE m.meeting_id = 'stage4-real-calendar-test-001'
ORDER BY rank;
```

---

## Testing Scenarios

### Scenario 1: Both Users Have Compressed Calendars ✅
```json
{
  "participant_emails": ["user1@gmail.com", "user2@gmail.com"]
}
```
**Result:** Uses 100% real calendar data

### Scenario 2: One User Missing Calendar ⚠️
```json
{
  "participant_emails": ["user1@gmail.com", "unknown@example.com"]
}
```
**Result:** Uses real data for user1, mock data for unknown user

### Scenario 3: Legacy Format (Backward Compatibility) ✅
```json
{
  "participants": [
    { "user_id": "...", "email": "...", "calendar_summary": {...} }
  ]
}
```
**Result:** Uses provided data (no calendar lookup)

---

## Troubleshooting

### OAuth Errors

**"redirect_uri_mismatch"**
```
Fix: Check Google Console → Credentials → OAuth Client
Ensure redirect URIs include:
- http://localhost:3001/api/auth/google/callback
```

**"access_denied"**
```
User declined authorization
Solution: Restart flow at /api/auth/google/initiate
```

### Calendar Sync Errors

**"User has not connected Google Calendar"**
```
Solution: Complete OAuth flow first (Step 4)
```

**"No events fetched"**
```
Possible causes:
1. Calendar is empty
2. OAuth scope missing calendar.readonly
3. Token expired (auto-refreshes, may need re-auth)
```

### Scheduling Errors

**"without_calendars" warning in logs**
```
⚠️  2 participants missing compressed calendars
Solution: 
1. Check user emails are correct
2. Run calendar sync for missing users
3. System will use mock data as fallback (still works)
```

**Python AI receives mock data**
```
Check logs for:
"⚠️  No compressed calendar for email, using mock data"

Solution:
1. Verify compressed_calendars table has data
2. Check is_active = true
3. Re-run calendar sync if needed
```

---

## Success Checklist ✅

- [ ] Database migration completed (5 tables created)
- [ ] Google OAuth configured (Client ID + Secret)
- [ ] Both services running (Python + Next.js)
- [ ] OAuth flow completed (user_id obtained)
- [ ] Calendar synced (events + compression)
- [ ] Meeting scheduled with real data
- [ ] Logs show "Real calendars: X"
- [ ] Results persisted in Supabase

---

## Next Steps

Once integration is working:

1. **Add More Users**: Repeat Step 4-5 for additional participants
2. **Automated Sync**: Set up cron job for daily calendar refresh
3. **Frontend UI**: Build user interface for OAuth + scheduling
4. **Production Deploy**: 
   - Implement token encryption
   - Configure production OAuth redirect URIs
   - Set up real ScaleDown API credentials

---

## Quick Reference

**Start OAuth Flow:**
```
http://localhost:3001/api/auth/google/initiate
```

**Sync Calendar:**
```powershell
curl -X POST http://localhost:3001/api/calendar/sync `
  -H "Content-Type: application/json" `
  -d '{"user_id": "YOUR_USER_ID"}'
```

**Schedule (New Format):**
```powershell
curl -X POST http://localhost:3001/api/schedule `
  -H "Content-Type: application/json" `
  -d @test_request_stage4.json
```

**Check Sync Status:**
```
http://localhost:3001/api/calendar/sync?user_id=YOUR_USER_ID
```

---

## Support

- **Stage 4 Details**: See `STAGE4_README.md`
- **Database Schema**: See `supabase/migrations/002_google_calendar_scaledown.sql`
- **Google OAuth**: https://developers.google.com/identity/protocols/oauth2
- **Google Calendar API**: https://developers.google.com/calendar

