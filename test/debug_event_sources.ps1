#!/usr/bin/env pwsh
# Debug: Show all events with their source_platform values

$userId = "1799d245-456f-4b64-ba14-f31e2e5f6b2d"

Write-Host "`n=== ALL CALENDAR EVENTS (Detailed) ===" -ForegroundColor Cyan

$events = Invoke-RestMethod -Uri "http://localhost:3000/api/calendar/events?userId=$userId"

Write-Host "Total events: $($events.Count)`n"

foreach ($event in $events) {
    $color = if ($event.source_platform -eq 'google') { 'Yellow' } 
             elseif ($event.source_platform -eq 'ai_platform') { 'Red' }
             else { 'Gray' }
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $color
    Write-Host "Title: $($event.title)" -ForegroundColor White
    Write-Host "Source Platform: '$($event.source_platform)'" -ForegroundColor $color
    Write-Host "Google Event ID: $($event.google_event_id)" -ForegroundColor Gray
    Write-Host "Start: $($event.startTime)" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
$google = ($events | Where-Object { $_.source_platform -eq 'google' }).Count
$ai = ($events | Where-Object { $_.source_platform -eq 'ai_platform' }).Count
$null_or_empty = ($events | Where-Object { -not $_.source_platform }).Count

Write-Host "Google Calendar (source_platform='google'): $google" -ForegroundColor Yellow
Write-Host "AI Platform (source_platform='ai_platform'): $ai" -ForegroundColor Red
Write-Host "NULL or empty source_platform: $null_or_empty" -ForegroundColor Gray
Write-Host ""
