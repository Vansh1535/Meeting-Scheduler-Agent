#!/usr/bin/env pwsh
# Test Calendar Sync - Check if new Google events appear

$userId = "04f1e29c-3a53-442a-b79d-e98e1f1dd314"

Write-Host "`n=== CALENDAR SYNC TEST ===" -ForegroundColor Cyan
Write-Host "User ID: $userId`n"

# Step 1: Check events before sync
Write-Host "Step 1: Events BEFORE sync..." -ForegroundColor Yellow
$eventsBefore = Invoke-RestMethod -Uri "http://localhost:3000/api/calendar/events?userId=$userId"
Write-Host "  Total events: $($eventsBefore.Count)" -ForegroundColor White

$googleBefore = $eventsBefore | Where-Object { $_.source_platform -eq 'google' }
$aiBefore = $eventsBefore | Where-Object { $_.source_platform -eq 'ai_platform' }

Write-Host "  Google Calendar: $($googleBefore.Count)" -ForegroundColor Yellow
Write-Host "  AI Platform: $($aiBefore.Count)`n" -ForegroundColor Red

# Step 2: Trigger sync
Write-Host "Step 2: Triggering calendar sync..." -ForegroundColor Yellow
try {
    $syncResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/calendar/sync/$userId" -Method POST -ContentType "application/json" -Body "{}"
    
    Write-Host "  Sync completed!" -ForegroundColor Green
    Write-Host "  Fetched: $($syncResponse.events_fetched)" -ForegroundColor White
    Write-Host "  Added: $($syncResponse.events_added)" -ForegroundColor Green
    Write-Host "  Updated: $($syncResponse.events_updated)" -ForegroundColor Cyan
    Write-Host "  Deleted: $($syncResponse.events_deleted)" -ForegroundColor Red
    Write-Host ""
} catch {
    Write-Host "  Sync failed: $_" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# Step 3: Check events after sync
Write-Host "Step 3: Events AFTER sync..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
$eventsAfter = Invoke-RestMethod -Uri "http://localhost:3000/api/calendar/events?userId=$userId"
Write-Host "  Total events: $($eventsAfter.Count)" -ForegroundColor White

$googleAfter = $eventsAfter | Where-Object { $_.source_platform -eq 'google' }
$aiAfter = $eventsAfter | Where-Object { $_.source_platform -eq 'ai_platform' }

Write-Host "  Google Calendar: $($googleAfter.Count)" -ForegroundColor Yellow
Write-Host "  AI Platform: $($aiAfter.Count)`n" -ForegroundColor Red

# Step 4: Show changes
Write-Host "=== CHANGES ===" -ForegroundColor Cyan
Write-Host "Google events: $($googleBefore.Count) -> $($googleAfter.Count) ($(($googleAfter.Count - $googleBefore.Count)))" -ForegroundColor Yellow
Write-Host "AI events: $($aiBefore.Count) -> $($aiAfter.Count) ($(($aiAfter.Count - $aiBefore.Count)))" -ForegroundColor Red

if ($googleAfter.Count -gt $googleBefore.Count) {
    Write-Host "`n✅ New Google Calendar events detected!" -ForegroundColor Green
    
    # Show new events
    Write-Host "`n=== NEW GOOGLE EVENTS ===" -ForegroundColor Green
    $newEvents = $googleAfter | Where-Object { $_.google_event_id -notin $googleBefore.google_event_id }
    foreach ($event in $newEvents | Select-Object -First 5) {
        Write-Host "  $($event.title)" -ForegroundColor White
        Write-Host "    Start: $($event.startTime)" -ForegroundColor Gray
        Write-Host ""
    }
} elseif ($googleAfter.Count -lt $googleBefore.Count) {
    Write-Host "`n⚠️ Google Calendar events DECREASED!" -ForegroundColor Yellow
} else {
    Write-Host "`n⚠️ No change in Google Calendar events count" -ForegroundColor Yellow
    Write-Host "   This might mean:" -ForegroundColor Gray
    Write-Host "   - No new events were created in Google Calendar" -ForegroundColor Gray
    Write-Host "   - Events are outside the sync time range" -ForegroundColor Gray
    Write-Host "   - Sync is updating existing events only" -ForegroundColor Gray
}

if ($aiAfter.Count -lt $aiBefore.Count) {
    Write-Host "`n❌ WARNING: AI Platform events were DELETED!" -ForegroundColor Red
    Write-Host "   AI events should NOT be deleted during Google Calendar sync" -ForegroundColor Red
    Write-Host "   This is a BUG that needs to be fixed!" -ForegroundColor Red
}

Write-Host "`n=== TEST COMPLETE ===`n" -ForegroundColor Cyan
