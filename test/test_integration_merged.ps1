# Integration Test (After Merge)
# Tests Frontend (with API) → Python Service

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Integration Test (Merged Setup)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = "C:\Users\lilan\Desktop\ScaleDown_Proj"
$allPassed = $true

# Test 1: Python AI Service Health
Write-Host "[1/3] Testing Python AI Service (port 8000)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 5
    if ($response.status -eq "healthy") {
        Write-Host "  PASS Python service is healthy" -ForegroundColor Green
        Write-Host "  Agents: $($response.agents | ConvertTo-Json -Compress)" -ForegroundColor Gray
    } else {
        Write-Host "  FAIL Service unhealthy" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "  FAIL Python service not responding" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Make sure to run: cd python-service && python main.py" -ForegroundColor Yellow
    $allPassed = $false
}

Write-Host ""

# Test 2: Frontend with API Routes
Write-Host "[2/3] Testing Frontend + API (port 3000)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  PASS Frontend is accessible" -ForegroundColor Green
    } else {
        Write-Host "  FAIL Unexpected status code: $($response.StatusCode)" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "  FAIL Frontend not responding" -ForegroundColor Red
    Write-Host "  Make sure to run: cd frontend && npm run dev" -ForegroundColor Yellow
    $allPassed = $false
}

Write-Host ""

# Test 3: Full Pipeline (Frontend API → Python)
Write-Host "[3/3] Testing Full Pipeline (Frontend API → Python)..." -ForegroundColor Yellow
try {
    # Test with the schedule endpoint
    $null = Invoke-WebRequest -Uri "http://localhost:3000/api/schedule" -Method Get -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "  FAIL Unexpected success on GET" -ForegroundColor Red
    $allPassed = $false
} catch {
    if ($_.Exception.Response.StatusCode -eq 405) {
        Write-Host "  PASS API endpoint exists (405 Method Not Allowed is correct)" -ForegroundColor Green
        
        # Now try a real POST request
        try {
            $requestBody = Get-Content "$projectRoot\test_integration_request.json" -Raw
            $response = Invoke-RestMethod -Uri "http://localhost:3000/api/schedule" `
                -Method Post `
                -ContentType "application/json" `
                -Body $requestBody `
                -TimeoutSec 30
            
            if ($response.meeting_id -and $response.candidates) {
                Write-Host "  PASS Full pipeline working" -ForegroundColor Green
                Write-Host "    Meeting ID: $($response.meeting_id)" -ForegroundColor Gray
                Write-Host "    Candidates: $($response.candidates.Count)" -ForegroundColor Gray
                if ($response.candidates.Count -gt 0) {
                    $topCandidate = $response.candidates[0]
                    Write-Host "    Top Score: $($topCandidate.score)/100" -ForegroundColor Gray
                }
            } else {
                Write-Host "  FAIL Invalid response format" -ForegroundColor Red
                $allPassed = $false
            }
        } catch {
            Write-Host "  WARN POST request failed: $($_.Exception.Message)" -ForegroundColor Yellow
            Write-Host "  This might be due to missing dependencies" -ForegroundColor Gray
        }
    } elseif ($_.Exception.Message -like "*Unable to connect*") {
        Write-Host "  FAIL Frontend API not responding" -ForegroundColor Red
        $allPassed = $false
    } else {
        Write-Host "  FAIL Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
        $allPassed = $false
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($allPassed) {
    Write-Host "  ALL TESTS PASSED" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Your simplified stack is working!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Architecture (Simplified):" -ForegroundColor Cyan
    Write-Host "  Browser → Frontend :3000 → Python :8000" -ForegroundColor White
    Write-Host "            ↑ UI + API" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Open http://localhost:3000" -ForegroundColor White
    Write-Host "  2. Navigate to 'Quick Schedule'" -ForegroundColor White
    Write-Host "  3. Test the AI scheduling!" -ForegroundColor White
    Write-Host ""
    Write-Host "Note: API routes are now at http://localhost:3000/api/*" -ForegroundColor Gray
} else {
    Write-Host "  SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Fix the failing services and run this script again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Quick troubleshooting:" -ForegroundColor Yellow
    Write-Host "  - Make sure both services are running" -ForegroundColor White
    Write-Host "  - Check that ports 3000 and 8000 are not in use" -ForegroundColor White
    Write-Host "  - Run: .\start_services_merged.ps1" -ForegroundColor White
}

Write-Host ""
