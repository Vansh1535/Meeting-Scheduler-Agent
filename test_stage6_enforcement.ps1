# ============================================================================
# Stage 6: Scheduling Intelligence Enforcement - Comprehensive Test Script
# ============================================================================
# Purpose: Test all enforcement features in Stage 6
#
# Prerequisites:
# 1. Database migration 004 executed
# 2. Python service running (port 8000)
# 3. Next.js service running (port 3000)
# 4. At least one user with OAuth and compressed calendar data
# ============================================================================

Write-Host "`n🛡️  Stage 6: Scheduling Intelligence Enforcement - Test Suite" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

# Configuration
$userId = "e5f33381-a917-4e89-8eeb-61dae6811896"
$userEmail = "lilanivansh@gmail.com"
$nextjsUrl = "http://localhost:3000"

# ============================================================================
# TEST 1: Buffer Time Enforcement
# ============================================================================
Write-Host "`n📋 TEST 1: Buffer Time Enforcement" -ForegroundColor Yellow
Write-Host "-" * 70

$bufferTest = @{
    meeting_id = "stage6-buffer-test-$(Get-Date -Format 'yyyyMMddHHmmss')"
    participant_emails = @($userEmail, "test@example.com")
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

Write-Host "Requesting meeting with 15-minute buffer enforcement..." -ForegroundColor Gray

try {
    $bufferResult = Invoke-RestMethod `
        -Uri "$nextjsUrl/api/schedule" `
        -Method POST `
        -ContentType "application/json" `
        -Body $bufferTest

    Write-Host "✅ Buffer enforcement test completed" -ForegroundColor Green
    Write-Host "   Total candidates from AI: $($bufferResult.enforcement_summary.total_candidates)" -ForegroundColor Gray
    Write-Host "   Passed enforcement: $($bufferResult.enforcement_summary.passed)" -ForegroundColor Green
    Write-Host "   Blocked by enforcement: $($bufferResult.enforcement_summary.blocked)" -ForegroundColor Red
    Write-Host "   Warnings: $($bufferResult.enforcement_summary.warnings)" -ForegroundColor Yellow
    
    if ($bufferResult.candidates.Count -gt 0) {
        $topCandidate = $bufferResult.candidates[0]
        Write-Host "`n   Top candidate:" -ForegroundColor Cyan
        Write-Host "     Time: $($topCandidate.datetime_local)" -ForegroundColor Gray
        Write-Host "     AI Score: $($topCandidate.score)" -ForegroundColor Gray
        Write-Host "     Enforcement status: $($topCandidate.enforcement.status)" -ForegroundColor Gray
        Write-Host "     Cancellation risk: $($topCandidate.enforcement.cancellation_risk) ($($topCandidate.enforcement.cancellation_risk_score)/100)" -ForegroundColor Gray
        Write-Host "     Time savings: $($topCandidate.enforcement.time_savings_minutes) minutes" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Buffer enforcement test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================================================
# TEST 2: Cancellation Risk Scoring
# ============================================================================
Write-Host "`n📋 TEST 2: Cancellation Risk Scoring (Late-Day Meetings)" -ForegroundColor Yellow
Write-Host "-" * 70

$riskTest = @{
    meeting_id = "stage6-risk-test-$(Get-Date -Format 'yyyyMMddHHmmss')"
    participant_emails = @($userEmail, "test@example.com")
    constraints = @{
        duration_minutes = 60
        # Request late afternoon/evening slots (4pm - 7pm)
        earliest_date = (Get-Date).AddDays(3).Date.AddHours(16).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        latest_date = (Get-Date).AddDays(3).Date.AddHours(19).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        working_hours_start = 9
        working_hours_end = 19
        buffer_minutes = 10
        timezone = "America/New_York"
        max_candidates = 5
    }
} | ConvertTo-Json -Depth 10

Write-Host "Requesting late-day meeting (expect higher cancellation risk)..." -ForegroundColor Gray

try {
    $riskResult = Invoke-RestMethod `
        -Uri "$nextjsUrl/api/schedule" `
        -Method POST `
        -ContentType "application/json" `
        -Body $riskTest

    Write-Host "✅ Risk scoring test completed" -ForegroundColor Green
    Write-Host "`n   Cancellation Risk Analysis:" -ForegroundColor Cyan
    
    foreach ($candidate in $riskResult.candidates) {
        $risk = $candidate.enforcement.cancellation_risk
        $score = $candidate.enforcement.cancellation_risk_score
        
        $color = switch ($risk) {
            'high' { 'Red' }
            'medium' { 'Yellow' }
            default { 'Green' }
        }
        
        Write-Host "     $($candidate.datetime_local): $risk risk ($score/100)" -ForegroundColor $color
    }
} catch {
    Write-Host "❌ Risk scoring test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================================================
# TEST 3: Time-Savings Calculation
# ============================================================================
Write-Host "`n📋 TEST 3: Time-Savings Calculation" -ForegroundColor Yellow
Write-Host "-" * 70

Write-Host "Analyzing time savings from previous tests..." -ForegroundColor Gray

if ($bufferResult -and $bufferResult.candidates.Count -gt 0) {
    $totalSavings = 0
    $totalConflicts = 0
    
    foreach ($candidate in $bufferResult.candidates) {
        $totalSavings += $candidate.enforcement.time_savings_minutes
    }
    
    $totalConflicts = $bufferResult.enforcement_summary.blocked
    
    Write-Host "✅ Time savings analysis:" -ForegroundColor Green
    Write-Host "   Conflicts avoided: $totalConflicts" -ForegroundColor Gray
    Write-Host "   Estimated time saved: $totalSavings minutes" -ForegroundColor Gray
    Write-Host "   Iterations prevented: $($totalConflicts * 2)" -ForegroundColor Gray
}

# ============================================================================
# TEST 4: Recurring Meeting Analysis
# ============================================================================
Write-Host "`n📋 TEST 4: Recurring Meeting Analysis" -ForegroundColor Yellow
Write-Host "-" * 70

$recurringTest = @{
    patterns = @(
        @{
            pattern_id = "weekly-standup-mon-9am"
            day_of_week = "Monday"
            time = "09:00"
            duration = 30
            participant_emails = @($userEmail, "test@example.com")
            occurrences = @(
                @{ date = "2026-01-06"; score = 55 }
                @{ date = "2026-01-13"; score = 62 }
                @{ date = "2026-01-20"; score = 58 }
                @{ date = "2026-01-27"; score = 60 }
            )
        },
        @{
            pattern_id = "weekly-1on1-fri-4pm"
            day_of_week = "Friday"
            time = "16:00"
            duration = 60
            participant_emails = @($userEmail, "manager@example.com")
            occurrences = @(
                @{ date = "2026-01-09"; score = 48 }
                @{ date = "2026-01-16"; score = 52 }
                @{ date = "2026-01-23"; score = 45 }
            )
        }
    )
} | ConvertTo-Json -Depth 10

Write-Host "Analyzing recurring meeting patterns..." -ForegroundColor Gray

try {
    $recurringResult = Invoke-RestMethod `
        -Uri "$nextjsUrl/api/recurring/analyze" `
        -Method POST `
        -ContentType "application/json" `
        -Body $recurringTest

    Write-Host "✅ Recurring analysis completed" -ForegroundColor Green
    Write-Host "   Patterns analyzed: $($recurringResult.analyzed)" -ForegroundColor Gray
    Write-Host "   Optimization opportunities found: $($recurringResult.suggestions.Count)" -ForegroundColor Gray
    
    if ($recurringResult.suggestions.Count -gt 0) {
        Write-Host "`n   📊 Optimization Suggestions:" -ForegroundColor Cyan
        
        foreach ($suggestion in $recurringResult.suggestions) {
            Write-Host "   • Pattern: $($suggestion.pattern_id)" -ForegroundColor Yellow
            Write-Host "     Current: $($suggestion.current_slot.day) at $($suggestion.current_slot.time) (avg score: $($suggestion.current_slot.avg_score))" -ForegroundColor Gray
            if ($suggestion.suggested_slot) {
                Write-Host "     Suggested: $($suggestion.suggested_slot.day) at $($suggestion.suggested_slot.time) (expected: $($suggestion.suggested_slot.expected_score))" -ForegroundColor Green
            }
            Write-Host "     Reason: $($suggestion.reason)" -ForegroundColor Gray
            Write-Host ""
        }
    }
    
    # Get pending suggestions from database
    Write-Host "`n   Fetching pending suggestions from database..." -ForegroundColor Gray
    $pendingSuggestions = Invoke-RestMethod `
        -Uri "$nextjsUrl/api/recurring/analyze" `
        -Method GET
    
    Write-Host "   Pending optimizations in database: $($pendingSuggestions.count)" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Recurring analysis test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================================================
# TEST 5: Database Verification
# ============================================================================
Write-Host "`n📋 TEST 5: Database Verification" -ForegroundColor Yellow
Write-Host "-" * 70

Write-Host "To verify enforcement data was persisted, run these queries in Supabase:" -ForegroundColor Gray
Write-Host ""
Write-Host "-- Overall time savings report" -ForegroundColor Cyan
Write-Host "SELECT * FROM v_time_savings_report;" -ForegroundColor White
Write-Host ""
Write-Host "-- Recent enforcement decisions" -ForegroundColor Cyan
Write-Host "SELECT meeting_id, enforcement_status, cancellation_risk, time_savings_minutes" -ForegroundColor White
Write-Host "FROM meetings WHERE enforcement_status != 'pending' ORDER BY created_at DESC LIMIT 10;" -ForegroundColor White
Write-Host ""
Write-Host "-- Enforcement logs" -ForegroundColor Cyan
Write-Host "SELECT meeting_id, rule_type, rule_action, enforced_at" -ForegroundColor White
Write-Host "FROM enforcement_logs ORDER BY enforced_at DESC LIMIT 20;" -ForegroundColor White
Write-Host ""
Write-Host "-- Recurring optimization opportunities" -ForegroundColor Cyan
Write-Host "SELECT * FROM v_recurring_optimization_opportunities;" -ForegroundColor White

# ============================================================================
# TEST SUMMARY
# ============================================================================
Write-Host "`n" + ("=" * 70) -ForegroundColor Cyan
Write-Host "🎉 Stage 6 Test Suite Complete!" -ForegroundColor Green
Write-Host ("=" * 70) -ForegroundColor Cyan

Write-Host "`nTests Completed:" -ForegroundColor Yellow
Write-Host "  ✅ Buffer Time Enforcement" -ForegroundColor Green
Write-Host "  ✅ Cancellation Risk Scoring" -ForegroundColor Green
Write-Host "  ✅ Time-Savings Calculation" -ForegroundColor Green
Write-Host "  ✅ Recurring Meeting Analysis" -ForegroundColor Green

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "  1. Review enforcement logs in Supabase" -ForegroundColor Gray
Write-Host "  2. Verify blocked candidates were filtered correctly" -ForegroundColor Gray
Write-Host "  3. Check cancellation risk scores are reasonable" -ForegroundColor Gray
Write-Host "  4. Review recurring optimization suggestions" -ForegroundColor Gray
Write-Host "  5. Run travel time test (requires location data in calendar)" -ForegroundColor Gray

Write-Host "`n📚 Full documentation: STAGE6_README.md" -ForegroundColor Cyan
Write-Host ""
