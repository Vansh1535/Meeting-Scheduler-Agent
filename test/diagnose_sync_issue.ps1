#!/usr/bin/env pwsh
# Comprehensive Calendar Sync Diagnostic

Write-Host "`n=== CALENDAR SYNC DIAGNOSTIC ===" -ForegroundColor Cyan
Write-Host "This script will help diagnose why new Google Calendar events aren't showing up`n"

# Test with the real connected user
$userId = "1799d245-456f-4b64-ba14-f31e2e5f6b2d"  # The user that has OAuth connected

Write-Host "Step 1: Checking OAuth status..." -ForegroundColor Yellow
try {
    $oauthStatus = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/google/status/$userId"
    
    if (-not $oauthStatus.connected) {
        Write-Host "❌ Google Calendar NOT connected for this user" -ForegroundColor Red
        Write-Host "`nTO FIX: Connect Google Calendar:" -ForegroundColor Yellow
        Write-Host "1. Go to http://localhost:3000/settings" -ForegroundColor White
        Write-Host "2. Click 'Connect Google Calendar'" -ForegroundColor White
        Write-Host "3. Complete OAuth flow`n" -ForegroundColor White
        exit 1
    }
    
    Write-Host "✅ OAuth connected" -ForegroundColor Green
    Write-Host "   Email: $($oauthStatus.email)`n" -ForegroundColor White
} catch {
    Write-Host "❌ Failed to check OAuth: $_`n" -ForegroundColor Red
    exit 1
}

# Check events BEFORE sync
Write-Host "Step 2: Events before sync..." -ForegroundColor Yellow
$eventsBefore = Invoke-RestMethod -Uri "http://localhost:3000/api/calendar/events?userId=$userId"
$googleBefore = ($eventsBefore | Where-Object { $_.source_platform -eq 'google' }).Count
$aiBefore = ($eventsBefore | Where-Object { $_.source_platform -eq 'ai_platform' }).Count

Write-Host "   Total: $($eventsBefore.Count)" -ForegroundColor White
Write-Host "   Google: $googleBefore" -ForegroundColor Yellow
Write-Host "   AI Platform: $aiBefore`n" -ForegroundColor Red

# Trigger sync
Write-Host "Step 3: Running calendar sync..." -ForegroundColor Yellow
try {
    $syncResponse = Invoke-RestMethod `
        -Uri "http://localhost:3000/api/calendar/sync/$userId" `
        -Method POST `
        -ContentType "application/json" `
        -Body "{}"
    
    Write-Host "   ✅ Sync completed!" -ForegroundColor Green
    Write-Host "   Fetched from Google: $($syncResponse.events_fetched)" -ForegroundColor Cyan
    Write-Host "   Added to DB: $($syncResponse.events_added)" -ForegroundColor Green
    Write-Host "   Updated in DB: $($syncResponse.events_updated)" -ForegroundColor Yellow
    Write-Host "   Deleted from DB: $($syncResponse.events_deleted)`n" -ForegroundColor Red
} catch {
    Write-Host "   ❌ Sync failed: $_`n" -ForegroundColor Red
    exit 1
}

# Check events AFTER sync
Write-Host "Step 4: Events after sync..." -ForegroundColor Yellow
Start-Sleep -Seconds 1
$eventsAfter = Invoke-RestMethod -Uri "http://localhost:3000/api/calendar/events?userId=$userId"
$googleAfter = ($eventsAfter | Where-Object { $_.source_platform -eq 'google' }).Count
$aiAfter = ($eventsAfter | Where-Object { $_.source_platform -eq 'ai_platform' }).Count

Write-Host "   Total: $($eventsAfter.Count)" -ForegroundColor White
Write-Host "   Google: $googleAfter" -ForegroundColor Yellow
Write-Host "   AI Platform: $aiAfter`n" -ForegroundColor Red

# Analysis
Write-Host "=== ANALYSIS ===" -ForegroundColor Cyan
$googleChange = $googleAfter - $googleBefore
$aiChange = $aiAfter - $aiBefore

if ($googleChange -gt 0) {
    Write-Host "✅ SUCCESS: $googleChange new Google Calendar event(s) synced!" -ForegroundColor Green
} elseif ($googleChange -eq 0) {
    Write-Host "⚠️  No new Google events detected" -ForegroundColor Yellow
    Write-Host "   Possible reasons:" -ForegroundColor Gray
    Write-Host "   - No new events were created in Google Calendar" -ForegroundColor Gray
    Write-Host "   - Events are outside sync time range (±12 months)" -ForegroundColor Gray
    Write-Host "   - Events were updated (not new)" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Google events decreased by $([Math]::Abs($googleChange))" -ForegroundColor Yellow
    Write-Host "   (Some events were deleted from Google Calendar)" -ForegroundColor Gray
}

if ($aiChange -lt 0) {
    Write-Host "`n❌ BUG: $([Math]::Abs($aiChange)) AI Platform events were DELETED!" -ForegroundColor Red
    Write-Host "   This should NOT happen during Google sync!" -ForegroundColor Red
} elseif ($aiChange -eq 0) {
    Write-Host "✅ AI Platform events preserved ($aiAfter events)" -ForegroundColor Green
}

# Show sample events
if ($googleAfter -gt 0) {
    Write-Host "`n=== GOOGLE CALENDAR EVENTS (sample) ===" -ForegroundColor Yellow
    $googleEvents = $eventsAfter | Where-Object { $_.source_platform -eq 'google' } | Select-Object -First 3
    foreach ($event in $googleEvents) {
        Write-Host "  • $($event.title)" -ForegroundColor White
        Write-Host "    $($event.startTime)" -ForegroundColor Gray
    }
}

Write-Host "`n=== NEXT STEPS ===" -ForegroundColor Cyan
Write-Host "1. Refresh your browser (F5)" -ForegroundColor White
Write-Host "2. Events should now appear in the calendar view" -ForegroundColor White
Write-Host "3. Check the 'Upcoming Events' section on dashboard`n" -ForegroundColor White
