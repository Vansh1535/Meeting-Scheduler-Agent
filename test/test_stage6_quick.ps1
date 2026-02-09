# ============================================================================
# Stage 6: Quick Test - Buffer Time Enforcement
# ============================================================================
# Simple test to verify Stage 6 enforcement is working
# ============================================================================

Write-Host "`nStage 6: Quick Enforcement Test" -ForegroundColor Cyan
Write-Host "=" * 60

$meetingId = "stage6-quick-test-$(Get-Date -Format 'yyyyMMddHHmmss')"

$body = @{
    meeting_id = $meetingId
    participant_emails = @("lilanivansh@gmail.com", "test@example.com")
    constraints = @{
        duration_minutes = 30
        earliest_date = (Get-Date).AddDays(3).ToString("yyyy-MM-ddTHH:mm:ssZ")
        latest_date = (Get-Date).AddDays(5).ToString("yyyy-MM-ddTHH:mm:ssZ")
        working_hours_start = 9
        working_hours_end = 17
        buffer_minutes = 15
        timezone = "America/New_York"
        max_candidates = 10
    }
} | ConvertTo-Json -Depth 10

Write-Host "`nScheduling meeting with buffer enforcement..." -ForegroundColor Yellow
Write-Host "   Buffer required: 15 minutes" -ForegroundColor Gray
Write-Host "   Meeting ID: $meetingId" -ForegroundColor Gray

$result = Invoke-RestMethod `
    -Uri "http://localhost:3000/api/schedule" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

Write-Host "`nScheduling complete!" -ForegroundColor Green

# Display enforcement summary
Write-Host "`nEnforcement Summary:" -ForegroundColor Cyan
Write-Host "   Total candidates: $($result.enforcement_summary.total_candidates)" -ForegroundColor Gray
Write-Host "   Passed: $($result.enforcement_summary.passed)" -ForegroundColor Green  
Write-Host "   Blocked: $($result.enforcement_summary.blocked)" -ForegroundColor Red
Write-Host "   Warnings: $($result.enforcement_summary.warnings)" -ForegroundColor Yellow

# Display top candidate details
if ($result.candidates.Count -gt 0) {
    $top = $result.candidates[0]
    
    Write-Host "`nTop Candidate:" -ForegroundColor Cyan
    Write-Host "   Time: $($top.datetime_local)" -ForegroundColor Gray
    Write-Host "   AI Score: $($top.score)/100" -ForegroundColor Gray
    Write-Host "   Enforcement: $($top.enforcement.status)" -ForegroundColor Gray
    
    $riskColor = switch ($top.enforcement.cancellation_risk) {
        'high' { 'Red' }
        'medium' { 'Yellow' }
        default { 'Green' }
    }
    Write-Host "   Cancellation Risk: $($top.enforcement.cancellation_risk) ($($top.enforcement.cancellation_risk_score)/100)" -ForegroundColor $riskColor
    Write-Host "   Time Saved: $($top.enforcement.time_savings_minutes) minutes" -ForegroundColor Gray
    
    if ($top.enforcement.warnings.Count -gt 0) {
        Write-Host "`n   Warnings:" -ForegroundColor Yellow
        $top.enforcement.warnings | ForEach-Object {
            Write-Host "      - $_" -ForegroundColor Yellow
        }
    }
}

Write-Host "`nFull test suite: .\test_stage6_enforcement.ps1" -ForegroundColor Cyan
Write-Host "Documentation: STAGE6_README.md" -ForegroundColor Cyan
Write-Host ""
