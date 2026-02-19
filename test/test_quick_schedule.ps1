# Test Quick Schedule Endpoint
# Creates a test event using the quick schedule API

$ProgressPreference = 'SilentlyContinue'
$baseUrls = @("http://localhost:3001", "http://localhost:3000")

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Testing Quick Schedule API" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$body = @{
    userId = "1799d245-456f-4b64-ba14-f31e2e5f6b2d"
    title = "Integration Test Meeting"
    description = "Testing the quick schedule endpoint"
    duration = 30
    category = "meeting"
    preferredDate = "2026-02-15"
    preferredTime = "14:00"
    priority = "medium"
    flexibility = "flexible"
} | ConvertTo-Json

Write-Host "Sending request..." -ForegroundColor Yellow
Write-Host "Body:" -ForegroundColor Gray
Write-Host $body -ForegroundColor Gray
Write-Host ""

try {
    $response = $null
    foreach ($url in $baseUrls) {
        try {
            $response = Invoke-RestMethod -Uri "$url/api/schedule/quick" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 10
            break
        } catch {
            $statusCode = $null
            if ($_.Exception.Response) {
                try { $statusCode = [int]$_.Exception.Response.StatusCode } catch { $statusCode = $null }
            }

            if ($statusCode -eq 404 -or $statusCode -eq 405) {
                continue
            }

            if ($_.Exception.Message -notlike "*Unable to connect*") {
                throw
            }
        }
    }

    if (-not $response) {
        throw "Unable to connect to the remote server"
    }
    
    if ($response.success) {
        Write-Host "Quick Schedule API working!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Response:" -ForegroundColor Cyan
        Write-Host "  - Success: $($response.success)" -ForegroundColor Gray
        Write-Host "  - Meeting ID: $($response.meetingId)" -ForegroundColor Gray
        
        if ($response.demo) {
            Write-Host ""
            Write-Host "NOTE: Running in DEMO mode (Python AI not connected)" -ForegroundColor Yellow
            Write-Host "   The event was created but not processed by AI" -ForegroundColor Gray
            Write-Host ""
            Write-Host "To enable full AI processing:" -ForegroundColor Cyan
            Write-Host "  1. Start Python service: cd python-service; uvicorn main:app --reload" -ForegroundColor Gray
            Write-Host "  2. Re-run this test" -ForegroundColor Gray
        } else {
            Write-Host ""
            Write-Host "Full AI processing completed!" -ForegroundColor Green
            if ($response.scheduledSlot) {
                Write-Host "  - Scheduled: $($response.scheduledSlot.start)" -ForegroundColor Gray
                Write-Host "  - Score: $($response.scheduledSlot.score)" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "ERROR: Quick Schedule failed" -ForegroundColor Red
        Write-Host "$($response | ConvertTo-Json -Depth 5)" -ForegroundColor Gray
    }
} catch {
    $errorDetails = $null
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
        try {
            $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction Stop
        } catch {
            $errorDetails = $null
        }
    }

    if ($errorDetails -and $errorDetails.demo -eq $true -and $errorDetails.success -eq $true) {
        Write-Host "Quick Schedule API working (Demo Mode)!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Response:" -ForegroundColor Cyan
        Write-Host "  - Success: $($errorDetails.success)" -ForegroundColor Gray
        Write-Host "  - Meeting ID: $($errorDetails.meetingId)" -ForegroundColor Gray
        Write-Host "  - Message: $($errorDetails.message)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "NOTE: Python AI service not running" -ForegroundColor Yellow
        Write-Host "   The API is working, but full scheduling requires Python service" -ForegroundColor Gray
    } else {
        Write-Host "ERROR: Quick Schedule API failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Error Details:" -ForegroundColor Gray
        if ($errorDetails) {
            Write-Host ($errorDetails | ConvertTo-Json -Depth 5) -ForegroundColor Gray
        } else {
            Write-Host $_ -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Quick Schedule Test Complete" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
