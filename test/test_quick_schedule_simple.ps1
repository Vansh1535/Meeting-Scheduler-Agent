# Test Quick Schedule API

Write-Host "=== Testing Quick Schedule API ===" -ForegroundColor Cyan
Write-Host ""

$userId = "1799d245-456f-4b64-ba14-f31e2e5f6b2d"

$tomorrow = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")

$quickRequest = @{
    userId = $userId
    title = "Quick Team Sync"
    description = "Test quick scheduling"
    duration = 30
    category = "meeting"
    preferredDate = $tomorrow
    preferredTime = "14:00"
    priority = "medium"
    flexibility = "flexible"
} | ConvertTo-Json

Write-Host "Requesting quick schedule..." -ForegroundColor Yellow
Write-Host "Title: Quick Team Sync" -ForegroundColor Gray
Write-Host "Date: $tomorrow at 14:00" -ForegroundColor Gray
Write-Host ""

try {
    $result = Invoke-RestMethod -Uri "http://localhost:3000/api/schedule/quick" -Method POST -Body $quickRequest -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host ""
    
    if ($result.candidates -and $result.candidates.Length -gt 0) {
        Write-Host "Found $($result.candidates.Length) time slots:" -ForegroundColor Cyan
        
        for ($i = 0; $i -lt [Math]::Min(3, $result.candidates.Length); $i++) {
            $slot = $result.candidates[$i]
            $startTime = Get-Date $slot.start_time -Format "MMM dd, HH:mm"
            Write-Host "  $($i+1). $startTime - Score: $($slot.score)/100" -ForegroundColor Gray
            if ($slot.reasoning) {
                Write-Host "     $($slot.reasoning.Substring(0, [Math]::Min(60, $slot.reasoning.Length)))..." -ForegroundColor DarkGray
            }
        }
    } else {
        Write-Host "No time slots found" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "AI scheduling is working!" -ForegroundColor Green
    
} catch {
    Write-Host "FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    
    if ($_.ErrorDetails.Message) {
        try {
            $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
            if ($errorObj.error) {
                Write-Host "Details: $($errorObj.error)" -ForegroundColor Yellow
            }
        } catch {}
    }
}

Write-Host ""
