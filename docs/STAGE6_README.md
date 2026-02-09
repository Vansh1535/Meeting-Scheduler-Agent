# 🛡️ Stage 6: Scheduling Intelligence Enforcement

**Status**: ✅ Complete  
**Commit**: TBD  
**Purpose**: Convert AI scores into real-world enforced scheduling rules that actively prevent bad meetings

---

## 🎯 Overview

Stage 6 transforms the AI Meeting Scheduler from a **recommendation system** into an **enforcement system**. Instead of just scoring meeting candidates, the system now actively **blocks bad meetings** before they reach your calendar.

### Key Principle
**ENFORCEMENT, NOT NEW AI**

We don't change how AI scores meetings. We add hard constraints that:
- Block candidates that violate real-world constraints
- Warn about risky scheduling decisions
- Track and explain all enforcement decisions
- Measure actual time savings from smart scheduling

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ SCHEDULING FLOW (with Stage 6 Enforcement)                  │
└─────────────────────────────────────────────────────────────┘

1. READ (Stage 4)
   📅 Sync Google Calendar → Compress 12 months → Supabase

2. THINK (Stages 1-3)
   🤖 4 AI Agents → Score candidates (0-100)

3. ENFORCE (Stage 6) ← NEW!
   🛡️ Apply hard constraints:
      ✓ Buffer Time Enforcement
      ✓ Travel Time Constraints  
      ✓ Cancellation Risk Scoring
      ✓ Time-Savings Calculation
      ✓ Recurring Meeting Analysis

4. ACT (Stage 5)
   📝 Write approved meetings → Google Calendar
```

### Enforcement Happens:
- ✅ **After** AI scoring (don't modify Python AI)
- ✅ **Before** calendar write-back (block bad meetings early)
- ✅ **Deterministically** (same inputs → same outputs)
- ✅ **Explainably** (every decision is logged and traceable)

---

## 🚀 Features Implemented

### 1. 🕒 Buffer Time Enforcement (HIGHEST PRIORITY)

**Problem**: Back-to-back meetings cause burnout, context-switching fatigue, and meeting overruns.

**Solution**: Enforce minimum buffer time between meetings, dynamically adjusted based on calendar density.

#### How It Works:
- **Base Buffer**: 10-15 minutes (configurable)
- **Dynamic Adjustment**:
  - Low density day (0-30% full): Base buffer
  - Medium density (30-60% full): Base + 5 min
  - High density (60-80% full): Base + 10 min
  - Very high density (80%+ full): Base + 15 min

#### Enforcement Rules:
- ❌ **BLOCK** if buffer < required minimum
- ✅ **PASS** if adequate buffer maintained
- 📊 **LOG** buffer violations for tracking

#### Example:
```typescript
// Dense day with 75% calendar utilization
Required buffer: 15 + 10 = 25 minutes

Meeting A: 2:00 PM - 2:30 PM
Candidate B: 2:40 PM - 3:10 PM
Buffer: 10 minutes < 25 minutes required

Result: ❌ BLOCK 
Reason: "Insufficient buffer after meeting (10min < 25min required)"
```

---

### 2. 🚗 Travel Time Constraints

**Problem**: Impossible location transitions (e.g., cross-town meetings 15 minutes apart).

**Solution**: Detect location changes and enforce realistic travel times.

#### How It Works:
- Parse event locations from Google Calendar
- **Virtual meetings** (Google Meet, Zoom): No travel required
- **Same location**: Minimal buffer (0-5 min)
- **Different locations**: Enforce 25+ minute travel time

#### Enforcement Rules:
- ❌ **BLOCK** if travel is impossible
- ⚠️ **WARN** if travel is tight but possible
- ✅ **PASS** if sufficient travel time

#### Example:
```typescript
Meeting at "Building A, Room 301": 10:00 AM - 10:30 AM
Candidate at "Building C, Room 105": 10:40 AM - 11:10 AM
Travel time available: 10 minutes
Required travel time: 25 minutes

Result: ❌ BLOCK
Reason: "Insufficient travel time between locations (10min available, 25min required)"
```

#### Future Enhancement:
Integrate Google Maps Distance Matrix API for real travel time estimates.

---

### 3. ⚠️ Cancellation Risk Scoring

**Problem**: Certain meeting conditions predict high cancellation likelihood.

**Solution**: Compute explainable risk scores using multiple factors.

#### Risk Factors:
1. **Calendar Density** (0-40 points): Dense days → Higher risk
2. **Late-Day Penalty** (0-30 points): Meetings after 4pm → Higher risk
3. **AI Score Confidence** (0-20 points): Low AI score → Higher risk
4. **Historical Changes** (0-10 points): Past reschedules → Higher risk

#### Risk Categories:
- 🟢 **Low Risk** (0-29 points): Optimal scheduling conditions
- 🟡 **Medium Risk** (30-59 points): Some concerning factors
- 🔴 **High Risk** (60-100 points): Multiple red flags

#### Enforcement Rules:
- ℹ️ Risk score attached to all candidates
- ⚠️ High-risk meetings flagged in response
- 📊 Risk persisted to database for tracking

#### Example:
```typescript
Candidate: Friday, 5:30 PM, Score 65, Dense day (80% full)

Risk Calculation:
- Calendar density: 80% × 40 = 32 points
- Late-day penalty: (17.5 - 16) / 4 × 30 = 11 points
- Score confidence: (100 - 65) / 100 × 20 = 7 points
- Historical changes: 0 points
Total: 50 points → Medium Risk

Result: ⚠️ WARN
Message: "Medium cancellation risk - some concerning factors present"
```

---

### 4. ⏱️ Time-Savings Calculation

**Problem**: Hard to quantify scheduling efficiency gains.

**Solution**: Measure actual time saved from smart scheduling.

#### Metrics Tracked:
1. **Conflicts Avoided**: Blocked candidates that would cause issues
2. **Iterations Prevented**: Reschedule cycles avoided (2x per conflict)
3. **Minutes Saved**: 15 min per iteration (5 min finding slot + 10 min coordination)
4. **Density Improvement**: Calendar utilization optimization

#### Example:
```typescript
Scheduling Result:
- 5 candidates analyzed
- 2 candidates blocked (buffer violations)
- Conflicts avoided: 2
- Iterations prevented: 2 × 2 = 4
- Minutes saved: 4 × 15 = 60 minutes

Result: 🎉 1 hour saved from smart enforcement!
```

---

### 5. 🔄 Recurring Meeting Optimization

**Problem**: Recurring meetings with consistently low scores waste time weekly.

**Solution**: Detect bad recurring slots and suggest optimized alternatives.

#### How It Works:
- Track recurring meeting scores over time
- If average score < 70 for 3+ occurrences → Flag for optimization
- Analyze calendar patterns to find better slots
- Suggest alternative time (requires user approval)

#### Example:
```typescript
Weekly Standup: Monday 9:00 AM
Score history: [55, 62, 58, 60] → Avg: 58.75

Analysis: "Consistently low scores due to Monday morning conflicts"

Suggested Alternative: Tuesday 10:00 AM
Expected score: 85

Status: Pending user approval
```

---

## 🗄️ Database Schema

### New Columns in `meetings` Table:
```sql
enforcement_status          TEXT      -- 'pending' | 'passed' | 'blocked' | 'warning'
enforcement_rules_applied   JSONB     -- ['buffer_time', 'travel_time']
enforcement_blocks          JSONB     -- [{ rule, reason }]
cancellation_risk           TEXT      -- 'low' | 'medium' | 'high'
cancellation_risk_factors   JSONB     -- { density: 32, late_day: 11, ... }
time_savings_minutes        INTEGER   -- Time saved from enforcement
time_savings_metrics        JSONB     -- { conflicts_avoided: 2, ... }
buffer_violations           INTEGER   -- Count of buffer violations
travel_violations           INTEGER   -- Count of travel violations
```

### New Tables:

#### `enforcement_logs`
Stores every enforcement decision for traceability.
```sql
id               UUID PRIMARY KEY
meeting_id       TEXT NOT NULL
rule_type        TEXT NOT NULL  -- 'buffer_time' | 'travel_time' | etc.
rule_action      TEXT NOT NULL  -- 'pass' | 'block' | 'warn'
rule_details     JSONB NOT NULL -- Enforcement details
candidate_slot   JSONB          -- Affected slot
enforced_at      TIMESTAMPTZ
```

#### `recurring_meeting_analysis`
Tracks recurring meeting optimization suggestions.
```sql
id                  UUID PRIMARY KEY
meeting_pattern_id  TEXT NOT NULL     -- 'weekly-standup-mon-9am'
participant_emails  TEXT[]
current_slot        JSONB             -- { day, time, duration }
avg_score           NUMERIC(5,2)
score_history       JSONB             -- [{ date, score }]
suggested_slot      JSONB             -- { day, time, expected_score }
optimization_reason TEXT
status              TEXT              -- 'pending' | 'approved' | 'applied'
```

### New Views:

#### `v_enforcement_summary`
Quick overview of enforcement decisions.
```sql
SELECT 
    meeting_id,
    enforcement_status,
    cancellation_risk,
    time_savings_minutes,
    total_blocks
FROM v_enforcement_summary;
```

#### `v_recurring_optimization_opportunities`
Meetings that need better slots.
```sql
SELECT *
FROM v_recurring_optimization_opportunities
WHERE avg_score < 70 AND status = 'pending';
```

#### `v_time_savings_report`
Aggregate time savings metrics.
```sql
SELECT 
    total_meetings,
    total_minutes_saved,
    meetings_blocked,
    high_risk_meetings
FROM v_time_savings_report;
```

---

## 🔌 API Endpoints

### POST /api/schedule (Enhanced)

**New Behavior**: After AI scoring, apply enforcement rules and filter candidates.

**Response Enhancement**:
```json
{
  "candidates": [
    {
      "datetime_utc": "2026-02-14T14:00:00Z",
      "score": 82,
      "enforcement": {
        "status": "pass",
        "cancellation_risk": "low",
        "cancellation_risk_score": 25,
        "time_savings_minutes": 30,
        "warnings": []
      }
    }
  ],
  "enforcement_summary": {
    "total_candidates": 10,
    "passed": 7,
    "blocked": 2,
    "warnings": 1
  }
}
```

**Headers Added**:
- `X-Enforcement-Blocked`: Number of blocked candidates
- `X-Enforcement-Warned`: Number of warned candidates

---

### POST /api/recurring/analyze

Analyze recurring meetings and suggest optimizations.

**Request**:
```json
{
  "patterns": [
    {
      "pattern_id": "weekly-standup",
      "day_of_week": "Monday",
      "time": "09:00",
      "duration": 30,
      "participant_emails": ["user1@example.com", "user2@example.com"],
      "occurrences": [
        { "date": "2026-01-06", "score": 55 },
        { "date": "2026-01-13", "score": 62 },
        { "date": "2026-01-20", "score": 58 }
      ]
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "analyzed": 1,
  "suggestions": [
    {
      "pattern_id": "weekly-standup",
      "current_slot": {
        "day": "Monday",
        "time": "09:00",
        "avg_score": 58.3
      },
      "suggested_slot": {
        "day": "Tuesday",
        "time": "10:00",
        "expected_score": 85
      },
      "reason": "Consistently low scores due to Monday morning conflicts",
      "status": "pending"
    }
  ]
}
```

---

### GET /api/recurring/analyze

Get pending optimization suggestions.

**Response**:
```json
{
  "success": true,
  "count": 3,
  "opportunities": [
    {
      "meeting_pattern_id": "weekly-standup",
      "current_slot": { "day": "Monday", "time": "09:00" },
      "avg_score": 58.3,
      "suggested_slot": { "day": "Tuesday", "time": "10:00" },
      "status": "pending"
    }
  ]
}
```

---

### PATCH /api/recurring/analyze

Approve/reject optimization suggestions.

**Request**:
```json
{
  "suggestion_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "status": "approved"
}
```

**Response**:
```json
{
  "success": true,
  "suggestion": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "status": "approved",
    "updated_at": "2026-02-09T18:30:00Z"
  }
}
```

---

## 🧪 Testing

### Step 1: Run Database Migration

```bash
# In Supabase SQL Editor:
# Run: supabase/migrations/004_scheduling_enforcement.sql
```

Verify:
```sql
-- Check new columns added
SELECT 
    enforcement_status,
    cancellation_risk,
    time_savings_minutes
FROM meetings LIMIT 1;

-- Check new tables created
SELECT COUNT(*) FROM enforcement_logs;
SELECT COUNT(*) FROM recurring_meeting_analysis;

-- Check views work
SELECT * FROM v_time_savings_report;
```

---

### Step 2: Test Buffer Time Enforcement

```powershell
# Schedule a meeting on a dense day
$body = @{
    meeting_id = "stage6-buffer-test-$(Get-Date -Format 'yyyyMMddHHmmss')"
    participant_emails = @("lilanivansh@gmail.com", "test@example.com")
    constraints = @{
        duration_minutes = 30
        earliest_date = (Get-Date).AddDays(3).ToString("yyyy-MM-ddTHH:mm:ssZ")
        latest_date = (Get-Date).AddDays(5).ToString("yyyy-MM-ddTHH:mm:ssZ")
        working_hours_start = 9
        working_hours_end = 17
        buffer_minutes = 15  # Enforce 15-minute buffer
        timezone = "America/New_York"
        max_candidates = 10
    }
} | ConvertTo-Json -Depth 10

$result = Invoke-RestMethod `
    -Uri "http://localhost:3000/api/schedule" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

# Check enforcement headers
Write-Host "Blocked candidates: $($result.enforcement_summary.blocked)" -ForegroundColor Yellow
Write-Host "Warned candidates: $($result.enforcement_summary.warnings)" -ForegroundColor Yellow

# Check first candidate enforcement details
$candidate = $result.candidates[0]
Write-Host "`nFirst candidate:" -ForegroundColor Cyan
Write-Host "  Score: $($candidate.score)"
Write-Host "  Enforcement status: $($candidate.enforcement.status)"
Write-Host "  Cancellation risk: $($candidate.enforcement.cancellation_risk)"
Write-Host "  Time savings: $($candidate.enforcement.time_savings_minutes) min"
```

**Expected Result**:
- Some candidates blocked due to buffer violations
- Enforcement summary shows blocked/warned counts
- Each candidate has enforcement metadata

---

### Step 3: Test Travel Time Constraints

Create a test with location-based events:

```sql
-- Add location data to test user's calendar
INSERT INTO compressed_calendars (user_id, email, events, compressed_at)
VALUES (
    'e5f33381-a917-4e89-8eeb-61dae6811896',
    'lilanivansh@gmail.com',
    '[
        {
            "start": "2026-02-12T10:00:00Z",
            "end": "2026-02-12T10:30:00Z",
            "summary": "Meeting at Building A",
            "location": "Building A, Room 301"
        },
        {
            "start": "2026-02-12T11:00:00Z",
            "end": "2026-02-12T11:30:00Z",
            "summary": "Meeting at Building C",
            "location": "Building C, Room 105"
        }
    ]'::jsonb,
    NOW()
)
ON CONFLICT (user_id) DO UPDATE 
SET events = EXCLUDED.events, compressed_at = NOW();
```

Now schedule a meeting between these two locations:

```powershell
# This should be blocked due to insufficient travel time
$body = @{
    meeting_id = "stage6-travel-test"
    participant_emails = @("lilanivansh@gmail.com")
    constraints = @{
        duration_minutes = 30
        earliest_date = "2026-02-12T10:00:00Z"
        latest_date = "2026-02-12T12:00:00Z"
        buffer_minutes = 10
        timezone = "America/New_York"
        max_candidates = 5
    }
} | ConvertTo-Json -Depth 10

$result = Invoke-RestMethod `
    -Uri "http://localhost:3000/api/schedule" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

# Check for travel time blocks
Write-Host "Enforcement blocks:" -ForegroundColor Yellow
$result.candidates | ForEach-Object {
    if ($_.enforcement.warnings.Count -gt 0) {
        Write-Host "  WARN: $($_.datetime_local)" -ForegroundColor Yellow
        $_.enforcement.warnings | ForEach-Object { Write-Host "    - $_" }
    }
}
```

---

### Step 4: Test Cancellation Risk Scoring

```powershell
# Schedule late-day meeting on dense day
$body = @{
    meeting_id = "stage6-risk-test"
    participant_emails = @("lilanivansh@gmail.com", "test@example.com")
    constraints = @{
        duration_minutes = 60
        earliest_date = (Get-Date).AddDays(3).Date.AddHours(16).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        latest_date = (Get-Date).AddDays(3).Date.AddHours(19).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        working_hours_start = 9
        working_hours_end = 19
        buffer_minutes = 10
        timezone = "America/New_York"
        max_candidates = 5
    }
} | ConvertTo-Json -Depth 10

$result = Invoke-RestMethod `
    -Uri "http://localhost:3000/api/schedule" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

# Check cancellation risk scores
Write-Host "Cancellation Risk Analysis:" -ForegroundColor Yellow
$result.candidates | ForEach-Object {
    $risk = $_.enforcement.cancellation_risk
    $score = $_.enforcement.cancellation_risk_score
    $color = if ($risk -eq 'high') { 'Red' } elseif ($risk -eq 'medium') { 'Yellow' } else { 'Green' }
    Write-Host "  $($_.datetime_local): $risk ($score/100)" -ForegroundColor $color
}
```

---

### Step 5: Test Recurring Meeting Analysis

```powershell
# Analyze recurring pattern with low scores
$body = @{
    patterns = @(
        @{
            pattern_id = "weekly-standup-mon-9am"
            day_of_week = "Monday"
            time = "09:00"
            duration = 30
            participant_emails = @("lilanivansh@gmail.com", "test@example.com")
            occurrences = @(
                @{ date = "2026-01-06"; score = 55 },
                @{ date = "2026-01-13"; score = 62 },
                @{ date = "2026-01-20"; score = 58 },
                @{ date = "2026-01-27"; score = 60 }
            )
        }
    )
} | ConvertTo-Json -Depth 10

$result = Invoke-RestMethod `
    -Uri "http://localhost:3000/api/recurring/analyze" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

Write-Host "`n🔄 Recurring Meeting Analysis:" -ForegroundColor Cyan
$result.suggestions | ForEach-Object {
    Write-Host "Pattern: $($_.pattern_id)" -ForegroundColor Yellow
    Write-Host "  Current: $($_.current_slot.day) $($_.current_slot.time) (avg score: $($_.current_slot.avg_score))"
    Write-Host "  Suggested: $($_.suggested_slot.day) $($_.suggested_slot.time) (expected: $($_.suggested_slot.expected_score))"
    Write-Host "  Reason: $($_.reason)"
}

# Get pending suggestions
$pending = Invoke-RestMethod -Uri "http://localhost:3000/api/recurring/analyze" -Method GET
Write-Host "`nPending optimizations: $($pending.count)" -ForegroundColor Cyan
```

---

### Step 6: Query Enforcement Metrics

```sql
-- Overall time savings
SELECT * FROM v_time_savings_report;

-- Enforcement decisions
SELECT 
    meeting_id,
    enforcement_status,
    cancellation_risk,
    time_savings_minutes,
    buffer_violations,
    travel_violations
FROM meetings
WHERE enforcement_status != 'pending'
ORDER BY created_at DESC
LIMIT 10;

-- Enforcement logs
SELECT 
    meeting_id,
    rule_type,
    rule_action,
    rule_details,
    enforced_at
FROM enforcement_logs
ORDER BY enforced_at DESC
LIMIT 20;

-- Recurring optimization opportunities
SELECT * FROM v_recurring_optimization_opportunities;
```

---

## 📊 Success Metrics

### Before Stage 6:
- ❌ AI suggests candidates, but bad ones slip through
- ❌ Back-to-back meetings cause burnout
- ❌ Impossible travel transitions get scheduled
- ❌ High-risk meetings fail last-minute
- ❌ No visibility into scheduling efficiency

### After Stage 6:
- ✅ Bad candidates **blocked before** reaching calendar
- ✅ Buffer time **enforced dynamically** based on density
- ✅ Travel time **validated** for location transitions
- ✅ Cancellation risk **scored and explained**
- ✅ Time savings **measured and tracked**
- ✅ Recurring meetings **optimized proactively**

### Quantitative Goals:
- **95%+ buffer compliance**: Meetings have adequate buffer time
- **Zero travel violations**: No impossible location transitions
- **60+ min/week saved**: Measured time savings per user
- **30%+ fewer high-risk meetings**: Risk-aware scheduling

---

## 🚀 What's Next?

### Optional Enhancements:

1. **Google Maps Integration**  
   Replace heuristic travel times with real distance calculations.

2. **Machine Learning Risk Model**  
   Train on historical cancellation data for better risk predictions.

3. **Smart Buffer Learning**  
   Personalize buffer requirements based on user behavior.

4. **Batch Optimization**  
   Suggest moving multiple meetings to optimize entire day.

5. **Analytics Dashboard**  
   Visualize enforcement metrics and time savings over time.

---

## 🎉 Stage 6 Complete!

The AI Meeting Scheduler now enforces real-world scheduling intelligence:

| Stage | Feature | Status |
|-------|---------|--------|
| Stage 1 | Python AI Brain with 4 agents | ✅ Complete |
| Stage 2 | Next.js orchestrator + scoring | ✅ Complete |
| Stage 3 | Supabase persistence | ✅ Complete |
| Stage 4 | Google Calendar sync + compression | ✅ Complete |
| Stage 5 | Calendar write-back | ✅ Complete |
| **Stage 6** | **Scheduling Intelligence Enforcement** | ✅ **Complete** |

**Total Implementation**: ~3,500 lines of production code across 6 stages.

The system now provides:
- 🔒 **Enforcement**: Hard constraints prevent bad meetings
- 🎯 **Intelligence**: AI scores + real-world rules
- 📊 **Visibility**: Every decision is logged and explainable
- ⏱️ **Efficiency**: Measurable time savings per meeting

**Ready for production use!** 🚀
