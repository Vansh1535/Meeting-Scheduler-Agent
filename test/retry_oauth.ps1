# Manual OAuth Flow Test - Try Again
# This time we'll check what URL you landed on

Write-Host "=== OAuth Flow Diagnosis ===" -ForegroundColor Cyan
Write-Host ""

$userId = "1799d245-456f-4b64-ba14-f31e2e5f6b2d"

Write-Host "Let's try the OAuth flow again with better monitoring..." -ForegroundColor Yellow
Write-Host ""

# Get fresh OAuth URL
Write-Host "Getting new OAuth URL..." -ForegroundColor Yellow
$urlResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/google/url" -Method GET

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "OAUTH URL:" -ForegroundColor Green
Write-Host $urlResponse.auth_url -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "STEPS:" -ForegroundColor Yellow
Write-Host "1. Copy the URL above" -ForegroundColor Gray
Write-Host "2. Open in PRIVATE browser window" -ForegroundColor Gray
Write-Host "3. Select 42vanshlilani@gmail.com" -ForegroundColor Gray
Write-Host "4. Click 'Allow' to grant permissions" -ForegroundColor Gray
Write-Host ""
Write-Host "5. AFTER REDIRECT - Look at the URL in your browser" -ForegroundColor Cyan
Write-Host "   Does it have ?auth=success OR ?error= OR ?code= ?" -ForegroundColor Cyan
Write-Host ""
Write-Host "6. Copy the FULL URL from your browser address bar" -ForegroundColor Cyan
Write-Host "   Then run: .\parse_callback_url.ps1" -ForegroundColor Cyan
Write-Host ""
