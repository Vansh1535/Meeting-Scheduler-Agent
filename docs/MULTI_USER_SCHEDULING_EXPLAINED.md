# Multi-User Real Scheduling - Complete Explanation

## Overview

This document explains how the system handles **real 2-person scheduling** using actual Google Calendar data, AI agents, and ScaleDown compression.

**Test Users:**
- User 1: `42vanshlilani@gmail.com`
- User 2: `vanshlilani15@gmail.com`

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER FLOW                                    │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  1. GOOGLE OAUTH & CALENDAR SYNC                                    │
│  ─────────────────────────────────                                  │
│  • User authenticates with Google                                   │
│  • System fetches 12 months of calendar events                      │
│  • Events stored in database (calendar_events table)                │
│  • Raw data sent to ScaleDown for compression                       │
│  • Compressed patterns saved (compressed_calendars table)           │
│                                                                       │
│  Files involved:                                                     │
│  - frontend/lib/googleAuth.ts                                       │
│  - frontend/lib/googleCalendar.ts                                   │
│  - frontend/lib/calendarSync.ts                                     │
│  - frontend/lib/scaledown.ts                                        │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  2. SCHEDULING REQUEST                                              │
│  ───────────────────────                                            │
│  User goes to /quick-schedule page and enters:                      │
│  • Meeting title: "Project Discussion"                              │
│  • Duration: 60 minutes                                              │
│  • Participants: "42vanshlilani@gmail.com, vanshlilani15@gmail.com"│
│  • Date range: Next 14 days                                         │
│  • Enables "Show Analysis" for AI insights                          │
│                                                                       │
│  Files involved:                                                     │
│  - frontend/app/quick-schedule/page.tsx                            │
│  - frontend/components/quick-schedule/form.tsx                      │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  3. PARTICIPANT ENRICHMENT (Frontend Backend)                       │
│  ────────────────────────────────────────────                       │
│  Location: frontend/app/api/schedule/route.ts                      │
│                                                                       │
│  Process:                                                            │
│  1. Receive participant emails from frontend                        │
│  2. For each email:                                                 │
│     a. Lookup user in database:                                     │
│        SELECT * FROM user_accounts WHERE email = '...'              │
│     b. Fetch compressed calendar:                                   │
│        SELECT * FROM compressed_calendars                           │
│        WHERE user_id = '...' AND is_active = true                   │
│     c. Transform compressed data to AI format:                      │
│        {                                                             │
│          user_id: "...",                                            │
│          email: "...",                                              │
│          name: "...",                                               │
│          calendar_summary: {                                        │
│            data_compressed: true,                                   │
│            busy_slots: [...],  // Extracted from compressed data    │
│            preferences: {                                           │
│              preferred_meeting_times: [...],                        │
│              typical_work_hours: {...},                             │
│              buffer_minutes: 15,                                    │
│              avoids_back_to_back: true                              │
│            }                                                         │
│          }                                                           │
│        }                                                             │
│                                                                       │
│  Files involved:                                                     │
│  - frontend/lib/participantEnrichment.ts                           │
│  - frontend/lib/compressedCalendarTransformer.ts                    │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  4. AI AGENT PROCESSING (Python Service)                            │
│  ──────────────────────────────────────                             │
│  Location: python-service/main.py                                   │
│                                                                       │
│  POST /schedule → schedule_meeting()                                │
│                                                                       │
│  ┌─────────────────────────────────────────────┐                   │
│  │ 🤖 AVAILABILITY AGENT                        │                   │
│  │ File: agents/availability_agent.py          │                   │
│  │ ─────────────────────────────────────────   │                   │
│  │ Input: Participants + constraints            │                   │
│  │                                               │                   │
│  │ Process:                                      │                   │
│  │ 1. Generate candidate slots:                 │                   │
│  │    • Start date → End date                   │                   │
│  │    • 9 AM - 6 PM (work hours)                │                   │
│  │    • 30-min increments                       │                   │
│  │    • ~200-300 slots total                    │                   │
│  │                                               │                   │
│  │ 2. Check each slot against BOTH calendars:   │                   │
│  │    FOR each slot:                            │                   │
│  │      FOR each participant:                   │                   │
│  │        • Check compressed busy_slots         │                   │
│  │        • Apply buffer time (15 min)          │                   │
│  │        • Mark conflicts                      │                   │
│  │                                               │                   │
│  │ 3. Filter to only mutually available:        │                   │
│  │    • Both users free                         │                   │
│  │    • No conflicts                            │                   │
│  │    • Buffer respected                        │                   │
│  │                                               │                   │
│  │ Output: ~50-100 available slots              │                   │
│  └─────────────────────────────────────────────┘                   │
│                      ↓                                               │
│  ┌─────────────────────────────────────────────┐                   │
│  │ 🎯 PREFERENCE AGENT                          │                   │
│  │ File: agents/preference_agent.py            │                   │
│  │ ─────────────────────────────────────────   │                   │
│  │ Input: Available slots + participant prefs   │                   │
│  │                                               │                   │
│  │ For each slot, score (0-10) based on:        │                   │
│  │ • Preferred meeting times                    │                   │
│  │   - User 1 prefers mornings? +score          │                   │
│  │   - User 2 prefers afternoons? +score        │                   │
│  │ • Typical work patterns                      │                   │
│  │   - Matches historical patterns? +score      │                   │
│  │ • Buffer preferences                         │                   │
│  │   - Respects spacing needs? +score           │                   │
│  │ • Day preferences                            │                   │
│  │   - Preferred days of week? +score           │                   │
│  │                                               │                   │
│  │ Aggregate across all participants:           │                   │
│  │ • Required participants: weighted higher     │                   │
│  │ • Optional participants: lower weight        │                   │
│  │                                               │                   │
│  │ Output: Preference score per slot            │                   │
│  └─────────────────────────────────────────────┘                   │
│                      ↓                                               │
│  ┌─────────────────────────────────────────────┐                   │
│  │ ⚡ OPTIMIZATION AGENT                        │                   │
│  │ File: agents/optimization_agent.py          │                   │
│  │ ─────────────────────────────────────────   │                   │
│  │ Input: Slots with availability & preference  │                   │
│  │                                               │                   │
│  │ Calculate optimization metrics:              │                   │
│  │                                               │                   │
│  │ 1. Calendar Fragmentation:                   │                   │
│  │    • Does this reduce calendar gaps?         │                   │
│  │    • Consolidates meeting blocks?            │                   │
│  │                                               │                   │
│  │ 2. Conflict Proximity:                       │                   │
│  │    • How far from nearest conflict?          │                   │
│  │    • Avoid near-misses                       │                   │
│  │                                               │                   │
│  │ 3. Time Savings:                             │                   │
│  │    • Reduces context switching?              │                   │
│  │    • Minimizes coordination overhead         │                   │
│  │                                               │                   │
│  │ 4. Composite Scoring:                        │                   │
│  │    • Availability: 35%                       │                   │
│  │    • Preference: 25%                         │                   │
│  │    • Conflict Proximity: 20%                 │                   │
│  │    • Fragmentation: 15%                      │                   │
│  │    • Optimization: 5%                        │                   │
│  │                                               │                   │
│  │ Output: Ranked candidates (top 10)           │                   │
│  └─────────────────────────────────────────────┘                   │
│                      ↓                                               │
│  ┌─────────────────────────────────────────────┐                   │
│  │ 🤝 NEGOTIATION AGENT (if needed)             │                   │
│  │ File: agents/negotiation_agent.py           │                   │
│  │ ─────────────────────────────────────────   │                   │
│  │ Handles edge cases:                          │                   │
│  │ • No perfect matches → suggest compromises   │                   │
│  │ • Conflicting preferences → balance          │                   │
│  │ • Generate human-readable reasoning          │                   │
│  │                                               │                   │
│  │ Output: Reasoning text for each candidate    │                   │
│  └─────────────────────────────────────────────┘                   │
│                                                                       │
│  Final Response:                                                     │
│  {                                                                   │
│    "meeting_id": "...",                                             │
│    "success": true,                                                 │
│    "candidates": [                                                  │
│      {                                                               │
│        "slot_start": "2026-02-20T10:00:00Z",                       │
│        "slot_end": "2026-02-20T11:00:00Z",                         │
│        "final_score": 92.5,                                         │
│        "availability_score": 10.0,                                  │
│        "preference_score": 8.5,                                     │
│        "optimization_score": 9.0,                                   │
│        "reasoning": "High score: Both available, matches morning..."│
│      },                                                              │
│      ...top 10 candidates                                           │
│    ],                                                                │
│    "analytics": {...}                                               │
│  }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  5. PERSISTENCE TO DATABASE                                         │
│  ────────────────────────────────                                   │
│  Location: frontend/lib/schedulingPersistence.ts                   │
│                                                                       │
│  Tables updated:                                                     │
│                                                                       │
│  1. meetings                                                         │
│     • meeting_id, participant_count, duration                       │
│     • success, total_candidates, processing_time                    │
│     • status: 'pending'                                             │
│                                                                       │
│  2. meeting_candidates                                              │
│     • All 10 candidates with scores                                 │
│     • slot_start, slot_end, final_score                            │
│     • reasoning, rank                                               │
│                                                                       │
│  3. participant_availability                                        │
│     • Per-user insights                                             │
│     • busy slots, preferences, patterns                             │
│                                                                       │
│  4. score_breakdowns                                                │
│     • Detailed score components                                     │
│     • availability_factor, preference_factor, etc.                  │
│                                                                       │
│  5. scheduling_analytics                                            │
│     • estimated_time_saved_minutes                                  │
│     • coordination_overhead_reduction_pct                           │
│     • conflict_rate                                                 │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  6. FRONTEND DISPLAY                                                │
│  ─────────────────────                                              │
│  Location: frontend/components/smart-schedule/candidates-board.tsx │
│                                                                       │
│  User Interface shows:                                              │
│                                                                       │
│  ╔════════════════════════════════════════════════╗                │
│  ║  Meeting Time Candidates                       ║                │
│  ╚════════════════════════════════════════════════╝                │
│                                                                       │
│  ┌──────────────────────────────────────────────┐                  │
│  │ 🥇 Rank 1 - Score: 92.5/100                  │                  │
│  │                                               │                  │
│  │ Thursday, Feb 20, 2026                       │                  │
│  │ 10:00 AM - 11:00 AM (1 hour)                │                  │
│  │                                               │                  │
│  │ ✅ Both participants available               │                  │
│  │ ⭐ High preference match                     │                  │
│  │ 📊 Minimal fragmentation                     │                  │
│  │                                               │                  │
│  │ Score Breakdown:                              │                  │
│  │ • Availability: 10.0/10 (100%)              │                  │
│  │ • Preference: 8.5/10 (85%)                  │                  │
│  │ • Optimization: 9.0/10 (90%)                │                  │
│  │                                               │                  │
│  │ AI Reasoning:                                 │                  │
│  │ "High score due to mutual availability and   │                  │
│  │  both participants prefer morning meetings.  │                  │
│  │  This slot minimizes calendar fragmentation │                  │
│  │  and respects buffer time preferences."      │                  │
│  │                                               │                  │
│  │ [Schedule This Time] [View Details]          │                  │
│  └──────────────────────────────────────────────┘                  │
│                                                                       │
│  ... (9 more candidates)                                            │
│                                                                       │
│  Analytics Summary:                                                  │
│  • Estimated time saved: 45 minutes                                │
│  • Coordination overhead reduction: 75%                             │
│  • Candidates without conflicts: 8/10                              │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  7. WRITE BACK TO GOOGLE CALENDAR                                   │
│  ──────────────────────────────────                                 │
│  Location: frontend/lib/googleCalendarWrite.ts                     │
│                                                                       │
│  When user clicks "Schedule This Time":                             │
│  1. Create event in organizer's calendar                            │
│  2. Add attendees (both users)                                      │
│  3. Send calendar invitations                                       │
│  4. Update meetings table:                                          │
│     • status: 'scheduled'                                           │
│     • selected_candidate_id: <selected_candidate>                   │
│     • google_event_id: <created_event_id>                           │
│     • writeback_status: 'created'                                   │
│  5. Verify write-back success                                       │
│                                                                       │
│  Files involved:                                                     │
│  - frontend/lib/googleCalendarWrite.ts                             │
│  - frontend/lib/write-back-verification.ts                         │
│  - frontend/app/api/calendar/write-back/route.ts                   │
└─────────────────────────────────────────────────────────────────────┘

## Real Data Flow Example

### Example: Scheduling between 2 users

**User 1: 42vanshlilani@gmail.com**
- Calendar has: 150 events from past 12 months
- Compressed to: 30KB of patterns
- Preferences learned:
  - Prefers morning meetings (9-11 AM)
  - Avoids back-to-back meetings (15 min buffer)
  - Peak days: Tuesday, Thursday
  - Average meeting: 45 minutes

**User 2: vanshlilani15@gmail.com**
- Calendar has: 200 events from past 12 months
- Compressed to: 40KB of patterns
- Preferences learned:
  - Prefers afternoon meetings (2-4 PM)
  - OK with back-to-back meetings
  - Peak days: Monday, Wednesday, Friday
  - Average meeting: 30 minutes

**Scheduling Request:**
- Duration: 60 minutes
- Date range: Feb 20-25, 2026
- Both users required

**AI Processing:**
1. **Availability Agent finds 43 mutually free slots**
   - Excludes all busy times for both users
   - Applies 15-min buffer for User 1

2. **Preference Agent scores each slot:**
   - 10 AM slot: 8.5/10 (compromise - morning for User 1, but User 2's calendar shows good attendance)
   - 2 PM slot: 7.0/10 (User 2 preference, but not User 1's best)
   - 11 AM slot: 9.0/10 (best compromise)

3. **Optimization Agent ranks:**
   - Rank 1: Thursday 11 AM (score: 92.5)
   - Rank 2: Tuesday 10:30 AM (score: 89.0)
   - Rank 3: Thursday 2 PM (score: 85.0)

**Result:** User selects Thursday 11 AM, system creates event in both calendars automatically.

## Key Benefits

### 1. Real Calendar Data
- No hardcoded availability
- Actual event patterns from Google Calendar
- Historical preference learning

### 2. ScaleDown Compression
- 12 months of events → Compact patterns
- 80%+ size reduction
- Fast AI processing (milliseconds vs seconds)

### 3. Intelligent Insights
- Learns from actual meeting history
- Adapts to individual preferences
- Predicts best times for all participants

### 4. Automated Workflow
- No manual coordination
- 75% reduction in scheduling time
- Seamless write-back to calendars

## Code Locations Summary

| Component | File Location |
|-----------|---------------|
| OAuth Flow | `frontend/lib/googleAuth.ts` |
| Calendar Fetch | `frontend/lib/googleCalendar.ts` |
| Calendar Sync | `frontend/lib/calendarSync.ts` |
| ScaleDown Integration | `frontend/lib/scaledown.ts` |
| Participant Enrichment | `frontend/lib/participantEnrichment.ts` |
| Schedule API Route | `frontend/app/api/schedule/route.ts` |
| Availability Agent | `python-service/agents/availability_agent.py` |
| Preference Agent | `python-service/agents/preference_agent.py` |
| Optimization Agent | `python-service/agents/optimization_agent.py` |
| Negotiation Agent | `python-service/agents/negotiation_agent.py` |
| Main Python Entry | `python-service/main.py` |
| Persistence Logic | `frontend/lib/schedulingPersistence.ts` |
| Candidates UI | `frontend/components/smart-schedule/candidates-board.tsx` |
| Quick Schedule Page | `frontend/app/quick-schedule/page.tsx` |
| Write-Back Logic | `frontend/lib/googleCalendarWrite.ts` |

## Setup Instructions

Run the setup script to get detailed instructions:

```powershell
.\test\setup_two_users.ps1
```

This will guide you through:
1. Google OAuth for both users
2. Calendar synchronization
3. Testing multi-user scheduling
4. Viewing AI insights

## Testing

After setup, test with:

```powershell
# Test via API
.\test\test_quick_schedule_simple.ps1

# Or use the frontend
http://localhost:3000/quick-schedule
```

Enter both emails as participants and enable "Show Analysis" to see the full AI decision-making process.
