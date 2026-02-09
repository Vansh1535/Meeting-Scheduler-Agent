# Stage 4: Google Calendar + ScaleDown Integration

## Overview

Stage 4 connects the AI Meeting Scheduler to **real calendar data** using:
- **Google Calendar API** - Fetch 12 months of calendar history
- **ScaleDown AI** - Compress calendar data by 80% while preserving patterns
- **Supabase** - Persist OAuth tokens, events, and compressed patterns

**Result**: Python AI Brain uses real, compressed availability data instead of mock data for intelligent scheduling.

---

## Architecture

```
User → Next.js OAuth → Google Calendar API (12 months)
                    ↓
                ScaleDown AI (80% compression)
                    ↓
            Supabase (OAuth + compressed patterns)
                    ↓
            Python AI Brain (unchanged)
```

**Key Design Principles:**
- ✅ Python AI remains stateless and unchanged
- ✅ Next.js orchestrates all external integrations
- ✅ OAuth tokens encrypted at rest (production)
- ✅ Compressed data cached to minimize API calls

---

## Setup Instructions

### 1. Run Database Migration

Execute the Stage 4 migration in Supabase:

```bash
# Option A: Supabase SQL Editor
1. Open Supabase Dashboard → SQL Editor
2. Open migration file: supabase/migrations/002_google_calendar_scaledown.sql
3. Copy contents and paste into editor
4. Click "Run" (Ctrl+Enter)

# Option B: Command Line
psql "postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres" \
  < supabase/migrations/002_google_calendar_scaledown.sql
```

**Tables Created:**
- `user_accounts` - User profiles
- `oauth_tokens` - Google OAuth credentials
- `calendar_events` - Cached Google Calendar events
- `compressed_calendars` - ScaleDown compressed patterns
- `calendar_sync_history` - Sync operation tracking

### 2. Configure Google OAuth

**Step 1: Create Google Cloud Project**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "Meeting Scheduler AI"
3. Enable **Google Calendar API**:
   - APIs & Services → Library
   - Search "Google Calendar API"
   - Click "Enable"

**Step 2: Create OAuth 2.0 Credentials**
1. APIs & Services → Credentials
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Application type: "Web application"
4. Name: "Meeting Scheduler OAuth"
5. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   http://localhost:3001
   ```
6. **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/google/callback
   http://localhost:3001/api/auth/google/callback
   ```
7. Click "Create"
8. **Copy** Client ID and Client Secret

**Step 3: Update Environment Variables**

Edit `nextjs-orchestrator/.env.local`:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

### 3. Configure ScaleDown AI

**⚠️ TODO**: Replace with actual ScaleDown API credentials once available.

For now, the system uses **mock compression** when ScaleDown is disabled.

```env
# ScaleDown AI Configuration
SCALEDOWN_API_KEY=your-api-key-here
SCALEDOWN_API_URL=https://api.scaledown.ai/v1
SCALEDOWN_ENABLE=false  # Set to true when you have real credentials
```

---

## Usage Flow

### 1. User Connects Google Calendar

**Initiate OAuth Flow:**
```bash
# User visits this URL
http://localhost:3000/api/auth/google/initiate

# This redirects to Google consent screen
# After authorization, Google redirects back to:
http://localhost:3000/api/auth/google/callback?code=...

# Next.js exchanges code for tokens and stores in database
```

**What Happens:**
1. User authorizes calendar access
2. Google returns OAuth tokens
3. System creates `user_accounts` record
4. System stores tokens in `oauth_tokens` table
5. User redirected to `/?auth=success&user_id=...`

### 2. Sync Calendar & Compress

**Trigger Calendar Sync:**
```bash
curl -X POST http://localhost:3000/api/calendar/sync \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR_USER_ID_FROM_STEP_1",
    "force_refresh": false
  }'
```

**What Happens:**
1. ✅ Fetch 12 months of events from Google Calendar
2. ✅ Store events in `calendar_events` table (caching)
3. ✅ Send events to ScaleDown for compression
4. ✅ Store compressed patterns in `compressed_calendars` table
5. ✅ Log operation in `calendar_sync_history`

**Response:**
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

### 3. Schedule Meeting With Real Data

**Modified Scheduling Flow:**

The `/api/schedule` route now:
1. Accepts participant emails (not just user_ids)
2. Looks up compressed calendars for each participant
3. Transforms compressed data → Python AI format
4. Forwards to Python AI (unchanged)
5. Returns optimized meeting times

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "meeting_id": "real-data-meeting-001",
    "participant_emails": [
      "alice@example.com",
      "bob@example.com"
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
  }'
```

**What Happens:**
1. System looks up user IDs by email
2. Fetches compressed calendars from database
3. Transforms compressed data → `CompressedCalendarSummary`
4. Forwards to Python AI with real availability
5. Python AI generates ranked candidates
6. Results persisted to Supabase
7. Returns optimized meeting times

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/google/initiate` | GET | Start OAuth flow (redirects to Google) |
| `/api/auth/google/callback` | GET | Handle OAuth callback (stores tokens) |
| `/api/calendar/sync` | POST | Trigger calendar fetch + compression |
| `/api/calendar/sync?user_id=xxx` | GET | Get last sync status for user |
| `/api/schedule` | POST | Schedule meeting (now uses real data) |

---

## Testing

### Test OAuth Flow

```bash
# 1. Open browser
http://localhost:3000/api/auth/google/initiate

# 2. Authorize with your Google account

# 3. Check redirect URL for user_id
http://localhost:3000/?auth=success&user_id=abc-123

# 4. Verify in Supabase
SELECT * FROM user_accounts;
SELECT * FROM oauth_tokens;
```

### Test Calendar Sync

```bash
# Sync calendar for authenticated user
curl -X POST http://localhost:3000/api/calendar/sync \
  -H "Content-Type: application/json" \
  -d '{"user_id": "YOUR_USER_ID"}'

# Check sync status
curl "http://localhost:3000/api/calendar/sync?user_id=YOUR_USER_ID"

# Verify in Supabase
SELECT * FROM calendar_events LIMIT 10;
SELECT * FROM compressed_calendars WHERE is_active = true;
SELECT * FROM calendar_sync_history ORDER BY started_at DESC LIMIT 5;
```

### Test Scheduling With Real Data

```bash
# Schedule meeting with real compressed calendars
curl -X POST http://localhost:3000/api/schedule \
  -H "Content-Type: application/json" \
  -d @test_request_real_data.json

# Should return ranked candidates based on REAL availability
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    User Connects Calendar                │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────┐
│  1. GET /api/auth/google/initiate                         │
│     → Redirect to Google OAuth consent screen             │
└───────────────────┬──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────┐
│  2. User authorizes → Google redirects with code          │
└───────────────────┬──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────┐
│  3. GET /api/auth/google/callback?code=...                │
│     → Exchange code for tokens                            │
│     → Create user_accounts record                         │
│     → Store oauth_tokens                                  │
└───────────────────┬──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────┐
│  4. POST /api/calendar/sync                               │
│     → Fetch 12 months from Google Calendar                │
│     → Store in calendar_events (cache)                    │
│     → Send to ScaleDown AI for compression                │
│     → Store in compressed_calendars                       │
└───────────────────┬──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────┐
│  5. POST /api/schedule                                    │
│     → Lookup compressed calendars by email                │
│     → Transform → Python AI format                        │
│     → Forward to Python AI Brain                          │
│     → Return ranked candidates                            │
└──────────────────────────────────────────────────────────┘
```

---

## ScaleDown Integration Details

### What ScaleDown Does

ScaleDown compresses **12 months of raw calendar events** into:

1. **Availability Patterns** (Weekly recurring free/busy slots)
   ```json
   {
     "weekly_free_slots": [
       { "day_of_week": 2, "start_hour": 10, "duration_minutes": 60, "confidence": 0.92 }
     ],
     "weekly_busy_slots": [...]
   }
   ```

2. **Busy Probability Map** (Likelihood of being busy per time slot)
   ```json
   {
     "1": { "9": 0.4, "10": 0.7, "14": 0.8 },
     "2": { "9": 0.6, "10": 0.5, "14": 0.9 }
   }
   ```

3. **Meeting Density Scores** (Meeting frequency by day/time)
   ```json
   {
     "by_day_of_week": { "1": 75, "2": 85, "3": 80 },
     "by_hour_of_day": { "9": 60, "10": 85, "14": 90 }
   }
   ```

4. **Preferred Meeting Times** (Learned from history)
   ```json
   [
     { "day_of_week": 2, "start_hour": 10, "preference_score": 92, "rationale": "..." }
   ]
   ```

### Compression Benefits

- **80% data reduction**: 1200+ events → ~250 pattern entries
- **Fast lookups**: No need to query full event history
- **Smart patterns**: Learns availability preferences automatically
- **Privacy-preserving**: Event details stripped, only patterns remain

---

## Troubleshooting

### OAuth Errors

**"redirect_uri_mismatch"**
- Check Google Console redirect URIs match exactly
- Include both `http://localhost:3000` and `http://localhost:3001`
- Must include `/api/auth/google/callback` path

**"access_denied"**
- User declined authorization
- Have user restart flow: `/api/auth/google/initiate`

### Calendar Sync Errors

**"User has not connected Google Calendar"**
- Complete OAuth flow first: `/api/auth/google/initiate`
- Check `oauth_tokens` table for valid tokens

**"Token expired"**
- System auto-refreshes tokens
- If refresh fails, user must re-authorize

**"No events fetched"**
- Check Google Calendar has events in past 12 months
- Verify OAuth scopes include `calendar.readonly`

### ScaleDown Errors

**"SCALEDOWN_API_KEY not configured"**
- System will use mock compression as fallback
- Set `SCALEDOWN_ENABLE=false` to suppress warnings
- Contact ScaleDown for API credentials

---

## Security Considerations

### OAuth Token Storage

⚠️ **Current Implementation**: Tokens stored in plain text in Supabase.

**Production TODO**:
- Implement application-level encryption (AES-256)
- Use Supabase Vault for sensitive data
- Rotate encryption keys regularly
- See: https://supabase.com/docs/guides/database/vault

### API Security

**Current**: No authentication on API routes (development only)

**Production TODO**:
- Add NextAuth.js or similar
- Require user authentication for all routes
- Implement rate limiting
- Add API key validation

---

## Next Steps

### Completed ✅
- Google OAuth flow
- Calendar event fetching
- ScaleDown compression
- Database persistence
- Python AI integration

### Remaining 📋
1. **Frontend UI** - Build user interface for OAuth and scheduling
2. **Automated Sync** - Cron job for periodic calendar refresh
3. **Multi-calendar Support** - Fetch from multiple Google Calendars
4. **Token Encryption** - Secure production OAuth storage
5. **Error Handling** - Graceful degradation when services unavailable

---

## File Structure

```
nextjs-orchestrator/
├── src/
│   ├── app/
│   │   └── api/
│   │       ├── auth/google/
│   │       │   ├── initiate/route.ts   # Start OAuth
│   │       │   └── callback/route.ts   # Handle callback
│   │       ├── calendar/
│   │       │   └── sync/route.ts       # Calendar sync
│   │       └── schedule/
│   │           └── route.ts            # Modified for real data
│   ├── lib/
│   │   ├── googleAuth.ts               # OAuth token management
│   │   ├── googleCalendar.ts           # Fetch calendar events
│   │   ├── scaledown.ts                # ScaleDown compression
│   │   ├── calendarSync.ts             # Sync orchestration
│   │   └── compressedCalendarTransformer.ts # Data transformation
│   └── types/
│       └── scheduling.ts               # TypeScript types
└── .env.local                          # Configuration

supabase/
└── migrations/
    └── 002_google_calendar_scaledown.sql  # Stage 4 schema
```

---

## Support

- **Google OAuth**: https://developers.google.com/identity/protocols/oauth2
- **Google Calendar API**: https://developers.google.com/calendar
- **ScaleDown AI**: https://scaledown.ai/ (TODO: Add docs link)
- **Supabase**: https://supabase.com/docs
