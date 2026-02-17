# Check Database for OAuth Tokens

Write-Host "=== Checking Database ===" -ForegroundColor Cyan
Write-Host ""

$userId = "1799d245-456f-4b64-ba14-f31e2e5f6b2d"

Write-Host "Checking for OAuth tokens in database..." -ForegroundColor Yellow
Write-Host "User ID: $userId" -ForegroundColor Gray
Write-Host ""

# This would need Supabase direct access
Write-Host "To check manually:" -ForegroundColor Yellow
Write-Host "1. Go to your Supabase dashboard" -ForegroundColor Gray
Write-Host "2. Open 'oauth_tokens' table" -ForegroundColor Gray
Write-Host "3. Look for user_id: $userId" -ForegroundColor Gray
Write-Host ""

Write-Host "=== What Happened During OAuth? ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "After clicking 'Allow' on Google, what page did you see?" -ForegroundColor Yellow
Write-Host "A) Redirected to http://localhost:3000 (homepage)" -ForegroundColor Gray
Write-Host "B) Saw an error message" -ForegroundColor Gray
Write-Host "C) Got a 'Cannot connect' error" -ForegroundColor Gray
Write-Host "D) Something else" -ForegroundColor Gray
Write-Host ""

Write-Host "Also check the URL bar - were there any ?error= or ?code= parameters?" -ForegroundColor Yellow
Write-Host ""
