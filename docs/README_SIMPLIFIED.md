# ScaleDown Project - Simplified Architecture

## Quick Start

```powershell
# Start both services (one command)
.\start_services_merged.ps1

# Open browser
http://localhost:3000
```

## Architecture (Simplified ✨)

```
┌─────────────────────────────────────────────────┐
│              Browser / User                      │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│            Frontend :3000                        │
│  ┌─────────────────────────────────────────┐   │
│  │  UI Pages (Next.js 15 + React 19)       │   │
│  │  • Landing Page                          │   │
│  │  • Dashboard                             │   │
│  │  • Quick Schedule                        │   │
│  │  • Calendar View                         │   │
│  │  • Analytics                             │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │  API Routes (Same App!)                  │   │
│  │  • POST /api/schedule                    │   │
│  │  • GET  /api/calendar/sync               │   │
│  │  • POST /api/recurring/*                 │   │
│  │  • *    /api/auth/*                      │   │
│  └─────────────┬───────────────────────────┘   │
└────────────────┼───────────────────────────────┘
                 │
                 │ HTTP POST
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│          Python AI Service :8000                 │
│  ┌─────────────────────────────────────────┐   │
│  │  FastAPI + 4 AI Agents                   │   │
│  │  • Availability Agent                    │   │
│  │  • Preference Agent                      │   │
│  │  • Optimization Agent                    │   │
│  │  • Negotiation Agent                     │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## What Changed?

### Before (3 Services - Overengineered ❌)
```
Browser → Frontend :3000 → Orchestrator :3001 → Python :8000
          (UI only)         (API only)           (AI)
```

### After (2 Services - Right-Sized ✅)
```
Browser → Frontend :3000 → Python :8000
          (UI + API)        (AI)
```

**Why?** Next.js is designed to have both pages AND API routes in the same app. Having a separate "orchestrator" Next.js app with only API routes was unnecessary complexity.

## Project Structure

```
ScaleDown_Proj/
├── frontend/                      # Next.js 15 App (UI + API)
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── dashboard/            # Dashboard UI
│   │   ├── quick-schedule/       # Quick schedule UI
│   │   ├── calendar/             # Calendar view
│   │   ├── analytics/            # Analytics UI
│   │   └── api/                  # ⭐ API Routes (merged in)
│   │       ├── schedule/         # Main scheduling endpoint
│   │       ├── calendar/         # Google Calendar sync
│   │       ├── recurring/        # Recurring meetings
│   │       └── auth/             # Authentication
│   ├── components/               # React components
│   ├── lib/                      # ⭐ Services (merged in)
│   │   ├── api.ts               # HTTP client
│   │   ├── googleAuth.ts        # OAuth handling
│   │   ├── scaledown.ts         # LLM compression
│   │   ├── schedulingPersistence.ts
│   │   └── ... (10+ services)
│   └── types/                    # ⭐ TypeScript types (merged in)
│
├── python-service/                # Python AI Brain
│   ├── main.py                   # FastAPI server
│   ├── agents/                   # 4 AI agents
│   │   ├── availability_agent.py
│   │   ├── preference_agent.py
│   │   ├── optimization_agent.py
│   │   └── negotiation_agent.py
│   ├── demo_agents.py            # Standalone demo
│   └── test_agents.py            # Unit tests (7 tests)
│
├── docs/                          # Documentation
├── supabase/                      # Database schemas
└── test/                          # Integration tests
```

## Tech Stack

### Frontend (Port 3000)
- **Framework**: Next.js 15 (App Router)
- **UI**: React 19 + TypeScript
- **Styling**: Tailwind CSS + Framer Motion
- **Components**: Radix UI (shadcn/ui)
- **State**: TanStack Query

### Backend (Port 8000)
- **Framework**: FastAPI (Python 3.13)
- **Schemas**: Pydantic 2.10
- **AI**: Custom multi-agent system

### Optional Integrations
- **Database**: Supabase (PostgreSQL)
- **Calendar**: Google Calendar API
- **Compression**: ScaleDown API (LLM)

## Scripts

### Start Services
```powershell
.\start_services_merged.ps1
```
Opens 2 terminal windows:
- Python AI Service (port 8000)
- Frontend + API (port 3000)

### Test Integration
```powershell
.\test_integration_merged.ps1
```
Verifies:
- Python service health
- Frontend accessibility
- Full scheduling pipeline

### Manual Start
```powershell
# Terminal 1: Python AI
cd python-service
python main.py

# Terminal 2: Frontend
cd frontend
npm run dev
```

## API Endpoints

### Scheduling
```
POST /api/schedule
```
**Request:**
```json
{
  "meeting_id": "team-sync-001",
  "participant_emails": ["alice@example.com", "bob@example.com"],
  "constraints": {
    "duration_minutes": 60,
    "earliest_date": "2026-02-17T00:00:00Z",
    "latest_date": "2026-02-24T00:00:00Z"
  }
}
```

**Response:**
```json
{
  "meeting_id": "team-sync-001",
  "candidates": [
    {
      "score": 86.25,
      "slot": {
        "start": "2026-02-18T13:00:00Z",
        "end": "2026-02-18T14:00:00Z"
      },
      "reasoning": "Excellent match; all participants available..."
    }
  ]
}
```

### Calendar Sync
```
GET /api/calendar/sync?userId=123
```

### Health Check
```
GET http://localhost:8000/health
```

## Features

### AI Scheduling
- **4 Specialized Agents** working together
- **Multi-factor scoring** (availability, preferences, optimization)
- **Conflict detection** and resolution
- **Smart negotiation** for best times

### Real Calendar Integration
- Google Calendar OAuth
- Compressed calendar storage (80% smaller)
- Automatic conflict detection
- Calendar writeback

### Enforcement Rules
- Cancellation risk prediction
- Time-saving opportunities
- Smart scheduling policies

### UI Features
- Beautiful landing page
- Interactive dashboard
- Quick schedule interface
- Calendar month view
- Analytics and insights

## Environment Setup

### Frontend (.env.local)
```env
# Python AI Service URL
PYTHON_SERVICE_URL=http://localhost:8000

# Request timeout
REQUEST_TIMEOUT_MS=30000

# Optional: Database
DATABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_key

# Optional: Google Calendar
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret

# Optional: ScaleDown API
SCALEDOWN_API_KEY=your_key
```

### Python (.env)
```env
PORT=8000
SCALEDOWN_API_KEY=your_key
```

## Development

### Install Dependencies

**Frontend:**
```powershell
cd frontend
npm install
```

**Python:**
```powershell
cd python-service
pip install -r requirements.txt
```

### Run Tests

**Python Unit Tests:**
```powershell
cd python-service
python test_agents.py
```

**Python Demo:**
```powershell
cd python-service
python demo_agents.py
```

## Documentation

- [MERGE_COMPLETE.md](MERGE_COMPLETE.md) - Architecture merge details
- [PROOF_OF_WORK.md](PROOF_OF_WORK.md) - AI agents proof
- [INTEGRATION_GUIDE.md](docs/INTEGRATION_GUIDE.md) - Full setup guide
- [API_REFERENCE.md](frontend/API_REFERENCE.md) - API documentation

## Challenge 2 Submission

This project was built for **ScaleDown Challenge 2**. See:
- [README_CHALLENGE2.md](README_CHALLENGE2.md) - Technical overview
- [ACTION_PLAN.md](ACTION_PLAN.md) - Submission checklist
- [demo_agents.py](python-service/demo_agents.py) - Standalone proof

## Status

✅ **PRODUCTION READY**

- [x] Python AI service working (4 agents, 7 tests passing)
- [x] Frontend with API routes integrated
- [x] Full scheduling pipeline tested
- [x] Architecture simplified (3 → 2 services)
- [x] All dependencies installed
- [x] Documentation complete

---

**Last Updated**: February 13, 2026  
**Architecture**: Simplified (2 services)  
**Status**: Merged and tested ✅
