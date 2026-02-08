# Next.js Backend Orchestrator

**AI-Powered Meeting Scheduler - Backend Orchestration Layer**

This Next.js application acts as a thin orchestration layer between clients and the Python AI Brain service. It forwards scheduling requests and returns AI-generated meeting suggestions.

## Architecture

```
Client (curl/Postman/Frontend)
    ↓
Next.js API Route (/api/schedule)
    ↓
Python FastAPI AI Brain Service
    ↓
Next.js API Route
    ↓
Client (receives ranked meeting slots)
```

## Responsibilities

- ✅ Expose POST `/api/schedule` endpoint
- ✅ Accept and validate JSON scheduling requests
- ✅ Forward requests to Python AI Brain
- ✅ Handle timeouts and network errors
- ✅ Return AI responses unchanged
- ✅ Provide health check endpoint

## Does NOT

- ❌ Implement AI logic (handled by Python)
- ❌ Access databases
- ❌ Call ScaleDown (future phase)
- ❌ Modify AI responses
- ❌ Serve frontend UI (future phase)

## Prerequisites

- Node.js 18+ installed
- Python FastAPI service running on port 8000
- npm or yarn package manager

## Installation

```bash
# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env.local

# Edit .env.local if Python service is on different host/port
```

## Environment Variables

Edit `.env.local`:

```env
# Python AI Brain Service URL
PYTHON_SERVICE_URL=http://localhost:8000

# Request timeout in milliseconds
REQUEST_TIMEOUT_MS=30000
```

## Running the Server

### Development Mode

```bash
npm run dev
```

Server starts on `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### POST /api/schedule

Forward scheduling request to Python AI Brain.

**Request:**
```json
{
  "meeting_id": "meeting-123",
  "participants": [
    {
      "user_id": "user-1",
      "email": "alice@example.com",
      "name": "Alice Smith",
      "is_required": true,
      "calendar_summary": {
        "user_id": "user-1",
        "timezone": "UTC",
        "busy_slots": [],
        "weekly_meeting_count": 12,
        "peak_meeting_hours": [10, 14, 15],
        "preference_patterns": {
          "preferred_days": ["monday", "wednesday", "friday"],
          "preferred_hours_start": 9,
          "preferred_hours_end": 17,
          "avg_meeting_duration_minutes": 30,
          "buffer_minutes": 15,
          "avoids_back_to_back": true,
          "morning_person_score": 0.8
        },
        "data_compressed": true,
        "compression_period_days": 365
      }
    }
  ],
  "constraints": {
    "duration_minutes": 60,
    "earliest_date": "2026-02-10T00:00:00Z",
    "latest_date": "2026-02-17T23:59:59Z",
    "working_hours_start": 9,
    "working_hours_end": 17,
    "allowed_days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "buffer_minutes": 15,
    "timezone": "UTC",
    "max_candidates": 10
  }
}
```

**Response (200 OK):**
```json
{
  "meeting_id": "meeting-123",
  "candidates": [
    {
      "slot": {
        "start": "2026-02-12T13:00:00Z",
        "end": "2026-02-12T14:00:00Z",
        "timezone": "UTC"
      },
      "score": 100.0,
      "availability_score": 100.0,
      "preference_score": 84.84,
      "optimization_score": 100.0,
      "conflicts": [],
      "all_participants_available": true,
      "reasoning": "Excellent match; all participants available..."
    }
  ],
  "total_candidates_evaluated": 37,
  "processing_time_ms": 4.5,
  "negotiation_rounds": 2,
  "analytics": {},
  "success": true,
  "message": "Found 10 optimal meeting slots"
}
```

**Error Responses:**

```json
// 400 Bad Request
{
  "error": "Invalid request",
  "message": "Missing required fields: meeting_id, participants, or constraints",
  "status": 400
}

// 503 Service Unavailable
{
  "error": "Service unavailable",
  "message": "Cannot connect to AI service. Please ensure Python service is running.",
  "status": 503
}

// 504 Gateway Timeout
{
  "error": "Request timeout",
  "message": "AI service did not respond within 30000ms",
  "status": 504
}
```

### GET /api/schedule

Health check endpoint - verifies Next.js orchestrator and Python service connectivity.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "message": "Next.js orchestrator is running",
  "python_service": "healthy",
  "python_service_url": "http://localhost:8000",
  "python_health": {
    "status": "healthy",
    "agents": {
      "availability": "active",
      "preference": "active",
      "optimization": "active",
      "negotiation": "active"
    }
  }
}
```

## Testing

### Using curl

```bash
# Health check
curl http://localhost:3000/api/schedule

# Schedule meeting (use test_request.json from python-service)
curl -X POST http://localhost:3000/api/schedule \
  -H "Content-Type: application/json" \
  -d @../python-service/test_request.json
```

### Using PowerShell

```powershell
# Health check
Invoke-RestMethod -Uri 'http://localhost:3000/api/schedule' -Method Get

# Schedule meeting
$body = Get-Content '../python-service/test_request.json' -Raw
Invoke-RestMethod -Uri 'http://localhost:3000/api/schedule' -Method Post -ContentType 'application/json' -Body $body
```

## Project Structure

```
nextjs-orchestrator/
├── src/
│   ├── app/
│   │   └── api/
│   │       └── schedule/
│   │           └── route.ts         # API route handler
│   └── types/
│       └── scheduling.ts            # TypeScript types
├── .env.local                       # Environment configuration
├── .env.example                     # Example environment file
├── next.config.ts                   # Next.js configuration
├── tsconfig.json                    # TypeScript configuration
├── package.json                     # Dependencies
└── README.md                        # This file
```

## Error Handling

The orchestrator handles:

- ✅ **Invalid requests**: Missing fields, validation errors
- ✅ **Network errors**: Connection refused, timeouts
- ✅ **Python service errors**: Forwarded with appropriate status codes
- ✅ **JSON parsing errors**: Invalid request bodies
- ✅ **Timeouts**: Configurable timeout with graceful failure

## Production Deployment

1. Set `NODE_ENV=production` in environment
2. Configure `PYTHON_SERVICE_URL` to production Python service
3. Build: `npm run build`
4. Start: `npm start`
5. Deploy to Vercel, AWS, or any Node.js hosting

## Monitoring

Response headers include:
- `X-AI-Processing-Time`: Time taken by Python AI service

## Limitations

- This is a **stateless orchestrator** - no database
- Does **NOT** implement AI logic (delegated to Python)
- Does **NOT** call ScaleDown (future phase)
- Does **NOT** serve frontend (future phase)

## Next Steps

- **Phase 3**: Add Supabase integration
- **Phase 4**: Add ScaleDown AI compression
- **Phase 5**: Build frontend UI

## Troubleshooting

### "Cannot connect to AI service"

Ensure Python FastAPI service is running:
```bash
cd ../python-service
python main.py
```

### Timeout errors

Increase `REQUEST_TIMEOUT_MS` in `.env.local` or check Python service performance.

### Port already in use

Change Next.js port:
```bash
npm run dev -- -p 3001
```

## License

Proprietary - Meeting Scheduler Project
