# Two-User Real Scheduling - Quick Reference

## Setup Checklist

### ✅ Prerequisites
- [ ] Frontend running (`npm run dev` in `frontend/`)
- [ ] Python service running (`python main.py` in `python-service/`)
- [ ] Supabase configured (`.env.local` with credentials)
- [ ] Google OAuth configured (client ID + secret)

### ✅ User 1: user1@example.com
- [ ] Complete Google OAuth (browser login)
- [ ] Calendar sync completed
- [ ] Compressed calendar exists in database
- [ ] Verify: Check `/api/auth/google/status/[userId]`

### ✅ User 2: user2@example.com
- [ ] Complete Google OAuth (browser login)
- [ ] Calendar sync completed
- [ ] Compressed calendar exists in database
- [ ] Verify: Check `/api/auth/google/status/[userId]`

## Quick Start

### 1. Run Setup Script
```powershell
.\test\setup_two_users.ps1
```

### 2. Test Scheduling API
```powershell
.\test\test_two_user_scheduling.ps1
```

### 3. Use Frontend UI
Navigate to: `http://localhost:3000/quick-schedule`

Enter:
- **Title:** "Project Discussion"
- **Duration:** 60 minutes
- **Participants:** `user1@example.com, user2@example.com`
- **✓ Show Analysis** (to see AI insights)

## How It Works (Simplified)

```
User enters participants → Frontend looks up compressed calendars
                                      ↓
                          Python AI agents process:
                          • Find mutually available slots
                          • Score by preferences
                          • Rank by optimization
                                      ↓
                          Return top 10 candidates
                                      ↓
                          Display on frontend with:
                          • Scores & breakdowns
                          • AI reasoning
                          • Analytics
                                      ↓
                          User selects → Event created in both calendars
```

## Key Files

### Frontend
- **Schedule API:** `frontend/app/api/schedule/route.ts`
- **Participant Enrichment:** `frontend/lib/participantEnrichment.ts`
- **Calendar Sync:** `frontend/lib/calendarSync.ts`
- **UI:** `frontend/app/quick-schedule/page.tsx`

### Python Service
- **Main Entry:** `python-service/main.py`
- **Availability Agent:** `python-service/agents/availability_agent.py`
- **Preference Agent:** `python-service/agents/preference_agent.py`
- **Optimization Agent:** `python-service/agents/optimization_agent.py`

### Database Tables
- `user_accounts` - User profiles
- `oauth_tokens` - Google credentials
- `calendar_events` - Raw calendar events
- `compressed_calendars` - ScaleDown compressed patterns
- `meetings` - Meeting requests
- `meeting_candidates` - Ranked time slots

## Data Flow

### 1. Calendar Sync (One-time setup per user)
```
Google Calendar API
       ↓ (fetch 12 months)
calendar_events table
       ↓
ScaleDown compression
       ↓
compressed_calendars table
```

### 2. Scheduling Request (Each meeting)
```
User input (emails + duration)
       ↓
Look up compressed_calendars
       ↓
Transform to AI format
       ↓
Python AI agents process
       ↓
Return ranked candidates
       ↓
Save to meetings + meeting_candidates
       ↓
Display on frontend
```

## Sample Request

```json
{
  "meeting_id": "test_2user_20260218",
  "participant_emails": [
    "user1@example.com",
    "user2@example.com"
  ],
  "constraints": {
    "duration_minutes": 60,
    "earliest_date": "2026-02-20T00:00:00Z",
    "latest_date": "2026-03-05T23:59:59Z",
    "timezone": "America/New_York",
    "working_hours": {
      "start_hour": 9,
      "end_hour": 18
    },
    "allowed_days": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    "buffer_minutes": 15
  },
  "preferences": {
    "max_candidates": 10
  }
}
```

## Sample Response

```json
{
  "meeting_id": "test_2user_20260218",
  "success": true,
  "candidates": [
    {
      "rank": 1,
      "slot_start": "2026-02-20T15:00:00Z",
      "slot_end": "2026-02-20T16:00:00Z",
      "final_score": 92.5,
      "availability_score": 10.0,
      "preference_score": 8.5,
      "optimization_score": 9.0,
      "all_participants_available": true,
      "reasoning": "High score due to mutual availability and preference alignment..."
    }
  ],
  "analytics": {
    "estimated_time_saved_minutes": 45,
    "coordination_overhead_reduction_pct": 75.0,
    "candidates_without_conflicts": 8
  }
}
```

## AI Agent Details

### Availability Agent
- **Input:** Participants + constraints
- **Process:** 
  - Generate 200-300 candidate slots
  - Check against both calendars
  - Apply buffer times
- **Output:** ~50-100 available slots

### Preference Agent
- **Input:** Available slots + participant preferences
- **Process:**
  - Score (0-10) based on:
    - Preferred meeting times
    - Historical patterns
    - Buffer preferences
    - Day preferences
- **Output:** Preference score per slot

### Optimization Agent
- **Input:** Slots with scores
- **Process:**
  - Calculate fragmentation
  - Measure conflict proximity
  - Estimate time savings
  - Composite scoring (weighted)
- **Output:** Top 10 ranked candidates

## Troubleshooting

### No candidates found
- ✅ Both users completed OAuth?
- ✅ Calendars synced recently?
- ✅ Date range reasonable?
- ✅ Working hours match availability?

### Frontend errors
- ✅ Check browser console (F12)
- ✅ Verify API endpoints responding
- ✅ Check `.env.local` configuration

### Backend errors
- ✅ Python service logs
- ✅ Check Supabase connection
- ✅ Verify ScaleDown endpoint

### Database issues
- ✅ Run `.\test\check_database.ps1`
- ✅ Check table schema matches
- ✅ Verify foreign key constraints

## Testing Commands

```powershell
# Setup both users
.\test\setup_two_users.ps1

# Test scheduling
.\test\test_two_user_scheduling.ps1

# Check OAuth status
.\test\test_oauth_status.ps1

# Resync calendars
.\test\resync_calendar.ps1

# Check database
.\test\check_database.ps1

# Start all services
.\test\start_all_services.ps1
```

## URLs

- **Frontend:** http://localhost:3000
- **Quick Schedule:** http://localhost:3000/quick-schedule
- **Dashboard:** http://localhost:3000/dashboard
- **Python Service:** http://localhost:8000
- **Python Health:** http://localhost:8000/health

## Environment Variables

```env
# Frontend .env.local
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
PYTHON_SERVICE_URL=http://localhost:8000
SCALEDOWN_API_URL=your_scaledown_url
SCALEDOWN_API_KEY=your_api_key
```

## Support

For detailed explanation of how the system works, see:
- `docs/MULTI_USER_SCHEDULING_EXPLAINED.md`

For setup instructions:
- Run `.\test\setup_two_users.ps1`

For architecture details:
- `docs/ARCHITECTURE.md`
