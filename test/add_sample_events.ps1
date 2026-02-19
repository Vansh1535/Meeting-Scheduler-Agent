#!/usr/bin/env pwsh
# Add sample calendar events to the database for testing

Write-Host "`n🔧 Adding Sample Calendar Events...`n" -ForegroundColor Cyan

$userId = "47cbaa36-a90f-4f0c-b893-c92afd6d6f77"
$apiUrl = "http://localhost:3000/api/calendar/events"

# Sample events
$events = @(
    @{
        title = "AMD Slingshot Registration"
        summary = "Register for the AMD Slingshot Innovation Challenge"
        description = "Complete registration for the AMD Slingshot hackathon focusing on AI and data center technologies"
        startTime = "2026-02-25T10:00:00Z"
        endTime = "2026-02-25T11:00:00Z"
        category = "confirmed"
        location = "Online"
        timezone = "UTC"
    },
    @{
        title = "AMD Slingshot Prototype"
        summary = "Prototype Development Workshop"
        description = "Build and refine your prototype for the AMD Slingshot competition"
        startTime = "2026-03-01T14:00:00Z"
        endTime = "2026-03-01T17:00:00Z"
        category = "confirmed"
        location = "AMD Campus, Santa Clara"
        timezone = "America/Los_Angeles"
    },
    @{
        title = "AMD Slingshot Shortlist"
        summary = "Shortlist Announcement"
        description = "Results announcement for shortlisted teams in AMD Slingshot"
        startTime = "2026-03-10T18:00:00Z"
        endTime = "2026-03-10T19:00:00Z"
        category = "confirmed"
        location = "Virtual Event"
        timezone = "UTC"
    },
    @{
        title = "AMD Slingshot Finals RSVP"
        summary = "RSVP for Finals Event"
        description = "Confirm attendance for the AMD Slingshot Grand Finals"
        startTime = "2026-03-15T09:00:00Z"
        endTime = "2026-03-15T10:00:00Z"
        category = "confirmed"
        location = "AMD Innovation Center"
        timezone = "America/Los_Angeles"
    }
)

Write-Host "Note: This script requires a proper API endpoint to create events." -ForegroundColor Yellow
Write-Host "The current API only supports GET requests.`n" -ForegroundColor Yellow

Write-Host "📋 Sample events prepared:" -ForegroundColor Green
foreach ($event in $events) {
    Write-Host "   ✓ $($event.title)" -ForegroundColor Cyan
}

Write-Host "`n💡 To populate the database, you need to:" -ForegroundColor Magenta
Write-Host "   1. Sync your Google Calendar with these events, OR" -ForegroundColor Gray
Write-Host "   2. Use the database migration/seed script, OR" -ForegroundColor Gray
Write-Host "   3. Create events through the app's Quick Schedule feature`n" -ForegroundColor Gray

Write-Host "🌐 Visit http://localhost:3000/quick-schedule to create events`n" -ForegroundColor Green
