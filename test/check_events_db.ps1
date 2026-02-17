# Direct Database Check

Write-Host "=== Checking Database Directly ===" -ForegroundColor Cyan
Write-Host ""

$userId = "1799d245-456f-4b64-ba14-f31e2e5f6b2d"

Write-Host "Querying calendar_events table..." -ForegroundColor Yellow

$headers = @{
    "X-User-Email" = "42vanshlilani@gmail.com"
}

try {
    $events = Invoke-RestMethod -Uri "http://localhost:3000/api/calendar/events?userId=$userId" -Method GET -Headers $headers -ErrorAction Stop
    
    Write-Host "Response type: $($events.GetType().Name)" -ForegroundColor Gray
    
    if ($events -is [array]) {
        Write-Host "Total events: $($events.Length)" -ForegroundColor Cyan
        
        if ($events.Length -gt 0) {
            Write-Host ""
            Write-Host "Events found:" -ForegroundColor Green
            $events | ForEach-Object {
                $date = Get-Date $_.startTime -Format "MMM dd, yyyy HH:mm"
                Write-Host "  - $($_.title) @ $date" -ForegroundColor White
            }
            
            Write-Host ""
            Write-Host "UI should show these! Refresh your browser at:" -ForegroundColor Green
            Write-Host "http://localhost:3000/dashboard" -ForegroundColor Cyan
        } else {
            Write-Host ""
            Write-Host "No events in database yet" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "This might be because:" -ForegroundColor Gray
            Write-Host "1. The event was created with a different user_id" -ForegroundColor Gray
            Write-Host "2. The sync didn't store it properly" -ForegroundColor Gray
            Write-Host ""
            Write-Host "Let's create a test event directly in the database..." -ForegroundColor Yellow
        }
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
