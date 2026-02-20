#!/usr/bin/env pwsh
# Check OAuth Status and provide setup instructions

$userId = "04f1e29c-3a53-442a-b79d-e98e1f1dd314"

Write-Host "`n=== GOOGLE CALENDAR OAUTH STATUS ===" -ForegroundColor Cyan
Write-Host "User ID: $userId`n"

try {
    $oauthStatus = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/google/status/$userId"
    
    if ($oauthStatus.connected) {
        Write-Host "✅ Google Calendar is CONNECTED" -ForegroundColor Green
        Write-Host "   Email: $($oauthStatus.email)" -ForegroundColor White
        
        if ($oauthStatus.lastSync) {
            Write-Host "   Last Sync: $($oauthStatus.lastSync)" -ForegroundColor Gray
        }
        
        Write-Host "`n✅ You should be able to sync your calendar!" -ForegroundColor Green
        Write-Host "   Try clicking 'Sync Calendar' button again`n" -ForegroundColor White
    } else {
        Write-Host "❌ Google Calendar is NOT connected" -ForegroundColor Red
        Write-Host "`nTO FIX THIS:" -ForegroundColor Yellow
        Write-Host "1. Go to Settings page in the app" -ForegroundColor White
        Write-Host "2. Click 'Connect Google Calendar' button" -ForegroundColor White
        Write-Host "3. Complete the OAuth authorization flow" -ForegroundColor White
        Write-Host "4. Come back and click 'Sync Calendar'`n" -ForegroundColor White
        
        Write-Host "OR use this direct link:" -ForegroundColor Yellow
        Write-Host "http://localhost:3000/api/auth/google/initiate?userId=$userId`n" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Failed to check OAuth status: $_" -ForegroundColor Red
    Write-Host "`nMake sure the frontend server is running!`n" -ForegroundColor Yellow
}
