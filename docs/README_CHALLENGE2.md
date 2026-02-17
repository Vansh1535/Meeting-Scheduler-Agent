# AI Meeting Scheduler Agent - Challenge 2

**Author**: Vansh Lilani  
**Status**: Fully Functional Python Implementation  
**Test Coverage**: 7 unit tests (100% passing)

---

## Quick Start

```bash
# 1. Install dependencies
cd python-service
pip install -r requirements.txt

# 2. Run demonstration (< 1 minute)
python demo_agents.py

# 3. Run tests
python test_agents.py

# 4. Start API service
python main.py
```

---

## What This Is

An AI meeting scheduling system that coordinates meetings across multiple participants using 4 specialized agents:

| Agent | Purpose | Lines of Code |
|-------|---------|---------------|
| **Availability Agent** | Find free time slots | 251 |
| **Preference Agent** | Score based on user preferences | 270 |
| **Optimization Agent** | Rank candidates (5-factor scoring) | 631 |
| **Negotiation Agent** | Resolve conflicts | 348 |

**Total Core Logic**: ~1,800 lines  
**Tech Stack**: Python 3.13, FastAPI, Pydantic

---

## Key Features

- ✅ **Multi-party scheduling**: No limit on participants
- ✅ **Intelligent scoring**: 5-factor algorithm (availability, preference, conflicts, fragmentation, optimization)
- ✅ **Conflict resolution**: Automatic negotiation with fallback strategies
- ✅ **Timezone handling**: UTC-aware datetime throughout
- ✅ **Stateless agents**: Pure functions, no side effects
- ✅ **Type-safe**: Full Pydantic schema validation
- ✅ **Production-ready**: FastAPI service with async support

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│ FastAPI Service (main.py)                          │
│  POST /schedule                                     │
└────────────┬────────────────────────────────────────┘
             │
    ┌────────┴────────┐
    │  Agent Pipeline │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │ 1. Availability │ ← Find free slots
    │    Agent        │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │ 2. Preference   │ ← Score by user patterns
    │    Agent        │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │ 3. Optimization │ ← Rank candidates (5 factors)
    │    Agent        │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │ 4. Negotiation  │ ← Resolve conflicts
    │    Agent        │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │ Ranked          │
    │ Candidates      │
    └─────────────────┘
```

---

## Scoring Algorithm

Each meeting candidate is scored 0-100 using weighted factors:

```
Final Score = (Availability × 0.35) +
              (Preference × 0.25) +
              (Conflict Proximity × 0.20) +
              (Fragmentation × 0.15) +
              (Optimization × 0.05)
```

### Factor Details

1. **Availability (35%)**: Ratio of available participants
2. **Preference (25%)**: Match with user's historical patterns
   - Day of week (30%)
   - Time of day (40%)
   - Morning/evening preference (20%)
   - Duration match (10%)
3. **Conflict Proximity (20%)**: Penalty for back-to-back meetings
4. **Fragmentation (15%)**: Calendar grouping quality
5. **Optimization (5%)**: Additional factors (time of day, etc.)

---

## Example Usage

### Python API

```python
from agents.availability_agent import AvailabilityAgent
from agents.optimization_agent import OptimizationAgent

# Find available slots
slots = AvailabilityAgent.find_available_slots(
    participants=participants,
    constraints=constraints
)

# Rank candidates
candidates = OptimizationAgent.rank_candidates(
    available_slots=slots,
    participants=participants,
    constraints=constraints
)

# Top candidate
best = candidates[0]
print(f"Best time: {best.slot.start}")
print(f"Score: {best.score}/100")
```

### REST API

```bash
curl -X POST http://localhost:8000/schedule \
  -H "Content-Type: application/json" \
  -d @test_request.json
```

Response:
```json
{
  "meeting_id": "mtg123",
  "candidates": [
    {
      "slot": {
        "start": "2026-02-17T11:00:00+00:00",
        "end": "2026-02-17T12:00:00+00:00"
      },
      "score": 87.6,
      "reasoning": "Excellent match; all participants available...",
      "availability_score": 100.0,
      "preference_score": 91.7,
      "conflict_proximity_score": 95.0,
      "all_participants_available": true
    }
  ],
  "processing_time_ms": 12.5
}
```

---

## Project Structure

```
python-service/
├── main.py                    # FastAPI application
├── agents/
│   ├── availability_agent.py  # Free/busy slot finder
│   ├── preference_agent.py    # User preference scoring
│   ├── optimization_agent.py  # Multi-factor ranking
│   └── negotiation_agent.py   # Conflict resolution
├── schemas/
│   └── scheduling.py          # Pydantic models
├── services/
│   └── scaledown_service.py   # LLM compression (optional)
├── demo_agents.py             # Standalone demonstration
├── test_agents.py             # Unit tests
└── requirements.txt           # Dependencies
```

---

## Testing

### Run All Tests

```bash
cd python-service
python test_agents.py
```

**Output**:
```
Ran 7 tests in 0.003s
OK
✓ ALL TESTS PASSED!
```

### Test Coverage

- `TestAvailabilityAgent`: 2 tests
- `TestPreferenceAgent`: 2 tests
- `TestOptimizationAgent`: 1 test
- `TestNegotiationAgent`: 1 test
- `TestIntegration`: 1 test (full pipeline)

---

## Demonstration

Run the standalone demo to see all agents in action:

```bash
cd python-service
python demo_agents.py
```

**What it shows**:
1. Availability Agent finds 45 slots
2. Preference Agent scores each slot (88.8/100 avg)
3. Optimization Agent ranks top 5 candidates
4. Negotiation Agent (not needed in this scenario)
5. Final recommendation: 87.6/100 score

**Runtime**: < 1 second

---

## Dependencies

```
fastapi>=0.115.0        # Web framework
uvicorn[standard]>=0.32 # ASGI server
pydantic>=2.10.0        # Data validation
scaledown>=0.1.4        # LLM compression (optional)
```

Install:
```bash
pip install -r requirements.txt
```

---

## API Endpoints

### `GET /`
Health check

### `GET /health`
Detailed health status

### `POST /schedule`
Schedule a meeting

**Request Body**:
```json
{
  "meeting_id": "string",
  "participants": [
    {
      "user_id": "string",
      "name": "string",
      "email": "string",
      "is_required": true,
      "calendar_summary": {
        "user_id": "string",
        "timezone": "UTC",
        "busy_slots": [],
        "weekly_meeting_count": 0
      }
    }
  ],
  "constraints": {
    "duration_minutes": 60,
    "earliest_date": "2026-02-17T00:00:00Z",
    "latest_date": "2026-02-24T00:00:00Z",
    "working_hours_start": 9,
    "working_hours_end": 17,
    "allowed_days": ["monday", "tuesday", "wednesday"],
    "buffer_minutes": 15,
    "max_candidates": 10
  }
}
```

### `GET /scaledown/stats`
LLM compression statistics

---

## How It Works

### 1. Availability Agent

- Generates candidate slots (30-min increments)
- Filters by working hours and allowed days
- Checks participant busy times
- Applies buffer time between meetings

**Key Functions**:
- `find_available_slots()`
- `_generate_candidate_slots()`
- `_is_slot_available_for_all()`

### 2. Preference Agent

- Analyzes user's historical meeting patterns
- Scores based on preferred days/times
- Considers morning vs evening preference
- Matches duration preferences

**Key Functions**:
- `score_slot_preferences()`
- `_calculate_preference_score()`
- `aggregate_preference_scores()`

### 3. Optimization Agent

- Combines all scoring factors
- Ranks candidates by overall score
- Generates human-readable reasoning
- Handles partial availability

**Key Functions**:
- `rank_candidates()`
- `_evaluate_slot()`
- `_calculate_availability_factor()`
- `_calculate_conflict_proximity()`
- `_calculate_fragmentation()`

### 4. Negotiation Agent

- Prioritizes required participants
- Suggests compromises (extended hours, reduced buffers)
- Re-scores with optional participants
- Iterative negotiation (max 3 rounds)

**Key Functions**:
- `negotiate_schedule()`
- `_filter_for_required_participants()`
- `_suggest_compromises()`

---

## Edge Cases Handled

- ✅ Timezone-aware datetime conversions
- ✅ Participants with no calendar data (neutral score: 50/100)
- ✅ All participants busy (returns empty list)
- ✅ Working hours across timezones
- ✅ Buffer time enforcement
- ✅ Required vs optional participants
- ✅ Back-to-back meeting penalties

---

## Performance

| Metric | Value |
|--------|-------|
| Participants | 3 |
| Time Slots Evaluated | 45 |
| Processing Time | 12.5 ms |
| Candidates Generated | 5 |
| Memory Usage | < 50 MB |

---

## Extending the System

### Add a New Agent

1. Create `agents/new_agent.py`
2. Implement stateless functions
3. Import in `main.py`
4. Add to pipeline in `schedule_meeting()`
5. Add tests in `test_agents.py`

### Add a New Scoring Factor

1. Add factor calculation in `OptimizationAgent._evaluate_slot()`
2. Update weights
3. Update `MeetingSlotCandidate` schema
4. Add tests

### Add a New Constraint

1. Update `SchedulingConstraints` in `schemas/scheduling.py`
2. Apply constraint in `AvailabilityAgent`
3. Add Pydantic validator

---

## Deployment

### Local Development

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker (Optional)

```dockerfile
FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Troubleshooting

### Issue: No slots found

**Cause**: Date range doesn't include allowed days  
**Fix**: Ensure `earliest_date` to `latest_date` includes at least one allowed day

### Issue: All scores are 50/100

**Cause**: No preference data provided  
**Fix**: Include `preference_patterns` in `CompressedCalendarSummary`

### Issue: Import errors

**Cause**: Missing dependencies  
**Fix**: Run `pip install -r requirements.txt`

---

## License

MIT

---

## Author

**Vansh Lilani**  
GitHub: [Vansh1535](https://github.com/Vansh1535)

---

## Proof of Work

See [PROOF_OF_WORK.md](PROOF_OF_WORK.md) for detailed evidence of functionality.

**Quick Verification**:
```bash
cd python-service
python demo_agents.py  # See it work in < 1 minute
python test_agents.py  # Run tests (< 10 seconds)
```
