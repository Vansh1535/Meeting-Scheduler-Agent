#!/usr/bin/env pwsh
# Test AI Event Deletion

$userId = "04f1e29c-3a53-442a-b79d-e98e1f1dd314"

Write-Host "`n=== TEST AI EVENT DELETION ===" -ForegroundColor Cyan
Write-Host "User ID: $userId`n"

# Step 1: Create a test AI event
Write-Host "Step 1: Creating test AI event..." -ForegroundColor Yellow
$createResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/calendar/create-ai-event" -Method POST -ContentType "application/json" -Body (@{
    userId = $userId
    title = "Test Event to Delete"
    description = "This event will be deleted as a test"
    startTime = "2026-02-25T14:00:00Z"
    endTime = "2026-02-25T15:00:00Z"
    participantEmails = @("test@example.com")
    aiScore = 85.0
    aiReasoning = "Test event for deletion"
} | ConvertTo-Json)

$eventId = $createResponse.event.id
Write-Host "✅ Created event: $eventId`n" -ForegroundColor Green

# Step 2: Verify event exists
Write-Host "Step 2: Verifying event exists..." -ForegroundColor Yellow
$events = Invoke-RestMethod -Uri "http://localhost:3000/api/calendar/events?userId=$userId"
$foundEvent = $events | Where-Object { $_.id -eq $eventId }

if ($foundEvent) {
    Write-Host "✅ Event found in database" -ForegroundColor Green
    Write-Host "   Title: $($foundEvent.title)" -ForegroundColor White
    Write-Host "   Source: $($foundEvent.source_platform)`n" -ForegroundColor White
} else {
    Write-Host "❌ Event not found!`n" -ForegroundColor Red
    exit 1
}

# Step 3: Delete the event
Write-Host "Step 3: Deleting event..." -ForegroundColor Yellow
$deleteResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/calendar/delete-event" -Method POST -ContentType "application/json" -Body (@{
    eventId = $eventId
    reason = "Test deletion"
    notifyAttendees = $false
} | ConvertTo-Json)

Write-Host "✅ Delete API response:" -ForegroundColor Green
Write-Host "   $($deleteResponse | ConvertTo-Json)`n" -ForegroundColor White

# Step 4: Verify event is deleted
Write-Host "Step 4: Verifying event is deleted..." -ForegroundColor Yellow
Start-Sleep -Seconds 1
$eventsAfter = Invoke-RestMethod -Uri "http://localhost:3000/api/calendar/events?userId=$userId"
$stillExists = $eventsAfter | Where-Object { $_.id -eq $eventId }

if ($stillExists) {
    Write-Host "❌ Event still exists after deletion!`n" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ Event successfully deleted from database`n" -ForegroundColor Green
}

Write-Host "=== TEST COMPLETE ===" -ForegroundColor Cyan
Write-Host "All steps passed!`n" -ForegroundColor Green
