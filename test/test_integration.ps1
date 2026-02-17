# Integration Test Script
# Tests the connection between Frontend → Orchestrator → Python Service

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Integration Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = "C:\Users\lilan\Desktop\ScaleDown_Proj"
$allPassed = $true

# Test 1: Python AI Service Health
Write-Host "[1/4] Testing Python AI Service (port 8000)..." -ForegroundColor Yellow
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

# Test 2: Next.js Orchestrator
Write-Host "[2/4] Testing Next.js Orchestrator (port 3001)..." -ForegroundColor Yellow
try {
    # A GET will return 405, but that confirms the endpoint exists
    $null = Invoke-WebRequest -Uri "http://localhost:3001/api/schedule" -Method Get -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "  FAIL Unexpected success on GET" -ForegroundColor Red
    $allPassed = $false
} catch {
    if ($_.Exception.Response.StatusCode -eq 405) {
        Write-Host "  PASS Orchestrator is running (405 Method Not Allowed is expected)" -ForegroundColor Green
    } elseif ($_.Exception.Message -like "*Unable to connect*") {
        Write-Host "  FAIL Orchestrator not responding" -ForegroundColor Red
        Write-Host "  Make sure to run: cd nextjs-orchestrator && npm run dev -- -p 3001" -ForegroundColor Yellow
        $allPassed = $false
    } else {
        Write-Host "  FAIL Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
        $allPassed = $false
    }
}

Write-Host ""

# Test 3: Full Pipeline (Orchestrator → Python)
Write-Host "[3/4] Testing Full Pipeline (Orchestrator → Python)..." -ForegroundColor Yellow
try {
    $requestBody = Get-Content "$projectRoot\test_integration_request.json" -Raw
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/schedule" `
        -Method Post `
        -ContentType "application/json" `
        -Body $requestBody `
        -TimeoutSec 30
    
    if ($response.meeting_id -and $response.candidates) {
        Write-Host "  PASS Full pipeline working" -ForegroundColor Green
        Write-Host "  Meeting ID: $($response.meeting_id)" -ForegroundColor Gray
        Write-Host "  Candidates: $($response.candidates.Count)" -ForegroundColor Gray
        if ($response.candidates.Count -gt 0) {
            $topCandidate = $response.candidates[0]
            Write-Host "  Top Score: $($topCandidate.score)/100" -ForegroundColor Gray
            Write-Host "  Time: $($topCandidate.slot.start)" -ForegroundColor Gray
        }
    } else {
        Write-Host "  FAIL Invalid response format" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "  FAIL Pipeline test failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""

# Test 4: Frontend Connectivity
Write-Host "[4/4] Testing Frontend (port 3000)..." -ForegroundColor Yellow
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
Write-Host "========================================" -ForegroundColor Cyan

if ($allPassed) {
    Write-Host "  ALL TESTS PASSED" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Your full stack is working correctly!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Open http://localhost:3000 in your browser" -ForegroundColor White
    Write-Host "  2. Navigate to 'Quick Schedule'" -ForegroundColor White
    Write-Host "  3. Fill in meeting details" -ForegroundColor White
    Write-Host "  4. Click 'Find Times' to see AI recommendations" -ForegroundColor White
} else {
    Write-Host "  SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Fix the failing services and run this script again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Quick troubleshooting:" -ForegroundColor Yellow
    Write-Host "  - Make sure all three services are running" -ForegroundColor White
    Write-Host "  - Check that ports 3000, 3001, 8000 are not in use by other apps" -ForegroundColor White
    Write-Host "  - Run: .\start_all_services.ps1" -ForegroundColor White
}

Write-Host ""
