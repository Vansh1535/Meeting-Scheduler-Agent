#!/usr/bin/env pwsh
# Force clear all calendar events for a user

param(
    [string]$UserId = "e5f33381-a917-4e89-8eeb-61dae6811896"
)

Write-Host "`n⚠️  FORCE CLEAR CALENDAR EVENTS" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Yellow

Write-Host "This will DELETE ALL calendar_events for user:" -ForegroundColor White
Write-Host "  $UserId`n" -ForegroundColor Cyan

$confirmation = Read-Host "Type 'DELETE' to confirm"

if ($confirmation -ne 'DELETE') {
    Write-Host "`n❌ Cancelled. No events deleted.`n" -ForegroundColor Red
    exit
}

Write-Host "`n🗑️  Deleting all events..." -ForegroundColor Yellow

# Use the Supabase REST API directly
$supabaseUrl = "https://jokifzctbhkmgndjrwaj.supabase.co"
$supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva2lmemN0YmhrbWduZGpyd2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MTgxNzIsImV4cCI6MjA2MDE5NDE3Mn0.VT7FMRCCjqd_FeHM3b43tGF2lJDqw5aKBHjJnDOUH8M"

try {
    # First, count how many events
    $countUrl = "$supabaseUrl/rest/v1/calendar_events?user_id=eq.$UserId&select=count"
    $headers = @{
        "apikey" = $supabaseKey
        "Authorization" = "Bearer $supabaseKey"
        "Prefer" = "count=exact"
    }
    
    $countResponse = Invoke-RestMethod -Uri $countUrl -Method GET -Headers $headers -ContentType "application/json"
    Write-Host "Found events to delete (check Content-Range header)`n" -ForegroundColor Cyan
    
    # Delete all events for this user
    $deleteUrl = "$supabaseUrl/rest/v1/calendar_events?user_id=eq.$UserId"
    $deleteResponse = Invoke-RestMethod -Uri $deleteUrl -Method DELETE -Headers $headers -ContentType "application/json"
    
    Write-Host "✅ Successfully deleted all calendar events!`n" -ForegroundColor Green
    Write-Host "Now click 'Sync Calendar' to fetch fresh events from Google.`n" -ForegroundColor Cyan
    
} catch {
    Write-Host "`n❌ Error: $_`n" -ForegroundColor Red
    Write-Host "You may need to manually delete via Supabase dashboard.`n" -ForegroundColor Yellow
}
