# 🧪 Testing Documentation

Comprehensive test suite for the AI Meeting Scheduler Agent covering all 6 stages.

---

## 📋 Quick Reference

| Test File | Stage | Purpose | Duration |
|-----------|-------|---------|----------|
| `test_stage4.ps1` | 4 | Google Calendar sync + compression | ~30s |
| `test_stage5_simple.ps1` | 5 | Calendar write-back (simple) | ~20s |
| `test_stage5_writeback.ps1` | 5 | Calendar write-back (full) | ~30s |
| `test_stage6_quick.ps1` | 6 | Quick enforcement validation | ~15s |
| `test_stage6_enforcement.ps1` | 6 | Full enforcement test suite | ~2min |

---

## 🚀 Prerequisites

**Services Running**:
- ✅ Python service on `http://localhost:8000`
- ✅ Next.js service on `http://localhost:3000`
- ✅ Supabase database accessible

**OAuth Setup**:
- ✅ Google Calendar OAuth completed
- ✅ Full calendar access granted
- ✅ At least one participant with calendar data

**Environment Variables**:
```bash
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-secret>
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-key>
```

---

## 🧪 Test Descriptions

### Stage 4: Google Calendar Integration

**File**: `test_stage4.ps1`

**What It Tests**:
- ✅ OAuth token validation
- ✅ Google Calendar API connectivity
- ✅ Multi-participant calendar fetch
- ✅ ScaleDown compression (verifies 80-90% size reduction)
- ✅ Database persistence of compressed calendars

**Usage**:
```powershell
# From project root
.\test\test_stage4.ps1

# Or from test directory
cd test
.\test_stage4.ps1
```

**Expected Output**:
- JSON with compressed calendar data
- Compression metrics showing ~80-90% reduction
- Database confirmation of stored data

**Sample JSON Input**: `test_stage4_schedule.json`

---

### Stage 5: Calendar Write-Back

**Files**:
- `test_stage5_simple.ps1` - Quick write test
- `test_stage5_writeback.ps1` - Full validation

**What It Tests**:
- ✅ Calendar event creation
- ✅ Attendee invitations
- ✅ Google Meet link generation
- ✅ Event metadata (summary, description, location)
- ✅ Idempotency (safe retry logic)

**Usage**:
```powershell
# Simple test (quick)
.\test\test_stage5_simple.ps1

# Full test (comprehensive)
.\test\test_stage5_writeback.ps1
```

**Expected Output**:
- Created event with Google Calendar link
- Attendee list confirmation
- Google Meet conference details
- Event ID for verification

**Verification**:
- Check participant's Google Calendar
- Confirm event appears with correct time/attendees
- Verify Google Meet link works

---

### Stage 6: Enforcement Layer

**Files**:
- `test_stage6_quick.ps1` - Fast validation (15s)
- `test_stage6_enforcement.ps1` - Full test suite (2min)

#### Quick Test (`test_stage6_quick.ps1`)

**What It Tests**:
- ✅ Enforcement integration in /api/schedule
- ✅ Buffer time enforcement
- ✅ Travel time validation
- ✅ Cancellation risk scoring
- ✅ Time-savings calculation

**Usage**:
```powershell
.\test\test_stage6_quick.ps1
```

**Expected Output**:
```
Enforcement Summary:
Total Candidates: 10
Passed: 10
Blocked: 0
Warnings: 0

Top Candidate:
Time: Monday, February 10, 2026 2:00 PM
AI Score: 87.7/100
Enforcement Status: pass
Cancellation Risk: low (7/100)
Time Saved: 0 minutes
```

**What Success Looks Like**:
- No parsing errors
- Enforcement summary with candidate counts
- Top candidate with risk < 30 (low)
- Database logs created (verify with SQL)

---

#### Full Test Suite (`test_stage6_enforcement.ps1`)

**What It Tests**:

**Test 1: Buffer Time Enforcement**
- Validates dynamic buffer calculation
- Blocks candidates with insufficient spacing
- Warns on marginal buffers (5-10 min)

**Test 2: Travel Time Validation**
- Detects location changes
- Blocks impossible travel (<25 min)
- Warns on tight transitions (25-30 min)

**Test 3: Cancellation Risk Scoring**
- Scores based on 4 factors:
  - Calendar density (40 points)
  - Late-day penalty (30 points)
  - AI score confidence (20 points)
  - Historical changes (10 points)
- Categories: low (<30), medium (30-60), high (>60)

**Test 4: Time-Savings Calculation**
- Tracks conflicts avoided × iterations × 15 min
- Measures efficiency gains

**Test 5: Recurring Meeting Analysis**
- Detects low-scoring patterns (avg <70)
- Suggests better slots
- Analyzes 3+ occurrences

**Test 6: Database Verification**
- Confirms enforcement logs created
- Validates recurring analysis records
- Checks view queries

**Usage**:
```powershell
# Run full suite
.\test\test_stage6_enforcement.ps1

# Expected duration: ~2 minutes
```

**Expected Output**:
- Each test displays pass/fail status
- Color-coded results (Green = Success, Yellow = Warning, Red = Error)
- Database query results confirming data persistence

---

## 🐛 Troubleshooting

### Common Issues

**1. "Could not send the request: (500) Internal Server Error"**
- **Cause**: Server not running or code changes not picked up
- **Fix**: Restart Next.js server (`Ctrl+C`, then `npm run dev`)

**2. "The string is missing the terminator"**
- **Cause**: PowerShell encoding issue (rare after emoji fix)
- **Fix**: Re-save test file with UTF-8 encoding

**3. "No enforcement logs found in database"**
- **Cause**: Database connection issue or function not created
- **Fix**: Run migration `004_scheduling_enforcement.sql` in Supabase

**4. "OAuth token expired"**
- **Cause**: Refresh token invalidated
- **Fix**: Re-run OAuth flow from Next.js app

**5. "Supabase connection failed"**
- **Cause**: Invalid credentials or network issue
- **Fix**: Verify `.env.local` has correct `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

**6. Zero candidates returned**
- **Cause**: Constraints too strict (no available slots)
- **Fix**: Expand date range or relax constraints in test JSON

---

## 📊 Test Result Interpretation

### Enforcement Summary Metrics

**Good Results**:
- Passed: 8-10 candidates (healthy slot availability)
- Blocked: 0-2 candidates (minimal violations)
- Warnings: 0-2 candidates (minor issues)

**Concerning Results**:
- Passed: <5 candidates (constraints too strict)
- Blocked: >5 candidates (schedule too congested)
- All candidates blocked (need to relax constraints)

### Risk Scores

| Range | Category | Action |
|-------|----------|--------|
| 0-29 | Low | Safe to schedule |
| 30-59 | Medium | Review factors, consider alternatives |
| 60-100 | High | Avoid scheduling, find better slot |

---

## 🔍 Database Verification Queries

After running tests, verify results in Supabase:

```sql
-- Check enforcement logs
SELECT * FROM enforcement_logs 
ORDER BY created_at DESC 
LIMIT 20;

-- View enforcement summary
SELECT * FROM v_enforcement_summary;

-- Check recurring analysis
SELECT * FROM recurring_meeting_analysis
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Time savings report
SELECT * FROM v_time_savings_report;

-- Optimization opportunities (recurring meetings scoring <70)
SELECT * FROM v_recurring_optimization_opportunities;
```

---

## 🎯 Test Coverage

| Feature | Test Coverage | Status |
|---------|--------------|--------|
| **OAuth Flow** | Stage 4 | ✅ |
| **Calendar Sync** | Stage 4 | ✅ |
| **Compression** | Stage 4 | ✅ |
| **AI Scoring** | Stage 4 | ✅ |
| **Event Creation** | Stage 5 | ✅ |
| **Meet Links** | Stage 5 | ✅ |
| **Buffer Enforcement** | Stage 6 | ✅ |
| **Travel Validation** | Stage 6 | ✅ |
| **Risk Scoring** | Stage 6 | ✅ |
| **Time-Savings** | Stage 6 | ✅ |
| **Recurring Analysis** | Stage 6 | ✅ |

**Total Coverage**: 11/11 features (100%)

---

## 📝 Creating Custom Tests

### PowerShell Test Template

```powershell
# Set API base URL
$baseUrl = "http://localhost:3000"

# Define test payload
$payload = @{
    meeting_id = "test-001"
    participant_emails = @("user@example.com")
    constraints = @{
        duration_minutes = 30
        earliest_date = "2026-02-10T00:00:00Z"
        latest_date = "2026-02-14T23:59:59Z"
    }
} | ConvertTo-Json -Depth 10

# Make API call
$response = Invoke-RestMethod `
    -Uri "$baseUrl/api/schedule" `
    -Method Post `
    -Body $payload `
    -ContentType "application/json"

# Display results
Write-Host "Response:" -ForegroundColor Green
$response | ConvertTo-Json -Depth 10
```

---

## 🏃 Running Tests in CI/CD

### GitHub Actions Example

```yaml
name: Run Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Start Python service
        run: |
          cd python-service
          pip install -r requirements.txt
          python main.py &
      
      - name: Start Next.js service
        run: |
          cd nextjs-orchestrator
          npm install
          npm run dev &
      
      - name: Wait for services
        run: Start-Sleep -Seconds 30
      
      - name: Run Stage 6 Quick Test
        run: .\test\test_stage6_quick.ps1
```

---

## 📖 Additional Resources

- [Integration Guide](../docs/INTEGRATION_GUIDE.md) - Full setup instructions
- [Stage 6 README](../docs/STAGE6_README.md) - Enforcement layer details
- [AI Scoring System](../docs/AI_SCORING_SYSTEM.md) - How agents score candidates

---

## 💡 Tips

1. **Always run quick test first**: Use `test_stage6_quick.ps1` before full suite
2. **Check both services**: Ensure Python (8000) and Next.js (3000) are running
3. **Database verification**: Always check Supabase after tests
4. **Restart on import changes**: Code changes to imports require server restart
5. **Save test data**: Keep JSON payloads for regression testing

---

## ✅ Test Checklist

Before running tests, verify:
- [ ] Python service running on port 8000
- [ ] Next.js service running on port 3000
- [ ] OAuth token valid (check Google Calendar access)
- [ ] Supabase accessible (verified via SQL Editor)
- [ ] Environment variables set correctly
- [ ] At least one participant with calendar data

---

**Happy Testing! 🚀**

For issues or questions, see [GitHub Issues](https://github.com/Vansh1535/Meeting-Scheduler-Agent/issues).
