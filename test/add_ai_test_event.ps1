# Add Test AI Platform Event
# This script creates a test event to demonstrate AI Platform vs Google Calendar distinction

Write-Host "`n=== Adding Test AI Platform Event ===" -ForegroundColor Cyan
Write-Host "This test event will help distinguish AI-created events (red scheme) from Google Calendar events (blue scheme)`n" -ForegroundColor Gray

# Get user email
$userEmail = Read-Host "Enter your email address (the one you used to sign in)"
if ([string]::IsNullOrWhiteSpace($userEmail)) {
    Write-Host "Error: Email address is required" -ForegroundColor Red
    exit 1
}

Write-Host "`nFetching user ID..." -ForegroundColor Yellow

# Get user ID from Supabase
$getUserQuery = @"
SELECT id FROM users WHERE email = '$userEmail' LIMIT 1;
"@

try {
    $userResult = psql $env:SUPABASE_DB_URL -t -c $getUserQuery 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error connecting to database. Make sure SUPABASE_DB_URL is set." -ForegroundColor Red
        Write-Host "Error: $userResult" -ForegroundColor Red
        exit 1
    }
    
    $userId = $userResult.Trim()
    
    if ([string]::IsNullOrWhiteSpace($userId)) {
        Write-Host "Error: User not found with email $userEmail" -ForegroundColor Red
        Write-Host "Please make sure you've signed in to the application at least once." -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✓ Found user ID: $userId" -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Generate test meeting data
$meetingId = [guid]::NewGuid().ToString()
$now = Get-Date
$startTime = $now.AddDays(2).ToString("yyyy-MM-dd 10:00:00")
$endTime = $now.AddDays(2).ToString("yyyy-MM-dd 11:00:00")

Write-Host "`nCreating test AI Platform event..." -ForegroundColor Yellow
Write-Host "Meeting ID: $meetingId" -ForegroundColor Gray
Write-Host "Scheduled for: $startTime" -ForegroundColor Gray

# Insert test meeting
$insertMeetingQuery = @"
INSERT INTO meetings (
    meeting_id,
    organizer_id,
    title,
    description,
    status,
    created_at,
    updated_at
) VALUES (
    '$meetingId',
    '$userId',
    'AI Platform Test Event',
    'This is a test event created by the AI Meeting Scheduler so that we know how to distinguish events by creation platform. If you see this event displayed with a red color scheme, the platform labeling is working correctly!',
    'scheduled',
    NOW(),
    NOW()
) RETURNING id;
"@

try {
    $meetingResult = psql $env:SUPABASE_DB_URL -t -c $insertMeetingQuery 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error creating meeting: $meetingResult" -ForegroundColor Red
        exit 1
    }
    
    $internalMeetingId = $meetingResult.Trim()
    Write-Host "✓ Created meeting with internal ID: $internalMeetingId" -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Insert meeting candidate (time slot)
Write-Host "Adding meeting time slot..." -ForegroundColor Yellow

$insertCandidateQuery = @"
INSERT INTO meeting_candidates (
    meeting_id,
    slot_start,
    slot_end,
    is_selected,
    created_at
) VALUES (
    '$meetingId',
    '$startTime',
    '$endTime',
    true,
    NOW()
);
"@

try {
    psql $env:SUPABASE_DB_URL -c $insertCandidateQuery 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error creating meeting slot" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Added time slot" -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Add test participant
Write-Host "Adding test participant..." -ForegroundColor Yellow

$insertParticipantQuery = @"
INSERT INTO participant_availability (
    meeting_id,
    email,
    name,
    is_required,
    created_at
) VALUES (
    '$meetingId',
    '$userEmail',
    'You (Organizer)',
    true,
    NOW()
);
"@

try {
    psql $env:SUPABASE_DB_URL -c $insertParticipantQuery 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error adding participant" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Added participant" -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== SUCCESS ===" -ForegroundColor Green
Write-Host "Test AI Platform event created successfully!`n" -ForegroundColor Green

Write-Host "What to look for:" -ForegroundColor Cyan
Write-Host "  1. In the Calendar view: The day should show a RED gradient (slate to red)" -ForegroundColor White
Write-Host "  2. In the Event Details: Badge should say 'AI PLATFORM' with red color scheme" -ForegroundColor White
Write-Host "  3. In the Sidebar: Event should appear under 'AI Platform' with red border" -ForegroundColor White
Write-Host "  4. Event Cards: Should use navy-red gradient" -ForegroundColor White

Write-Host "`nEvent Details:" -ForegroundColor Cyan
Write-Host "  Title: AI Platform Test Event" -ForegroundColor White
Write-Host "  Date: $startTime" -ForegroundColor White
Write-Host "  Description: Contains platform distinction explanation" -ForegroundColor White

Write-Host "`nRefresh your browser to see the changes!`n" -ForegroundColor Yellow
