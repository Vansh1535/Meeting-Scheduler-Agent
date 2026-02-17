# OAuth Setup Helper for 42vanshlilani@gmail.com

Write-Host "=== OAuth Setup for Phase 1 ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get user from database
Write-Host "Step 1: Checking if test user exists..." -ForegroundColor Yellow
$headers = @{
    "X-User-Email" = "42vanshlilani@gmail.com"
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/user" -Method GET -Headers $headers -ErrorAction Stop
    $userId = $response.id
    Write-Host "User found: $($response.email)" -ForegroundColor Green
    Write-Host "   User ID: $userId" -ForegroundColor Gray
} catch {
    Write-Host "Error getting user: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Check OAuth status
Write-Host "Step 2: Checking OAuth status..." -ForegroundColor Yellow
try {
    $oauthStatus = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/google/status/$userId" -Method GET -ErrorAction Stop
    
    if ($oauthStatus.connected) {
        Write-Host "Already connected to Google!" -ForegroundColor Green
        Write-Host "   Token expires: $($oauthStatus.expires_at)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "You can now run: .\test_oauth_status.ps1" -ForegroundColor Cyan
    } else {
        Write-Host "Not connected to Google" -ForegroundColor Yellow
        
        # Step 3: Get OAuth URL
        Write-Host ""
        Write-Host "Step 3: Getting OAuth URL..." -ForegroundColor Yellow
        $urlResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/google/url" -Method GET
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "YOUR OAUTH URL:" -ForegroundColor Green
        Write-Host $urlResponse.auth_url -ForegroundColor White
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "INSTRUCTIONS:" -ForegroundColor Yellow
        Write-Host "1. Copy the URL above" -ForegroundColor Gray
        Write-Host "2. Open it in a PRIVATE/INCOGNITO browser window" -ForegroundColor Gray
        Write-Host "3. Select ONLY: 42vanshlilani@gmail.com" -ForegroundColor Gray
        Write-Host "4. Grant calendar permissions" -ForegroundColor Gray
        Write-Host "5. Wait for redirect back to localhost" -ForegroundColor Gray
        Write-Host "6. Come back here and type 'done'" -ForegroundColor Gray
        Write-Host ""
    }
} catch {
    Write-Host "Error checking OAuth status: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "User ID for testing: $userId" -ForegroundColor Cyan
