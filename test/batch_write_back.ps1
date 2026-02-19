# Batch Write-Back: Write pending meetings to Google Calendar
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Batch Write-Back to Google Calendar" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will write your 28 meetings to Google Calendar if they're ready." -ForegroundColor Yellow
Write-Host ""

# Get user confirmation
Write-Host "Prerequisites:" -ForegroundColor Green
Write-Host "  1. Your Google account is connected and authorized" -ForegroundColor White
Write-Host "  2. Meetings have a 'selected_slot' (AI scheduling completed)" -ForegroundColor White
Write-Host "  3. Frontend dev server is running (npm run dev)" -ForegroundColor White
Write-Host ""

$continue = Read-Host "Does your frontend dev server running on http://localhost:3000? (y/n)"
if ($continue -ne 'y') {
    Write-Host ""
    Write-Host "Please start your frontend server first:" -ForegroundColor Yellow
    Write-Host "  cd frontend" -ForegroundColor White
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host ""
    exit
}

Write-Host ""
Write-Host "Step 1: Checking current status..." -ForegroundColor Green

try {
    # Check how many meetings need write-back
    Write-Host "  Making request to batch write-back endpoint (dry run)..." -ForegroundColor DarkGray
    
    $checkUrl = "http://localhost:3000/api/calendar/write-back"
    $checkBody = @{
        batch = $true
        limit = 50
    } | ConvertTo-Json

    Write-Host ""
    Write-Host "Request details:" -ForegroundColor Cyan
    Write-Host "  URL: $checkUrl" -ForegroundColor White
    Write-Host "  Method: POST" -ForegroundColor White
    Write-Host "  Body: $checkBody" -ForegroundColor White
    Write-Host ""

    Write-Host "Sending request..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri $checkUrl -Method Post -Body $checkBody -ContentType "application/json"

    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host "Write-Back Results" -ForegroundColor Cyan
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Total Processed: $($response.total_processed)" -ForegroundColor White
    Write-Host "Succeeded: $($response.succeeded)" -ForegroundColor Green
    Write-Host "Failed: $($response.failed)" -ForegroundColor $(if ($response.failed -gt 0) { "Red" } else { "White" })
    Write-Host ""

    if ($response.results) {
        Write-Host "Detailed Results:" -ForegroundColor Cyan
        foreach ($result in $response.results) {
            if ($result.success) {
                Write-Host "  ✅ Meeting written successfully" -ForegroundColor Green
                if ($result.google_event_id) {
                    Write-Host "     Event ID: $($result.google_event_id)" -ForegroundColor DarkGray
                }
                if ($result.google_event_link) {
                    Write-Host "     Link: $($result.google_event_link)" -ForegroundColor DarkGray
                }
                if ($result.already_exists) {
                    Write-Host "     (Already existed in Google Calendar)" -ForegroundColor DarkYellow
                }
            } else {
                Write-Host "  ❌ Meeting write-back failed" -ForegroundColor Red
                if ($result.error) {
                    Write-Host "     Error: $($result.error)" -ForegroundColor Red
                }
            }
            Write-Host ""
        }
    }

    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host "Next Steps" -ForegroundColor Cyan
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""

    if ($response.succeeded -gt 0) {
        Write-Host "✅ $($response.succeeded) meeting(s) successfully written to Google Calendar!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Now do the following:" -ForegroundColor Yellow
        Write-Host "  1. Check your Google Calendar - you should see new events" -ForegroundColor White
        Write-Host "  2. Look for '🤖 This event was created by the AI Meeting Scheduler' in descriptions" -ForegroundColor White
        Write-Host "  3. Click 'Sync Calendar' in your app to fetch these events" -ForegroundColor White
        Write-Host "  4. Verify events show as 'AI Platform' with RED color scheme" -ForegroundColor White
        Write-Host ""
    }

    if ($response.failed -gt 0) {
        Write-Host "⚠️  $($response.failed) meeting(s) failed to write" -ForegroundColor Red
        Write-Host ""
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "  - Google OAuth token expired → Reconnect in Settings" -ForegroundColor White
        Write-Host "  - Calendar not found → Check calendar permissions" -ForegroundColor White
        Write-Host "  - Invalid meeting data → Check meeting has selected_slot" -ForegroundColor White
        Write-Host ""
        Write-Host "Check the detailed error messages above" -ForegroundColor Yellow
    }

    if ($response.total_processed -eq 0) {
        Write-Host "ℹ️  No meetings ready for write-back" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Possible reasons:" -ForegroundColor Yellow
        Write-Host "  1. Meetings don't have 'selected_slot' (AI scheduling incomplete)" -ForegroundColor White
        Write-Host "  2. All meetings already written to Google Calendar" -ForegroundColor White
        Write-Host "  3. Meeting status is 'pending' (waiting for participant responses)" -ForegroundColor White
        Write-Host ""
        Write-Host "To verify, run:" -ForegroundColor Cyan
        Write-Host "  Get-Content test/analyze_meeting_status.ps1 | powershell.exe -" -ForegroundColor White
        Write-Host "Then check Query 2 in Supabase SQL Editor" -ForegroundColor White
    }

} catch {
    Write-Host ""
    Write-Host "❌ Error calling write-back API:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Is your frontend dev server running?" -ForegroundColor White
    Write-Host "     → cd frontend && npm run dev" -ForegroundColor DarkGray
    Write-Host "  2. Is it running on port 3000?" -ForegroundColor White
    Write-Host "     → Check the terminal where you started it" -ForegroundColor DarkGray
    Write-Host "  3. Check the dev server logs for errors" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
