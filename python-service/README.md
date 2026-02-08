# AI Meeting Scheduler - Python Brain Service

🧠 **Stateless FastAPI service providing intelligent scheduling agents**

## Architecture Overview

This service implements the **AI Brain** for the Meeting Scheduler system. It is completely stateless and does not access databases or external services directly.

### Core Agents

1. **Availability Agent** - Computes free/busy slots with buffer and timezone handling
2. **Preference Agent** - Learns and applies user preferences from historical behavior  
3. **Optimization Agent** - Ranks candidate slots using constraints and scoring
4. **Negotiation Agent** - Resolves conflicts for multi-party meetings

### Design Principles

- ✅ **Stateless**: No database access, no external API calls
- ✅ **Pure Logic**: All agents use pure computational logic
- ✅ **Modular**: Each agent is independent and testable
- ✅ **JSON Contracts**: Stable Pydantic schemas for all I/O
- ✅ **Production-Ready**: Type hints, error handling, documentation

---

## Quick Start

### 1. Install Dependencies

```bash
cd python-service
pip install -r requirements.txt
```

### 2. Run the Service

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Test the Service

Visit:
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Agent List**: http://localhost:8000/agents

---

## API Endpoints

### `POST /schedule`

Main scheduling endpoint that orchestrates all AI agents.

**Request Body:**
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
        "busy_slots": [
          {
            "start": "2026-02-10T10:00:00Z",
            "end": "2026-02-10T11:00:00Z",
            "timezone": "UTC"
          }
        ],
        "weekly_meeting_count": 15,
        "peak_meeting_hours": [10, 11, 14, 15],
        "preference_patterns": {
          "preferred_days": ["monday", "tuesday", "wednesday"],
          "preferred_hours_start": 9,
          "preferred_hours_end": 17,
          "avg_meeting_duration_minutes": 30,
          "buffer_minutes": 15,
          "avoids_back_to_back": true,
          "morning_person_score": 0.7
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

**Response:**
```json
{
  "meeting_id": "meeting-123",
  "candidates": [
    {
      "slot": {
        "start": "2026-02-11T14:00:00Z",
        "end": "2026-02-11T15:00:00Z",
        "timezone": "UTC"
      },
      "score": 92.5,
      "availability_score": 100.0,
      "preference_score": 85.0,
      "optimization_score": 88.0,
      "conflicts": [],
      "all_participants_available": true,
      "reasoning": "Excellent match; all participants available; strong preference alignment; optimal time of day."
    }
  ],
  "total_candidates_evaluated": 156,
  "processing_time_ms": 45.2,
  "negotiation_rounds": 1,
  "analytics": {
    "estimated_time_saved_minutes": 30.0,
    "coordination_overhead_reduction_pct": 75.0,
    "top_candidate_confidence": 92.5
  },
  "success": true,
  "message": "Found 10 optimal meeting slots"
}
```

### `GET /health`

Health check endpoint.

### `GET /agents`

List all available agents and their capabilities.

---

## Project Structure

```
python-service/
├── main.py                      # FastAPI application + /schedule endpoint
├── requirements.txt             # Python dependencies
├── README.md                    # This file
├── schemas/
│   ├── __init__.py
│   └── scheduling.py            # Pydantic models (request/response)
└── agents/
    ├── __init__.py
    ├── availability_agent.py    # Availability computation
    ├── preference_agent.py      # Preference learning & scoring
    ├── optimization_agent.py    # Candidate ranking & optimization
    └── negotiation_agent.py     # Conflict resolution
```

---

## Key Features

### 🎯 Multi-Agent Orchestration

The `/schedule` endpoint orchestrates all agents in sequence:

1. **Availability Agent** finds all free time slots
2. **Preference Agent** scores slots by user preferences
3. **Optimization Agent** ranks candidates with composite scoring
4. **Negotiation Agent** resolves conflicts and suggests compromises

### 📊 Comprehensive Scoring

Each candidate slot receives detailed scoring:
- **Availability Score** (0-100): How well it fits availability
- **Preference Score** (0-100): How well it matches preferences  
- **Optimization Score** (0-100): Overall optimization quality
- **Overall Score** (0-100): Weighted combination

### 🤝 Conflict Resolution

The Negotiation Agent handles conflicts by:
- Prioritizing required vs optional participants
- Suggesting compromise solutions (extended hours, reduced buffers)
- Providing alternative recommendations

### 📈 Analytics

Every response includes analytics:
- Estimated time saved (vs manual coordination)
- Coordination overhead reduction (target: 75%)
- Top candidate confidence score
- Conflict analysis

---

## Integration with Next.js

This service is designed to be called by Next.js API routes. Next.js handles:

1. Fetching raw calendar data from Supabase
2. Compressing data via ScaleDown AI
3. Calling this Python service with compressed data
4. Storing results back to Supabase
5. Serving results to frontend

**The Python service never touches the database or external APIs.**

---

## Testing

### Manual Testing with curl

```bash
# Health check
curl http://localhost:8000/health

# Schedule meeting (see example request above)
curl -X POST http://localhost:8000/schedule \
  -H "Content-Type: application/json" \
  -d @test_request.json
```

### Interactive Testing

Visit http://localhost:8000/docs for Swagger UI with interactive API testing.

---

## Development

### Adding a New Agent

1. Create agent file in `agents/` directory
2. Implement agent class with static methods
3. Import agent in `agents/__init__.py`
4. Use agent in `/schedule` endpoint orchestration

### Modifying Schemas

1. Update Pydantic models in `schemas/scheduling.py`
2. FastAPI will automatically update API docs
3. Coordinate changes with Next.js team

---

## Production Considerations

- [ ] Add proper logging (structlog or standard logging)
- [ ] Implement request validation middleware
- [ ] Add rate limiting
- [ ] Add authentication/API keys
- [ ] Set up monitoring (Prometheus, Datadog)
- [ ] Configure CORS for specific origins
- [ ] Add request ID tracking
- [ ] Implement caching for repeated requests
- [ ] Add unit tests for each agent
- [ ] Add integration tests for /schedule endpoint

---

## Performance

- **Target**: < 100ms response time for 20 participants
- **Stateless**: Scales horizontally without coordination
- **Efficient**: Vectorized operations where possible

---

## License

Proprietary - Meeting Scheduler Project

---

## Contact

For questions about this service, contact the AI team.
