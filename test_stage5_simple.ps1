# Stage 5 Simple Test - Direct Google Calendar Event Creation

Write-Host "`n=== Stage 5: Simple Write-Back Test ===" -ForegroundColor Cyan
Write-Host "Testing Google Calendar event creation directly`n" -ForegroundColor Gray

$userId = "e5f33381-a917-4e89-8eeb-61dae6811896"
$meetingId = "simple-test-$(Get-Date -Format 'yyyyMMddHHmmss')"

Write-Host "Creating test meeting data..." -ForegroundColor Yellow

# Create a simple test by calling the Google Calendar write service directly
$testBody = @{
    meeting_id = $meetingId
    organizer_user_id = $userId
    summary = "AI Test Meeting - Stage 5"
    description = @"
🤖 AI-Scheduled Meeting Test

This is a test event created by the Stage 5 write-back system.

Duration: 30 minutes
Timezone: America/New_York

Testing Calendar Write-Back Integration
"@
    start_time = (Get-Date).AddDays(5).AddHours(10).ToString("yyyy-MM-ddTHH:mm:ssZ")
    end_time = (Get-Date).AddDays(5).AddHours(10).AddMinutes(30).ToString("yyyy-MM-ddTHH:mm:ssZ")
    timezone = "America/New_York"
    attendees = @("lilanivansh@gmail.com", "test@example.com")
} | ConvertTo-Json

Write-Host "Test event details:" -ForegroundColor Green
Write-Host "  Start: $((Get-Date).AddDays(5).AddHours(10).ToString('yyyy-MM-dd HH:mm'))" -ForegroundColor Cyan
Write-Host "  Duration: 30 minutes" -ForegroundColor Cyan
Write-Host "  Attendees: lilanivansh@gmail.com, test@example.com" -ForegroundColor Cyan
Write-Host ""

Write-Host "Creating Google Calendar event..." -ForegroundColor Yellow

try {
    # For now, manually call the createCalendarEvent function
    # We'll create a simple API test endpoint
    Write-Host "⚠️  Direct API test not yet implemented" -ForegroundColor Yellow
    Write-Host "  The write-back service needs the meeting to have selected_slot data" -ForegroundColor Gray
    Write-Host "  Let me create a helper endpoint for testing..." -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. We need to either:" -ForegroundColor Gray
Write-Host "   a) Update meetings table to store selected_slot" -ForegroundColor Gray
Write-Host "   b) Create a test endpoint that bypasses database checks" -ForegroundColor Gray
Write-Host "   c) Manually insert test data with all required fields" -ForegroundColor Gray
