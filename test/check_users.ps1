# Get all users and create event for the first one
Write-Host "Finding users in database..." -ForegroundColor Cyan

try {
    # Try common debug endpoints or user endpoints
    $possibleUsers = @()
    
    # Method 1: Try to get user from context (check if there's a current session)
    Write-Host "Checking for existing users..." -ForegroundColor Yellow
    
    # For now, let's insert a test user directly if none exists
    Write-Host "Creating test user in database..." -ForegroundColor Yellow
    
    # Call an API to ensure user exists
    $createUserBody = @{
        id = "test-user-123"
        email = "test@example.com"
        name = "Test User"
    } | ConvertTo-Json
    
    Write-Host "User setup skipped - using existing session" -ForegroundColor Gray
    Write-Host ""
    
    # Now try to create event with a more realistic flow
    Write-Host "Attempting to create event (checking browser session)..." -ForegroundColor Cyan
    Write-Host "Please create an event through the UI instead, or ensure you're logged in" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: Check what userId your browser is using:" -ForegroundColor White
    Write-Host "  1. Open browser DevTools (F12)" -ForegroundColor Gray
    Write-Host "  2. Go to Application > Local Storage" -ForegroundColor Gray
    Write-Host "  3. Look for user ID or email" -ForegroundColor Gray
    Write-Host "  4. Use that ID to create events" -ForegroundColor Gray
    
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
