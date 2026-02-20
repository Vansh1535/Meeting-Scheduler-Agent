#!/usr/bin/env pwsh
# Verify AI Event Styling - Check that AI events have correct source_platform

$userId = "04f1e29c-3a53-442a-b79d-e98e1f1dd314"

Write-Host "`n=== VERIFY AI EVENT STYLING ===" -ForegroundColor Cyan
Write-Host "User ID: $userId`n"

# Fetch all calendar events
Write-Host "Fetching calendar events..." -ForegroundColor Yellow
$events = Invoke-RestMethod -Uri "http://localhost:3000/api/calendar/events?userId=$userId"

Write-Host "`nTotal events: $($events.Count)`n" -ForegroundColor White

# Show all events with their source_platform
Write-Host "=== ALL EVENTS (with source_platform) ===" -ForegroundColor Cyan
foreach ($event in $events) {
    Write-Host "  Title: $($event.title)" -ForegroundColor White
    Write-Host "  Source Platform: '$($event.source_platform)'" -ForegroundColor Cyan
    Write-Host "  Start: $($event.start_time)" -ForegroundColor Gray
    Write-Host ""
}

# Group by source_platform
$googleEvents = $events | Where-Object { $_.source_platform -eq 'google' }
$aiEvents = $events | Where-Object { $_.source_platform -eq 'ai_platform' }
$unknownEvents = $events | Where-Object { -not $_.source_platform -or ($_.source_platform -ne 'google' -and $_.source_platform -ne 'ai_platform') }

Write-Host "=== EVENT BREAKDOWN ===" -ForegroundColor Cyan
Write-Host "Google Calendar Events: $($googleEvents.Count)" -ForegroundColor Yellow
Write-Host "AI Scheduled Events: $($aiEvents.Count)" -ForegroundColor Red
Write-Host "Unknown Source: $($unknownEvents.Count)`n" -ForegroundColor Gray

if ($aiEvents.Count -gt 0) {
    Write-Host "=== AI SCHEDULED EVENTS ===" -ForegroundColor Red
    foreach ($event in $aiEvents | Select-Object -First 5) {
        Write-Host "  Title: $($event.title)" -ForegroundColor White
        Write-Host "  Start: $($event.start_time)" -ForegroundColor White
        Write-Host "  Source: $($event.source_platform)" -ForegroundColor Red
        Write-Host ""
    }
}

if ($googleEvents.Count -gt 0) {
    Write-Host "=== GOOGLE CALENDAR EVENTS ===" -ForegroundColor Yellow
    foreach ($event in $googleEvents | Select-Object -First 5) {
        Write-Host "  Title: $($event.title)" -ForegroundColor White
        Write-Host "  Start: $($event.start_time)" -ForegroundColor White
        Write-Host "  Source: $($event.source_platform)" -ForegroundColor Yellow
        Write-Host ""
    }
}

Write-Host "=== VERIFICATION COMPLETE ===" -ForegroundColor Cyan
Write-Host "AI events should now show in RED with 'AI SCHEDULED' tag" -ForegroundColor Red
Write-Host "Google events should show in ORANGE with 'GOOGLE CAL' tag`n" -ForegroundColor Yellow
