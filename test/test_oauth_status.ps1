# Test OAuth Status and Run Calendar Sync

Write-Host "=== Checking OAuth Status ===" -ForegroundColor Cyan
Write-Host ""

# Get user
$headers = @{
    "X-User-Email" = "42vanshlilani@gmail.com"
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/user" -Method GET -Headers $headers -ErrorAction Stop
    $userId = $response.id
    
    Write-Host "User: $($response.email)" -ForegroundColor Gray
    Write-Host "User ID: $userId" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "Error getting user: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Check OAuth status
Write-Host "Checking Google OAuth connection..." -ForegroundColor Yellow
try {
    $oauthStatus = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/google/status/$userId" -Method GET -ErrorAction Stop
    
    if ($oauthStatus.connected) {
        Write-Host "CONNECTED to Google!" -ForegroundColor Green
        Write-Host "   Expires: $($oauthStatus.expires_at)" -ForegroundColor Gray
        
        Write-Host ""
        Write-Host "=== Running Calendar Sync ===" -ForegroundColor Cyan
        
        try {
            $syncResult = Invoke-RestMethod -Uri "http://localhost:3000/api/calendar/sync/$userId" -Method POST -ErrorAction Stop
            
            Write-Host "Sync completed!" -ForegroundColor Green
            
            if ($syncResult.events_count) {
                Write-Host "   Events synced: $($syncResult.events_count)" -ForegroundColor Gray
            }
            if ($syncResult.status) {
                Write-Host "   Status: $($syncResult.status)" -ForegroundColor Gray
            }
            
            if ($syncResult.calendars) {
                Write-Host ""
                Write-Host "Calendars found:" -ForegroundColor Yellow
                $syncResult.calendars | ForEach-Object {
                    Write-Host "  - $($_.summary) ($($_.id))" -ForegroundColor Gray
                }
            }
            
            Write-Host ""
            Write-Host "Next step: Run .\test_write_back.ps1 to test event creation" -ForegroundColor Cyan
            
        } catch {
            Write-Host "Sync failed: $($_.Exception.Message)" -ForegroundColor Red
            if ($_.ErrorDetails.Message) {
                $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
                if ($errorObj.error) {
                    Write-Host "   Details: $($errorObj.error)" -ForegroundColor Yellow
                }
            }
        }
        
    } else {
        Write-Host "NOT CONNECTED to Google" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please run: .\oauth_setup.ps1" -ForegroundColor Yellow
        Write-Host "And complete the OAuth flow in your browser" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error checking OAuth: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
