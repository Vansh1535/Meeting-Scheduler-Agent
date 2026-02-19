#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Test two-user scheduling with real calendar data
    
.DESCRIPTION
    Tests scheduling between 42vanshlilani@gmail.com and vanshlilani15@gmail.com
    using their real Google Calendar data.
#>

$ErrorActionPreference = "Stop"

# Configuration
$FRONTEND_URL = "http://localhost:3000"
$USER1_EMAIL = "42vanshlilani@gmail.com"
$USER2_EMAIL = "vanshlilani15@gmail.com"

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Testing Two-User Scheduling" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Generate unique meeting ID
$meetingId = "test_2user_" + (Get-Date -Format "yyyyMMdd_HHmmss")

# Calculate date range (next 14 days)
$startDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$endDate = (Get-Date).AddDays(14).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")

Write-Host "📋 Test Configuration:" -ForegroundColor Yellow
Write-Host "   Meeting ID: $meetingId" -ForegroundColor White
Write-Host "   Participant 1: $USER1_EMAIL" -ForegroundColor White
Write-Host "   Participant 2: $USER2_EMAIL" -ForegroundColor White
Write-Host "   Duration: 60 minutes" -ForegroundColor White
Write-Host "   Date Range: $startDate to $endDate" -ForegroundColor White
Write-Host ""

# Build request body
$requestBody = @{
    meeting_id = $meetingId
    participant_emails = @($USER1_EMAIL, $USER2_EMAIL)
    constraints = @{
        duration_minutes = 60
        earliest_date = $startDate
        latest_date = $endDate
        timezone = "America/New_York"
        working_hours = @{
            start_hour = 9
            end_hour = 18
        }
        allowed_days = @("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY")
        buffer_minutes = 15
    }
    preferences = @{
        max_candidates = 10
    }
} | ConvertTo-Json -Depth 10

Write-Host "🚀 Sending schedule request..." -ForegroundColor Yellow
Write-Host ""

try {
    # Send request
    $response = Invoke-RestMethod `
        -Uri "$FRONTEND_URL/api/schedule" `
        -Method POST `
        -ContentType "application/json" `
        -Body $requestBody `
        -TimeoutSec 60

    Write-Host "✅ Schedule request completed!" -ForegroundColor Green
    Write-Host ""

    # Display results
    if ($response.success) {
        Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "  SUCCESS - Found Meeting Times!" -ForegroundColor Green
        Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host ""

        Write-Host "📊 Summary:" -ForegroundColor Cyan
        Write-Host "   Total candidates: $($response.candidates.Count)" -ForegroundColor White
        Write-Host "   Processing time: $($response.processing_time_ms) ms" -ForegroundColor White
        Write-Host "   Total slots evaluated: $($response.total_candidates_evaluated)" -ForegroundColor White
        Write-Host ""

        # Display top 3 candidates
        Write-Host "🥇 Top 3 Meeting Time Candidates:" -ForegroundColor Magenta
        Write-Host ""

        $topCandidates = $response.candidates | Select-Object -First 3
        
        foreach ($candidate in $topCandidates) {
            $startTime = [DateTime]::Parse($candidate.slot_start).ToLocalTime()
            $endTime = [DateTime]::Parse($candidate.slot_end).ToLocalTime()
            
            Write-Host "  ┌─────────────────────────────────────────────────────" -ForegroundColor DarkGray
            Write-Host "  │ Rank #$($candidate.rank) - Score: $($candidate.final_score)/100" -ForegroundColor Yellow
            Write-Host "  │" -ForegroundColor DarkGray
            Write-Host "  │ 📅 $($startTime.ToString('dddd, MMMM dd, yyyy'))" -ForegroundColor White
            Write-Host "  │ ⏰ $($startTime.ToString('h:mm tt')) - $($endTime.ToString('h:mm tt'))" -ForegroundColor White
            Write-Host "  │" -ForegroundColor DarkGray
            Write-Host "  │ Score Breakdown:" -ForegroundColor Cyan
            Write-Host "  │   • Availability: $($candidate.availability_score)/10" -ForegroundColor White
            Write-Host "  │   • Preference: $($candidate.preference_score)/10" -ForegroundColor White
            Write-Host "  │   • Optimization: $($candidate.optimization_score)/10" -ForegroundColor White
            Write-Host "  │   • Conflict Proximity: $($candidate.conflict_proximity_score)/10" -ForegroundColor White
            Write-Host "  │   • Fragmentation: $($candidate.fragmentation_score)/10" -ForegroundColor White
            Write-Host "  │" -ForegroundColor DarkGray
            
            if ($candidate.all_participants_available) {
                Write-Host "  │ ✅ All participants available" -ForegroundColor Green
            } else {
                Write-Host "  │ ⚠️  Some participants have conflicts" -ForegroundColor Yellow
            }
            
            Write-Host "  │" -ForegroundColor DarkGray
            Write-Host "  │ 🤖 AI Reasoning:" -ForegroundColor Cyan
            
            # Wrap reasoning text
            $reasoning = $candidate.reasoning
            $maxWidth = 50
            $words = $reasoning -split ' '
            $line = ""
            
            foreach ($word in $words) {
                if (($line + $word).Length -gt $maxWidth) {
                    Write-Host "  │    $line" -ForegroundColor White
                    $line = $word + " "
                } else {
                    $line += $word + " "
                }
            }
            if ($line.Trim().Length -gt 0) {
                Write-Host "  │    $line" -ForegroundColor White
            }
            
            Write-Host "  └─────────────────────────────────────────────────────" -ForegroundColor DarkGray
            Write-Host ""
        }

        # Display analytics if available
        if ($response.analytics) {
            Write-Host "📈 Analytics:" -ForegroundColor Cyan
            
            if ($response.analytics.estimated_time_saved_minutes) {
                Write-Host "   ⏱️  Estimated time saved: $($response.analytics.estimated_time_saved_minutes) minutes" -ForegroundColor Green
            }
            
            if ($response.analytics.coordination_overhead_reduction_pct) {
                Write-Host "   📉 Coordination overhead reduction: $($response.analytics.coordination_overhead_reduction_pct)%" -ForegroundColor Green
            }
            
            if ($response.analytics.candidates_without_conflicts) {
                Write-Host "   ✅ Candidates without conflicts: $($response.analytics.candidates_without_conflicts)/$($response.candidates.Count)" -ForegroundColor Green
            }
            
            Write-Host ""
        }

        Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host ""
        Write-Host "💡 Next Steps:" -ForegroundColor Yellow
        Write-Host "   1. Review the candidates above" -ForegroundColor White
        Write-Host "   2. Choose the best time slot" -ForegroundColor White
        Write-Host "   3. Use the frontend UI to schedule the meeting" -ForegroundColor White
        Write-Host "   4. Event will be created in both users' Google Calendars" -ForegroundColor White
        Write-Host ""
        Write-Host "   Frontend: $FRONTEND_URL/quick-schedule" -ForegroundColor Cyan
        Write-Host ""

    } else {
        Write-Host "⚠️  No candidates found!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Possible reasons:" -ForegroundColor White
        Write-Host "   • Both users are busy during the entire date range" -ForegroundColor Gray
        Write-Host "   • Calendars not synced yet" -ForegroundColor Gray
        Write-Host "   • No mutually available time slots" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Try:" -ForegroundColor Yellow
        Write-Host "   1. Sync calendars for both users" -ForegroundColor White
        Write-Host "   2. Expand date range" -ForegroundColor White
        Write-Host "   3. Reduce meeting duration" -ForegroundColor White
        Write-Host ""
    }

} catch {
    Write-Host "❌ Request Failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Ensure frontend is running: npm run dev" -ForegroundColor White
    Write-Host "   2. Ensure Python service is running: cd python-service && python main.py" -ForegroundColor White
    Write-Host "   3. Both users must have completed OAuth and calendar sync" -ForegroundColor White
    Write-Host "   4. Check logs in terminal windows" -ForegroundColor White
    Write-Host ""
    Write-Host "Setup script: .\test\setup_two_users.ps1" -ForegroundColor Cyan
    Write-Host ""
    
    exit 1
}
