# Full Stack Architecture - AI Meeting Scheduler

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                    │
│                     http://localhost:3000                               │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ HTTP/HTTPS Requests
                             │
┌────────────────────────────▼────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                                  │
│                        Port: 3000                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Components:                                                       │  │
│  │  • Landing Page        • Quick Schedule                          │  │
│  │  • Dashboard           • Calendar View                           │  │
│  │  • Analytics           • Settings                                │  │
│  │                                                                   │  │
│  │ Hooks:                                                            │  │
│  │  • use-api.ts          • use-mobile.tsx                          │  │
│  │                                                                   │  │
│  │ API Client (lib/api.ts):                                         │  │
│  │  • createSchedule()    • getAnalytics()                          │  │
│  │  • syncCalendar()      • writeToCalendar()                       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ API Calls to /api/*
                             │ (via NEXT_PUBLIC_API_BASE_URL)
                             │
┌────────────────────────────▼────────────────────────────────────────────┐
│               NEXT.JS ORCHESTRATOR (API Layer)                          │
│                        Port: 3001                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ API Routes:                                                       │  │
│  │  • POST /api/schedule              → Schedule meetings           │  │
│  │  • POST /api/schedule/recommendations → Get suggestions          │  │
│  │  • GET  /api/calendar/sync          → Sync Google Calendar       │  │
│  │  • POST /api/calendar/write-back    → Write to Google            │  │
│  │  • POST /api/recurring/analyze      → Analyze recurring          │  │
│  │  • GET  /api/auth/google/*          → OAuth flow                 │  │
│  │                                                                   │  │
│  │ Services (lib/):                                                  │  │
│  │  • googleAuth.ts        → OAuth 2.0 authentication               │  │
│  │  • googleCalendar.ts    → Read calendar events                   │  │
│  │  • googleCalendarWrite.ts → Write calendar events                │  │
│  │  • scaledown.ts         → Compress calendar data (80-90%)        │  │
│  │  • supabase.ts          → Database persistence                   │  │
│  │  • participantEnrichment.ts → Add calendar data to requests      │  │
│  │  • schedulingEnforcement.ts → Buffer/travel time rules           │  │
│  │                                                                   │  │
│  │ Data Flow:                                                        │  │
│  │  1. Receive request with participant emails                      │  │
│  │  2. Fetch compressed calendars from Supabase                     │  │
│  │  3. Enrich request with calendar data                            │  │
│  │  4. Forward to Python AI service                                 │  │
│  │  5. Apply enforcement rules to results                           │  │
│  │  6. Persist to database (optional)                               │  │
│  │  7. Return enriched response                                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ Forward to Python AI
                             │ (via PYTHON_SERVICE_URL)
                             │
┌────────────────────────────▼────────────────────────────────────────────┐
│               PYTHON AI SERVICE (FastAPI)                               │
│                        Port: 8000                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Endpoints:                                                        │  │
│  │  • POST /schedule       → AI scheduling (main)                   │  │
│  │  • GET  /health         → Health check                           │  │
│  │  • GET  /scaledown/stats → Compression statistics                │  │
│  │                                                                   │  │
│  │ 4 AI Agents:                                                      │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │ 1. AVAILABILITY AGENT (251 lines)                          │  │  │
│  │  │    • Find free time slots                                  │  │  │
│  │  │    • Handle timezones                                      │  │  │
│  │  │    • Apply buffer time                                     │  │  │
│  │  │    • Filter by working hours                               │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │ 2. PREFERENCE AGENT (270 lines)                            │  │  │
│  │  │    • Learn from historical patterns                        │  │  │
│  │  │    • Score by day/time preferences                         │  │  │
│  │  │    • Morning vs evening person                             │  │  │
│  │  │    • Aggregate across participants                         │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │ 3. OPTIMIZATION AGENT (631 lines)                          │  │  │
│  │  │    • 5-factor scoring algorithm:                           │  │  │
│  │  │      - Availability (35%)                                  │  │  │
│  │  │      - Preference (25%)                                    │  │  │
│  │  │      - Conflict Proximity (20%)                            │  │  │
│  │  │      - Fragmentation (15%)                                 │  │  │
│  │  │      - Optimization (5%)                                   │  │  │
│  │  │    • Rank candidates 0-100                                 │  │  │
│  │  │    • Generate AI reasoning                                 │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │ 4. NEGOTIATION AGENT (348 lines)                           │  │  │
│  │  │    • Required vs optional participants                     │  │  │
│  │  │    • Multi-round negotiation (max 3)                       │  │  │
│  │  │    • Suggest compromises                                   │  │  │
│  │  │    • Relax constraints if needed                           │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  │                                                                   │  │
│  │ Services:                                                         │  │
│  │  • scaledown_service.py → LLM compression (60-80% reduction)     │  │
│  │                                                                   │  │
│  │ Schemas:                                                          │  │
│  │  • scheduling.py        → Pydantic models                        │  │
│  │  • Type-safe request/response                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ Returns Candidates
                             │
┌────────────────────────────▼────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Supabase PostgreSQL (Optional):                                  │  │
│  │  Tables:                                                          │  │
│  │   • compressed_calendars   → ScaleDown compressed data           │  │
│  │   • calendar_events        → Google Calendar events              │  │
│  │   • scheduling_sessions    → Meeting scheduling history          │  │
│  │   • recurring_patterns     → Recurring meeting analysis          │  │
│  │                                                                   │  │
│  │ Google Calendar API (Optional):                                  │  │
│  │   • OAuth 2.0 authentication                                     │  │
│  │   • Read calendar events (12 months)                             │  │
│  │   • Write calendar events (with attendees)                       │  │
│  │   • Create Google Meet links                                     │  │
│  │                                                                   │  │
│  │ ScaleDown API:                                                    │  │
│  │   • Compress calendar data (80-90% reduction)                    │  │
│  │   • Compress prompts for LLM                                     │  │
│  │   • Reduce token usage                                           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════
                            DATA FLOW EXAMPLE
═══════════════════════════════════════════════════════════════════════════

User Request: "Schedule 60-min meeting with Alice, Bob, Carol next week"

1. FRONTEND (Port 3000)
   ↓ User fills form: participant_emails, duration, date range
   ↓ Calls: api.createSchedule(requestData)
   
2. ORCHESTRATOR (Port 3001)
   ↓ Receives: POST /api/schedule
   ↓ Enriches: Fetches compressed calendars from Supabase
   ↓ Transforms: Converts to Python AI format
   ↓ Forwards: POST http://localhost:8000/schedule
   
3. PYTHON AI (Port 8000)
   ↓ Availability Agent: Finds 45 free slots
   ↓ Preference Agent: Scores each slot (88.8/100 avg)
   ↓ Optimization Agent: Ranks by 5-factor algorithm
   ↓ Negotiation Agent: Resolves conflicts (if any)
   ↓ Returns: Top 5 candidates with scores & reasoning
   
4. ORCHESTRATOR (Port 3001)
   ↓ Receives: AI candidates from Python
   ↓ Applies: Buffer time, travel time enforcement
   ↓ Persists: Saves to Supabase (optional)
   ↓ Returns: Enriched response
   
5. FRONTEND (Port 3000)
   ↓ Displays: Ranked meeting times with scores
   ↓ Shows: AI reasoning for each candidate
   ↓ User: Selects best time
   ↓ Optional: Write to Google Calendar

═══════════════════════════════════════════════════════════════════════════
                         PERFORMANCE METRICS
═══════════════════════════════════════════════════════════════════════════

Typical Request:
  • 3 participants
  • 7-day date range
  • 60-minute meeting
  • 9-5 PM working hours

Results:
  • Time slots evaluated: 45
  • Candidates returned: 5
  • Processing time: 12-15ms (Python AI)
  • Total roundtrip: 50-100ms (including network)
  • Calendar compression: 80-90% reduction
  • Token usage: 60-80% reduction (ScaleDown)

═══════════════════════════════════════════════════════════════════════════
                         DEPLOYMENT OPTIONS
═══════════════════════════════════════════════════════════════════════════

Development:
  • Python: Local (python main.py)
  • Orchestrator: Local (npm run dev -- -p 3001)
  • Frontend: Local (npm run dev)

Production:
  • Python: Railway, Render, or AWS Lambda
  • Orchestrator: Vercel, Netlify
  • Frontend: Vercel, Netlify
  • Database: Supabase (cloud)
  • Calendar: Google Calendar API

═══════════════════════════════════════════════════════════════════════════
```
