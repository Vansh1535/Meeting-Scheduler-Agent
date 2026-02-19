# Debug Dashboard Events
# This script helps diagnose why events aren't showing on the dashboard

Write-Host "🔍 Debugging Dashboard Events" -ForegroundColor Cyan
Write-Host ""

# Check if dev server is running
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "✅ Dev server is running" -ForegroundColor Green
} else {
    Write-Host "❌ Dev server is not running. Start it with: npm run dev" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "📋 Troubleshooting Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Open Browser Console (F12)" -ForegroundColor Cyan
Write-Host "   - Navigate to http://localhost:3000/dashboard" -ForegroundColor White
Write-Host "   - Look for '📅 Dashboard Events:' log" -ForegroundColor White
Write-Host "   - Check if calendarEvents or aiMeetings have data" -ForegroundColor White
Write-Host ""

Write-Host "2. Check API Endpoints:" -ForegroundColor Cyan
Write-Host "   - Calendar Events: http://localhost:3000/api/calendar/events?userId=<your-user-id>" -ForegroundColor White
Write-Host "   - AI Meetings: http://localhost:3000/api/meetings?userId=<your-user-id>" -ForegroundColor White
Write-Host ""

Write-Host "3. Verify Database:" -ForegroundColor Cyan
Write-Host "   - Check if 'calendar_events' table has entries" -ForegroundColor White
Write-Host "   - Check if 'meetings' table has entries" -ForegroundColor White
Write-Host ""

Write-Host "4. Sync Google Calendar:" -ForegroundColor Cyan
Write-Host "   - Go to Dashboard → Click 'Sync Calendar'" -ForegroundColor White
Write-Host "   - Or go to Settings → Calendar section" -ForegroundColor White
Write-Host ""

Write-Host "5. Common Issues:" -ForegroundColor Cyan
Write-Host "   ❌ Google Calendar not synced → No calendar_events data" -ForegroundColor Yellow
Write-Host "   ❌ No AI meetings scheduled → No meetings data" -ForegroundColor Yellow
Write-Host "   ❌ API returning empty arrays → Check network tab" -ForegroundColor Yellow
Write-Host "   ❌ Loading forever → Check for errors in console" -ForegroundColor Yellow
Write-Host ""

Write-Host "💡 Quick Fix:" -ForegroundColor Green
Write-Host "   If you see stats (14 events, 8h) but no event cards:" -ForegroundColor White
Write-Host "   → The stats come from 'meetings' table (AI scheduling)" -ForegroundColor White
Write-Host "   → The cards show 'calendar_events' (Google Calendar)" -ForegroundColor White
Write-Host "   → Sync your Google Calendar to populate calendar_events!" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"
