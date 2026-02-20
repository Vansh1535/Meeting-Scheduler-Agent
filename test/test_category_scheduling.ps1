# Test Intelligent Time Suggestions with Different Event Categories
# This script tests how AI suggestions change based on event category

Write-Host "`n🧪 Testing Intelligent Time Suggestions" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

# Base URL
$baseUrl = "http://localhost:8001"

# Test data - single user with some busy slots
$testData = @{
    meeting_id = "test-category-$(Get-Date -Format 'yyyyMMddHHmmss')"
    participants = @(
        @{
            user_id = "user123"
            email = "user@example.com"
            name = "Test User"
            is_required = $true
            calendar_summary = @{
                user_id = "user123"
                timezone = "America/New_York"
                busy_slots = @(
                    @{
                        start = "2026-02-24T09:00:00Z"  # Monday 9am busy
                        end = "2026-02-24T10:00:00Z"
                        timezone = "UTC"
                    },
                    @{
                        start = "2026-02-24T14:00:00Z"  # Monday 2pm busy
                        end = "2026-02-24T15:00:00Z"
                        timezone = "UTC"
                    }
                )
                weekly_meeting_count = 5
                peak_meeting_hours = @(9, 10, 14, 15)
                preference_patterns = @{
                    preferred_days = @("monday", "tuesday", "wednesday")
                    preferred_hours_start = 9
                    preferred_hours_end = 17
                    avg_meeting_duration_minutes = 60
                    buffer_minutes = 15
                    avoids_back_to_back = $true
                    morning_person_score = 0.7
                }
                data_compressed = $true
                compression_period_days = 90
            }
        }
    )
    constraints = @{
        duration_minutes = 60
        earliest_date = "2026-02-24T00:00:00Z"  # Monday
        latest_date = "2026-02-24T23:59:59Z"
        working_hours_start = 9
        working_hours_end = 17
        allowed_days = @("monday", "tuesday", "wednesday", "thursday", "friday")
        buffer_minutes = 15
        timezone = "UTC"
        max_candidates = 10
        event_category = "meeting"  # Will be changed for each test
    }
}

# Test categories
$categories = @(
    @{ name = "MEETING"; value = "meeting"; description = "Business Meeting" },
    @{ name = "PERSONAL"; value = "personal"; description = "Personal Event" },
    @{ name = "WORK"; value = "work"; description = "Work Task" },
    @{ name = "SOCIAL"; value = "social"; description = "Social Event" },
    @{ name = "HEALTH"; value = "health"; description = "Health Appointment" },
    @{ name = "FOCUS_TIME"; value = "focus_time"; description = "Focus/Deep Work" }
)

foreach ($category in $categories) {
    Write-Host "`n📋 Testing Category: $($category.name)" -ForegroundColor Yellow
    Write-Host "   Description: $($category.description)" -ForegroundColor Gray
    Write-Host "   ----------------------------------------" -ForegroundColor Gray
    
    # Update category in test data
    $testData.constraints.event_category = $category.value
    $testData.meeting_id = "test-$($category.value)-$(Get-Date -Format 'HHmmss')"
    
    # Convert to JSON
    $jsonBody = $testData | ConvertTo-Json -Depth 10
    
    try {
        # Make request
        $response = Invoke-RestMethod -Uri "$baseUrl/schedule" -Method Post `
            -ContentType "application/json" -Body $jsonBody
        
        if ($response.success -and $response.candidates.Count -gt 0) {
            Write-Host "   ✅ Success! Found $($response.candidates.Count) candidates" -ForegroundColor Green
            
            # Show top 3 candidates with their times and scores
            $topCandidates = $response.candidates | Select-Object -First 3
            $i = 1
            foreach ($candidate in $topCandidates) {
                $startTime = [DateTime]::Parse($candidate.slot.start).ToLocalTime()
                $timeStr = $startTime.ToString("HH:mm")
                $score = [math]::Round($candidate.score, 1)
                $prefScore = [math]::Round($candidate.preference_score, 1)
                $categoryScore = if ($candidate.score_breakdown.preference) { 
                    [math]::Round($candidate.score_breakdown.preference, 1) 
                } else { "N/A" }
                
                Write-Host "`n   #$i - Time: $timeStr | Overall Score: $score" -ForegroundColor Cyan
                Write-Host "        Preference: $prefScore | Availability: $([math]::Round($candidate.availability_score, 1))" -ForegroundColor Gray
                if ($candidate.reasoning) {
                    Write-Host "        Reason: $($candidate.reasoning)" -ForegroundColor DarkGray
                }
                $i++
            }
            
            # Show how category affects the results
            Write-Host "`n   💡 Category Impact:" -ForegroundColor Magenta
            $avgScore = ($response.candidates | Measure-Object -Property score -Average).Average
            Write-Host "      Average Score: $([math]::Round($avgScore, 1))" -ForegroundColor Gray
            
            # Analyze time distribution
            $morningSlots = ($response.candidates | Where-Object { 
                ([DateTime]::Parse($_.slot.start).Hour -lt 12) 
            }).Count
            $afternoonSlots = ($response.candidates | Where-Object { 
                $hour = [DateTime]::Parse($_.slot.start).Hour
                ($hour -ge 12 -and $hour -lt 17) 
            }).Count
            $eveningSlots = ($response.candidates | Where-Object { 
                ([DateTime]::Parse($_.slot.start).Hour -ge 17) 
            }).Count
            
            Write-Host "      Morning (before 12pm): $morningSlots slots" -ForegroundColor Gray
            Write-Host "      Afternoon (12-5pm): $afternoonSlots slots" -ForegroundColor Gray
            Write-Host "      Evening (after 5pm): $eveningSlots slots" -ForegroundColor Gray
            
        } else {
            Write-Host "   ⚠️  No candidates found" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host "`n`n✅ Category Testing Complete!" -ForegroundColor Green
Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "   - Different categories suggest different time windows" -ForegroundColor Gray
Write-Host "   - MEETING: Prefers office hours" -ForegroundColor Gray
Write-Host "   - PERSONAL: Prefers before/after work" -ForegroundColor Gray
Write-Host "   - SOCIAL: Prefers evenings" -ForegroundColor Gray
Write-Host "   - FOCUS_TIME: Prefers early morning" -ForegroundColor Gray
Write-Host "   - HEALTH: Prefers daytime" -ForegroundColor Gray
Write-Host "`n"

# Test Weekend vs Weekday
Write-Host "`n🔄 Testing Weekend vs Weekday for SOCIAL events" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# Weekday test
Write-Host "📅 Weekday (Monday) SOCIAL Event:" -ForegroundColor Yellow
$testData.constraints.event_category = "social"
$testData.constraints.earliest_date = "2026-02-24T00:00:00Z"  # Monday
$testData.constraints.latest_date = "2026-02-24T23:59:59Z"
$testData.meeting_id = "social-weekday-test"

$jsonBody = $testData | ConvertTo-Json -Depth 10
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/schedule" -Method Post `
        -ContentType "application/json" -Body $jsonBody
    
    if ($response.success) {
        $topSlot = $response.candidates[0]
        $time = [DateTime]::Parse($topSlot.slot.start).ToLocalTime().ToString("HH:mm")
        Write-Host "   Top suggestion: $time (Score: $([math]::Round($topSlot.score, 1)))" -ForegroundColor Green
        Write-Host "   Expecting: Evening time preferred for weekday social events" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Milliseconds 500

# Weekend test
Write-Host "`n📅 Weekend (Saturday) SOCIAL Event:" -ForegroundColor Yellow
$testData.constraints.earliest_date = "2026-02-28T00:00:00Z"  # Saturday
$testData.constraints.latest_date = "2026-02-28T23:59:59Z"
$testData.constraints.allowed_days = @("saturday", "sunday")
$testData.meeting_id = "social-weekend-test"

$jsonBody = $testData | ConvertTo-Json -Depth 10
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/schedule" -Method Post `
        -ContentType "application/json" -Body $jsonBody
    
    if ($response.success) {
        $topSlot = $response.candidates[0]
        $time = [DateTime]::Parse($topSlot.slot.start).ToLocalTime().ToString("HH:mm")
        Write-Host "   Top suggestion: $time (Score: $([math]::Round($topSlot.score, 1)))" -ForegroundColor Green
        Write-Host "   Expecting: Flexible daytime slots for weekend social events" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ All Tests Complete!" -ForegroundColor Green
Write-Host "`n"
