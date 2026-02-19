# Verify Event Counts - Cross-check Dashboard vs Calendar
# Shows exactly what data is in the database for February 2026

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "EVENT COUNT VERIFICATION" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Get user ID from .env.local
$envPath = ".\frontend\.env.local"
if (Test-Path $envPath) {
    $userId = (Get-Content $envPath | Select-String "NEXT_PUBLIC_USER_ID=").ToString().Split("=")[1]
    Write-Host "User ID: $userId" -ForegroundColor Yellow
} else {
    $userId = "test-user"
    Write-Host "Using default User ID: $userId" -ForegroundColor Yellow
}

Write-Host ""

# Query 1: Calendar Events in February 2026
Write-Host "1. CALENDAR EVENTS (Google Calendar)" -ForegroundColor Green
Write-Host "   Query: calendar_events WHERE start_time between Feb 1-28, 2026" -ForegroundColor Gray

$calendarQuery = @"
{
  "user_id": "$userId",
  "start_time_gte": "2026-02-01T00:00:00.000Z",
  "start_time_lte": "2026-02-28T23:59:59.999Z"
}
"@

$supabaseUrl = "https://gzpnwhwfrjokrkcdgcnr.supabase.co"
$supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6cG53aHdmcmpva3JrY2RnY25yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3Nzk3OTYsImV4cCI6MjA1MjM1NTc5Nn0.vn05FdmhRmxHwSJ8qBkGPvZo_jgmwtMxGJDWDCAH7oM"

try {
    $headers = @{
        "apikey" = $supabaseKey
        "Authorization" = "Bearer $supabaseKey"
        "Content-Type" = "application/json"
    }
    
    $url = "$supabaseUrl/rest/v1/calendar_events?user_id=eq.$userId&start_time=gte.2026-02-01T00:00:00.000Z&start_time=lte.2026-02-28T23:59:59.999Z&select=id,title,summary,start_time,end_time,category"
    
    $calendarEvents = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
    
    Write-Host "   Total Count: $($calendarEvents.Count)" -ForegroundColor Cyan
    
    if ($calendarEvents.Count -gt 0) {
        Write-Host ""
        Write-Host "   Events:" -ForegroundColor White
        $calendarEvents | ForEach-Object {
            $title = if ($_.title) { $_.title } else { $_.summary }
            $startDate = ([DateTime]$_.start_time).ToString("MMM dd, yyyy HH:mm")
            Write-Host "   - $title" -ForegroundColor White
            Write-Host "     Date: $startDate | Category: $($_.category)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "   Error querying calendar_events: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Query 2: AI Meetings (All statuses)
Write-Host "2. AI-SCHEDULED MEETINGS" -ForegroundColor Green
Write-Host "   Query: meetings WHERE user is participant AND requested_at in Feb 2026" -ForegroundColor Gray

try {
    # First get meeting IDs for this user
    $availUrl = "$supabaseUrl/rest/v1/participant_availability?user_id=eq.$userId&select=meeting_id"
    $participantData = Invoke-RestMethod -Uri $availUrl -Headers $headers -Method Get
    
    if ($participantData.Count -eq 0) {
        Write-Host "   No AI meetings found for this user" -ForegroundColor Yellow
    } else {
        $meetingIds = $participantData | Select-Object -ExpandProperty meeting_id -Unique
        
        # Get meeting details
        $meetingIdsParam = $meetingIds -join ","
        $meetingsUrl = "$supabaseUrl/rest/v1/meetings?id=in.($meetingIdsParam)&select=id,meeting_id,status,requested_at,duration_minutes,success,participant_count"
        
        $meetings = Invoke-RestMethod -Uri $meetingsUrl -Headers $headers -Method Get
        
        # Filter to February 2026
        $febStart = [DateTime]"2026-02-01T00:00:00.000Z"
        $febEnd = [DateTime]"2026-02-28T23:59:59.999Z"
        
        $febMeetings = $meetings | Where-Object { 
            $requestDate = [DateTime]$_.requested_at
            $requestDate -ge $febStart -and $requestDate -le $febEnd
        }
        
        Write-Host "   Total in February: $($febMeetings.Count)" -ForegroundColor Cyan
        
        # Group by status
        $byStatus = $febMeetings | Group-Object -Property status
        
        Write-Host ""
        Write-Host "   By Status:" -ForegroundColor White
        foreach ($group in $byStatus) {
            Write-Host "   - $($group.Name): $($group.Count)" -ForegroundColor White
        }
        
        if ($febMeetings.Count -gt 0) {
            Write-Host ""
            Write-Host "   Meeting Details:" -ForegroundColor White
            $febMeetings | ForEach-Object {
                $reqDate = ([DateTime]$_.requested_at).ToString("MMM dd, yyyy HH:mm")
                Write-Host "   - ID: $($_.meeting_id)" -ForegroundColor White
                Write-Host "     Status: $($_.status) | Requested: $reqDate" -ForegroundColor Gray
                Write-Host "     Duration: $($_.duration_minutes) min | Participants: $($_.participant_count)" -ForegroundColor Gray
            }
        }
        
        # Show what should be counted
        $scheduledCount = ($febMeetings | Where-Object { $_.status -eq 'scheduled' }).Count
        Write-Host ""
        Write-Host "   Should be counted (status='scheduled'): $scheduledCount" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   Error querying meetings: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Summary
Write-Host "3. EXPECTED DASHBOARD COUNT" -ForegroundColor Green
try {
    $expectedTotal = $calendarEvents.Count + $scheduledCount
    Write-Host "   Calendar Events (Feb 2026): $($calendarEvents.Count)" -ForegroundColor White
    Write-Host "   + AI Meetings (scheduled): $scheduledCount" -ForegroundColor White
    Write-Host "   ---------------------------------" -ForegroundColor Gray
    Write-Host "   TOTAL EXPECTED: $expectedTotal" -ForegroundColor Cyan
} catch {
    Write-Host "   Unable to calculate expected total" -ForegroundColor Red
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "TIP: If counts don't match, check:" -ForegroundColor Yellow
Write-Host "  1. Are there pending/cancelled meetings being counted?" -ForegroundColor Gray
Write-Host "  2. Are there events outside Feb 2026 being included?" -ForegroundColor Gray
Write-Host "  3. Is the analytics API using the correct date filter?" -ForegroundColor Gray
Write-Host ""
