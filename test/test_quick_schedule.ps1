# Test Quick Schedule Endpoint
# Creates a test event using the quick schedule API

$ProgressPreference = 'SilentlyContinue'
$baseUrl = "http://localhost:3001"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Testing Quick Schedule API" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$body = @{
    userId = "demo-user-123"
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
    $response = Invoke-RestMethod -Uri "$baseUrl/api/schedule/quick" -Method Post -Body $body -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ Quick Schedule API working!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Response:" -ForegroundColor Cyan
        Write-Host "  - Success: $($response.success)" -ForegroundColor Gray
        Write-Host "  - Meeting ID: $($response.meetingId)" -ForegroundColor Gray
        
        if ($response.demo) {
            Write-Host ""
            Write-Host "⚠️  Note: Running in DEMO mode (Python AI not connected)" -ForegroundColor Yellow
            Write-Host "   The event was created but not processed by AI" -ForegroundColor Gray
            Write-Host ""
            Write-Host "To enable full AI processing:" -ForegroundColor Cyan
            Write-Host "  1. Start Python service: cd python-service; uvicorn main:app --reload" -ForegroundColor Gray
            Write-Host "  2. Re-run this test" -ForegroundColor Gray
        } else {
            Write-Host ""
            Write-Host "✅ Full AI processing completed!" -ForegroundColor Green
            if ($response.scheduledSlot) {
                Write-Host "  - Scheduled: $($response.scheduledSlot.start)" -ForegroundColor Gray
                Write-Host "  - Score: $($response.scheduledSlot.score)" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "❌ Quick Schedule failed" -ForegroundColor Red
        Write-Host "$($response | ConvertTo-Json -Depth 5)" -ForegroundColor Gray
    }
} catch {
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
    
    if ($errorDetails.demo -eq $true -and $errorDetails.success -eq $true) {
        Write-Host "✅ Quick Schedule API working (Demo Mode)!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Response:" -ForegroundColor Cyan
        Write-Host "  - Success: $($errorDetails.success)" -ForegroundColor Gray
        Write-Host "  - Meeting ID: $($errorDetails.meetingId)" -ForegroundColor Gray
        Write-Host "  - Message: $($errorDetails.message)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "⚠️  Note: Python AI service not running" -ForegroundColor Yellow
        Write-Host "   The API is working, but full scheduling requires Python service" -ForegroundColor Gray
    } else {
        Write-Host "❌ Quick Schedule API failed: $_" -ForegroundColor Red
        Write-Host "Error Details:" -ForegroundColor Gray
        Write-Host $_ -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Quick Schedule Test Complete" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
