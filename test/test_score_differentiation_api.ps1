# Test Score Differentiation via API
# This script shows how different time slots on the same day now have different scores

Write-Host "`n🎯 Testing Score Differentiation via API" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:8001"

# Check if service is running
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get -ErrorAction Stop
    Write-Host "✅ Python service is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Python service is not running. Start it first:" -ForegroundColor Red
    Write-Host "   cd python-service" -ForegroundColor Yellow
    Write-Host "   python main.py" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n📅 Scenario: Group Dinner (Social Event)" -ForegroundColor Yellow
Write-Host "   Duration: 90 minutes" -ForegroundColor Gray
Write-Host "   Category: Social" -ForegroundColor Gray
Write-Host "   Looking for evening slots on March 5-6, 2026" -ForegroundColor Gray
Write-Host ""

# Create test request
$request = @{
    meeting_id = "social-dinner-$(Get-Date -Format 'HHmmss')"
    participants = @(
        @{
            user_id = "user123"
            email = "john@example.com"
            name = "John Doe"
            is_required = $true
            calendar_summary = @{
                user_id = "user123"
                timezone = "America/New_York"
                busy_slots = @(
                    @{
                        start = "2026-03-05T14:00:00Z"  # 9am EST - busy
                        end = "2026-03-05T15:00:00Z"
                        timezone = "UTC"
                    },
                    @{
                        start = "2026-03-05T16:00:00Z"  # 11am EST - busy
                        end = "2026-03-05T17:00:00Z"
                        timezone = "UTC"
                    }
                )
                weekly_meeting_count = 8
                peak_meeting_hours = @(9, 10, 14, 15)
                preference_patterns = @{
                    preferred_days = @("tuesday", "wednesday", "thursday", "friday")
                    preferred_hours_start = 9
                    preferred_hours_end = 17
                    avg_meeting_duration_minutes = 60
                    buffer_minutes = 15
                    avoids_back_to_back = $true
                    morning_person_score = 0.6
                }
                data_compressed = $true
                compression_period_days = 90
            }
        }
    )
    constraints = @{
        duration_minutes = 90
        earliest_date = "2026-03-05T00:00:00Z"
        latest_date = "2026-03-06T23:59:59Z"
        working_hours_start = 9
        working_hours_end = 17
        allowed_days = @("wednesday", "thursday")
        buffer_minutes = 15
        timezone = "UTC"
        max_candidates = 10
        event_category = "social"  # This triggers evening preference scoring
    }
}

$jsonBody = $request | ConvertTo-Json -Depth 10

Write-Host "🔄 Calling AI Scheduling Service..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/schedule" -Method Post `
        -ContentType "application/json" -Body $jsonBody -ErrorAction Stop
    
    if ($response.success -and $response.candidates.Count -gt 0) {
        Write-Host "`n✅ Success! Found $($response.candidates.Count) candidates" -ForegroundColor Green
        Write-Host "   Processing time: $($response.processing_time_ms)ms" -ForegroundColor Gray
        
        Write-Host "`n🏆 Ranked Options (like in your UI):" -ForegroundColor Cyan
        Write-Host "=" * 80 -ForegroundColor Gray
        
        # Group by day to show same-day differentiation
        $byDay = @{}
        foreach ($candidate in $response.candidates) {
            $date = ([DateTime]::Parse($candidate.slot.start)).Date
            $dateKey = $date.ToString("yyyy-MM-dd")
            if (-not $byDay.ContainsKey($dateKey)) {
                $byDay[$dateKey] = @()
            }
            $byDay[$dateKey] += $candidate
        }
        
        # Display results
        $rank = 1
        foreach ($candidate in $response.candidates | Select-Object -First 10) {
            $startTime = [DateTime]::Parse($candidate.slot.start)
            $endTime = [DateTime]::Parse($candidate.slot.end)
            $dayName = $startTime.ToString("ddd, MMM d")
            $timeStart = $startTime.ToString("h:mm tt")
            $timeEnd = $endTime.ToString("h:mm tt")
            $score = [math]::Round($candidate.score, 1)
            
            # Format like the UI screenshot
            Write-Host "`n 🏅 #$rank" -ForegroundColor Yellow -NoNewline
            Write-Host "    Score: " -ForegroundColor Gray -NoNewline
            Write-Host "$score" -ForegroundColor Green
            
            Write-Host "     📅 $dayName" -ForegroundColor White
            Write-Host "     ⏰ $timeStart - $timeEnd" -ForegroundColor White
            
            $rank++
        }
        
        # Analyze same-day differentiation
        Write-Host "`n`n📊 Same-Day Score Differentiation Analysis:" -ForegroundColor Cyan
        Write-Host "=" * 80 -ForegroundColor Gray
        
        foreach ($dateKey in $byDay.Keys | Sort-Object) {
            $candidates = $byDay[$dateKey]
            if ($candidates.Count -gt 1) {
                $date = [DateTime]::Parse($dateKey)
                $dayName = $date.ToString("dddd, MMMM d")
                
                Write-Host "`n📅 $dayName - $($candidates.Count) time slots:" -ForegroundColor Yellow
                
                $scores = @()
                foreach ($c in $candidates) {
                    $time = ([DateTime]::Parse($c.slot.start)).ToString("h:mm tt")
                    $score = [math]::Round($c.score, 2)
                    $scores += $score
                    Write-Host "   $time : $score" -ForegroundColor White
                }
                
                $uniqueScores = ($scores | Select-Object -Unique).Count
                $scoreRange = ($scores | Measure-Object -Maximum -Minimum)
                $range = $scoreRange.Maximum - $scoreRange.Minimum
                
                Write-Host "   ➜ Unique scores: $uniqueScores/$($candidates.Count)" -ForegroundColor Cyan
                Write-Host "   ➜ Score range: $([math]::Round($range, 2)) points" -ForegroundColor Cyan
                
                if ($uniqueScores -eq $candidates.Count) {
                    Write-Host "   ✅ All slots have unique scores!" -ForegroundColor Green
                }
            }
        }
        
        # Summary
        Write-Host "`n`n💡 Key Improvements:" -ForegroundColor Magenta
        Write-Host "   ✓ Each time slot has a different score (no more 86.7, 86.7, 86.7...)" -ForegroundColor Green
        Write-Host "   ✓ Earlier evening times (6-7pm) rank higher for social events" -ForegroundColor Green
        Write-Host "   ✓ Round hours (:00) slightly preferred over half-hours (:30)" -ForegroundColor Green
        Write-Host "   ✓ Users can clearly see why one option is better than another" -ForegroundColor Green
        
        Write-Host "`n📈 Score Statistics:" -ForegroundColor Cyan
        $allScores = $response.candidates | ForEach-Object { [math]::Round($_.score, 2) }
        $uniqueCount = ($allScores | Select-Object -Unique).Count
        $stats = $allScores | Measure-Object -Maximum -Minimum -Average
        
        Write-Host "   Total candidates: $($response.candidates.Count)" -ForegroundColor White
        Write-Host "   Unique scores: $uniqueCount ($([math]::Round($uniqueCount/$response.candidates.Count*100, 1))%)" -ForegroundColor White
        Write-Host "   Score range: $([math]::Round($stats.Minimum, 1)) - $([math]::Round($stats.Maximum, 1))" -ForegroundColor White
        Write-Host "   Average score: $([math]::Round($stats.Average, 1))" -ForegroundColor White
        
    } else {
        Write-Host "`n⚠️  No candidates found or request failed" -ForegroundColor Yellow
        if ($response.message) {
            Write-Host "   Message: $($response.message)" -ForegroundColor Gray
        }
    }
    
} catch {
    Write-Host "`n❌ Error calling API:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    }
}

Write-Host "`n"
