# Re-sync Calendar with Future Events

Write-Host "=== Calendar Re-Sync (Future Events Enabled) ===" -ForegroundColor Cyan
Write-Host ""

$userId = "1799d245-456f-4b64-ba14-f31e2e5f6b2d"

Write-Host "Syncing calendar..." -ForegroundColor Yellow

try {
    $syncBody = @{ force_refresh = $true } | ConvertTo-Json
    $syncResult = Invoke-RestMethod -Uri "http://localhost:3000/api/calendar/sync/$userId" -Method POST -Body $syncBody -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "  Events fetched: $($syncResult.events_fetched)" -ForegroundColor Gray
    Write-Host "  Events added: $($syncResult.events_added)" -ForegroundColor Gray
    Write-Host "  Events updated: $($syncResult.events_updated)" -ForegroundColor Gray
    
} catch {
    Write-Host "Sync failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Checking database..." -ForegroundColor Yellow

$headers = @{
    "X-User-Email" = "42vanshlilani@gmail.com"
}

try {
    $events = Invoke-RestMethod -Uri "http://localhost:3000/api/calendar/events?userId=$userId" -Method GET -Headers $headers -ErrorAction Stop
    
    Write-Host "Total events: $($events.events.Length)" -ForegroundColor Cyan
    
    if ($events.events.Length -gt 0) {
        Write-Host ""
        Write-Host "Recent events:" -ForegroundColor White
        $events.events | Select-Object -First 10 | ForEach-Object {
            $date = Get-Date $_.start_time -Format "MMM dd, HH:mm"
            Write-Host "  - $($_.title) @ $date" -ForegroundColor Gray
        }
        
        Write-Host ""
        Write-Host "UI should now show these events!" -ForegroundColor Green
        Write-Host "Go to: http://localhost:3000/dashboard" -ForegroundColor Cyan
    } else {
        Write-Host "No events found" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "Error checking database: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
