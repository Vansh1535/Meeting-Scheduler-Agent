# Parse OAuth Callback URL
# If the automatic callback didn't work, this script can manually complete the flow

Write-Host "=== Manual OAuth Completion ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Paste the FULL URL from your browser after OAuth redirect:" -ForegroundColor Yellow
Write-Host "(Should look like: http://localhost:3000/...?code=... or ?auth=success...)" -ForegroundColor Gray
Write-Host ""

$callbackUrl = Read-Host "URL"

if (-not $callbackUrl) {
    Write-Host "No URL provided" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Parse URL
try {
    $uri = [System.Uri]$callbackUrl
    $query = [System.Web.HttpUtility]::ParseQueryString($uri.Query)
    
    $code = $query['code']
    $error = $query['error']
    $authSuccess = $query['auth']
    $userId = $query['user_id']
    
    if ($authSuccess -eq 'success') {
        Write-Host "OAuth completed successfully!" -ForegroundColor Green
        Write-Host "User ID: $userId" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Now run: .\test_oauth_status.ps1" -ForegroundColor Cyan
        exit 0
    }
    
    if ($error) {
        Write-Host "OAuth error: $error" -ForegroundColor Red
        Write-Host "Message: $($query['message'])" -ForegroundColor Yellow
        exit 1
    }
    
    if ($code) {
        Write-Host "Found authorization code!" -ForegroundColor Green
        Write-Host "Code (first 20 chars): $($code.Substring(0, [Math]::Min(20, $code.Length)))..." -ForegroundColor Gray
        Write-Host ""
        Write-Host "Manually completing OAuth flow..." -ForegroundColor Yellow
        
        # Send code to callback endpoint
        $body = @{ code = $code } | ConvertTo-Json
        $result = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/google/callback" -Method POST -Body $body -ContentType "application/json"
        
        Write-Host "OAuth completed!" -ForegroundColor Green
        Write-Host "User ID: $($result.user_id)" -ForegroundColor Gray
        Write-Host "Email: $($result.email)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Now run: .\test_oauth_status.ps1" -ForegroundColor Cyan
    } else {
        Write-Host "No code or auth parameters found in URL" -ForegroundColor Red
        Write-Host "The URL should have ?code= or ?auth= parameters" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "Error parsing URL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
