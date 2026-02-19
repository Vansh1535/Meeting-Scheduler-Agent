# Mark Existing AI Platform Events
# This script calls the API to retroactively mark all existing AI Platform events

Write-Host "`n=== Mark Existing AI Platform Events ===" -ForegroundColor Cyan
Write-Host "This will identify and mark all existing AI-scheduled events in your database`n" -ForegroundColor Gray

# Get base URL
$baseUrl = "http://localhost:3000"

# Check if user wants to mark for specific user or all users
$userEmail = Read-Host "Enter user email (press Enter to process all users)"

$body = @{}
if (![string]::IsNullOrWhiteSpace($userEmail)) {
    # Get user ID from email
    Write-Host "`nFetching user ID..." -ForegroundColor Yellow
    
    try {
        # You would need to query your database for user_id
        # For now, we'll use the email directly if your API supports it
        $body.user_email = $userEmail
        Write-Host "Processing events for user: $userEmail" -ForegroundColor Green
    } catch {
        Write-Host "Failed to get user ID" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Processing events for all users..." -ForegroundColor Yellow
}

# First, check statistics
Write-Host "`nChecking current statistics..." -ForegroundColor Yellow

try {
    $statsUrl = "$baseUrl/api/calendar/mark-existing-ai-events"
    if (![string]::IsNullOrWhiteSpace($userEmail)) {
        $statsUrl += "?user_email=$userEmail"
    }
    
    $stats = Invoke-RestMethod -Uri $statsUrl -Method GET
    
    Write-Host "`n📊 Current Statistics:" -ForegroundColor Cyan
    Write-Host "  Total AI Events: $($stats.total_ai_events)" -ForegroundColor White
    Write-Host "  Correctly Marked: $($stats.marked_correctly)" -ForegroundColor Green
    Write-Host "  Needs Marking: $($stats.needs_marking)" -ForegroundColor Yellow
    Write-Host "  Not in Calendar: $($stats.not_in_calendar)" -ForegroundColor Gray
    
    if ($stats.needs_marking -eq 0) {
        Write-Host "`n✅ All events are already correctly marked!" -ForegroundColor Green
        Write-Host "No action needed.`n" -ForegroundColor Gray
        exit 0
    }
    
    Write-Host "`n⚠️  Found $($stats.needs_marking) events that need to be marked" -ForegroundColor Yellow
    $continue = Read-Host "Do you want to mark these events now? (y/n)"
    
    if ($continue -ne 'y' -and $continue -ne 'Y') {
        Write-Host "`nOperation cancelled." -ForegroundColor Gray
        exit 0
    }
    
} catch {
    Write-Host "⚠️  Could not fetch statistics: $_" -ForegroundColor Yellow
    Write-Host "Continuing with marking process...`n" -ForegroundColor Gray
}

# Mark the events
Write-Host "`nMarking AI Platform events..." -ForegroundColor Yellow

try {
    $bodyJson = $body | ConvertTo-Json
    
    $result = Invoke-RestMethod -Uri "$baseUrl/api/calendar/mark-existing-ai-events" `
        -Method POST `
        -Body $bodyJson `
        -ContentType "application/json"
    
    Write-Host "`n✅ Marking Complete!" -ForegroundColor Green
    Write-Host "`n📊 Results:" -ForegroundColor Cyan
    Write-Host "  Events Marked: $($result.events_marked)" -ForegroundColor Green
    Write-Host "  Already Marked: $($result.already_marked)" -ForegroundColor Gray
    Write-Host "  Total AI Events: $($result.total_ai_events)" -ForegroundColor White
    
    if ($result.errors -and $result.errors.Count -gt 0) {
        Write-Host "`n⚠️  Errors Encountered:" -ForegroundColor Yellow
        foreach ($error in $result.errors) {
            Write-Host "    - $error" -ForegroundColor Red
        }
    }
    
    Write-Host "`n✅ Success: $($result.message)" -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ Failed to mark events:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    # Show response if available
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "`nResponse: $responseBody" -ForegroundColor Gray
    }
    
    exit 1
}

Write-Host "`n📝 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Refresh your browser to see the updated event colors" -ForegroundColor White
Write-Host "  2. Check the calendar to verify AI Platform events show in red" -ForegroundColor White
Write-Host "  3. Verify the 'Events by Source' sidebar shows correct counts`n" -ForegroundColor White
