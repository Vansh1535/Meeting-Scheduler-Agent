#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Check if user has calendar events in the database
    
.DESCRIPTION
    Verifies if calendar events are synced and stored in Supabase
#>

$ErrorActionPreference = "Stop"

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Calendar Events Status Check" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Configuration
$FRONTEND_URL = "http://localhost:3000"
$USER_EMAIL = "lilanvansh@gmail.com"  # From the screenshot

Write-Host "🔍 Checking calendar events for: $USER_EMAIL" -ForegroundColor Yellow
Write-Host ""

# First, get the user ID
Write-Host "Step 1: Getting user ID..." -ForegroundColor Cyan
try {
    $userResponse = Invoke-RestMethod `
        -Uri "$FRONTEND_URL/api/auth/user" `
        -Method GET `
        -Headers @{
            "X-User-Email" = $USER_EMAIL
        }
    
    $userId = $userResponse.id
    Write-Host "✅ User ID: $userId" -ForegroundColor Green
    Write-Host "   Email: $($userResponse.email)" -ForegroundColor White
    Write-Host "   Name: $($userResponse.displayName)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ Failed to get user ID: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "  1. Frontend is running (npm run dev)" -ForegroundColor White
    Write-Host "  2. User is logged in" -ForegroundColor White
    exit 1
}

# Check calendar events
Write-Host "Step 2: Checking calendar events..." -ForegroundColor Cyan
try {
    $eventsResponse = Invoke-RestMethod `
        -Uri "$FRONTEND_URL/api/calendar/events?userId=$userId" `
        -Method GET
    
    $eventCount = $eventsResponse.Count
    
    if ($eventCount -eq 0) {
        Write-Host "⚠️  No calendar events found in database" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "This means:" -ForegroundColor Yellow
        Write-Host "  • Calendar has not been synced yet" -ForegroundColor White
        Write-Host "  • OR Calendar is actually empty" -ForegroundColor White
        Write-Host ""
        Write-Host "To sync calendar:" -ForegroundColor Cyan
        Write-Host "  1. Go to Dashboard: $FRONTEND_URL/dashboard" -ForegroundColor White
        Write-Host "  2. Click 'Sync Calendar' button" -ForegroundColor White
        Write-Host "  3. Wait for sync to complete" -ForegroundColor White
        Write-Host ""
        Write-Host "Or run: .\test\resync_calendar.ps1" -ForegroundColor White
    } else {
        Write-Host "✅ Found $eventCount calendar events!" -ForegroundColor Green
        Write-Host ""
        
        # Show first few events
        Write-Host "📅 Recent Events:" -ForegroundColor Cyan
        Write-Host ""
        
        $eventsToShow = [Math]::Min(5, $eventCount)
        for ($i = 0; $i -lt $eventsToShow; $i++) {
            $event = $eventsResponse[$i]
            $startTime = [DateTime]::Parse($event.startTime).ToLocalTime()
            
            Write-Host "  $($i + 1). $($event.title)" -ForegroundColor White
            Write-Host "     📍 $($startTime.ToString('MMM dd, yyyy h:mm tt'))" -ForegroundColor Gray
            Write-Host ""
        }
        
        if ($eventCount > 5) {
            Write-Host "  ... and $($eventCount - 5) more events" -ForegroundColor Gray
            Write-Host ""
        }
    }
} catch {
    Write-Host "❌ Failed to fetch calendar events: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# Check OAuth status
Write-Host "Step 3: Checking OAuth connection..." -ForegroundColor Cyan
try {
    $oauthResponse = Invoke-RestMethod `
        -Uri "$FRONTEND_URL/api/auth/google/status/$userId" `
        -Method GET
    
    if ($oauthResponse.connected) {
        Write-Host "✅ Google Calendar Connected" -ForegroundColor Green
        
        if ($oauthResponse.lastSync) {
            $lastSync = [DateTime]::Parse($oauthResponse.lastSync)
            $timeSince = (Get-Date) - $lastSync
            Write-Host "   Last sync: $($lastSync.ToString('MMM dd, yyyy h:mm tt'))" -ForegroundColor White
            Write-Host "   ($([Math]::Floor($timeSince.TotalHours))h ago)" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ Google Calendar NOT Connected" -ForegroundColor Red
        Write-Host ""
        Write-Host "To connect:" -ForegroundColor Yellow
        Write-Host "  1. Go to Settings: $FRONTEND_URL/settings" -ForegroundColor White
        Write-Host "  2. Click 'Connect Google Calendar'" -ForegroundColor White
        Write-Host "  3. Authorize access" -ForegroundColor White
    }
    Write-Host ""
} catch {
    Write-Host "⚠️  Could not check OAuth status" -ForegroundColor Yellow
    Write-Host ""
}

# Summary
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($eventCount -gt 0) {
    Write-Host "✅ Your calendar is synced and working!" -ForegroundColor Green
    Write-Host ""
    Write-Host "The dashboard, calendar, and analytics should now show:" -ForegroundColor White
    Write-Host "  • $eventCount events in your calendar" -ForegroundColor Gray
    Write-Host "  • Event markers on calendar days" -ForegroundColor Gray
    Write-Host "  • Analytics charts with real data" -ForegroundColor Gray
    Write-Host "  • Personalized AI insights" -ForegroundColor Gray
    Write-Host ""
    Write-Host "If you still see 'No events', try:" -ForegroundColor Yellow
    Write-Host "  • Refresh the page (Ctrl+R)" -ForegroundColor White
    Write-Host "  • Check browser console (F12) for errors" -ForegroundColor White
    Write-Host "  • Look at terminal logs for API errors" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠️  No events found - Calendar needs to be synced" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor White
    Write-Host "  1. Ensure Google Calendar is connected" -ForegroundColor Gray
    Write-Host "  2. Run calendar sync" -ForegroundColor Gray
    Write-Host "  3. Wait for sync to complete (~10-30 seconds)" -ForegroundColor Gray
    Write-Host "  4. Refresh the page" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "Done!" -ForegroundColor Green
Write-Host ""
