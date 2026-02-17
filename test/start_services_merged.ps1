# Start Services (After Merge) - Windows PowerShell Script
# This script starts the Python AI service and the merged Next.js frontend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Services (Merged)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = "C:\Users\lilan\Desktop\ScaleDown_Proj"

# Function to check if port is in use
function Test-Port {
    param($Port)
    $test = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
    return $test.TcpTestSucceeded
}

# Check if ports are already in use
Write-Host "Checking ports..." -ForegroundColor Yellow

if (Test-Port 8000) {
    Write-Host "  Port 8000 (Python) already in use" -ForegroundColor Red
    $killPython = Read-Host "Kill existing process? (y/n)"
    if ($killPython -eq "y") {
        $process = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
        Stop-Process -Id $process -Force
        Write-Host "  Killed process on port 8000" -ForegroundColor Green
        Start-Sleep -Seconds 2
    }
}

if (Test-Port 3000) {
    Write-Host "  Port 3000 (Frontend) already in use" -ForegroundColor Red
    $killFront = Read-Host "Kill existing process? (y/n)"
    if ($killFront -eq "y") {
        $process = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
        Stop-Process -Id $process -Force
        Write-Host "  Killed process on port 3000" -ForegroundColor Green
        Start-Sleep -Seconds 2
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Services..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Start Python AI Service (Port 8000)
Write-Host "[1/2] Starting Python AI Service (port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\python-service'; Write-Host 'Python AI Service' -ForegroundColor Cyan; Write-Host 'Port: 8000' -ForegroundColor Green; Write-Host ''; python main.py"
Start-Sleep -Seconds 3

# 2. Start Frontend with API routes (Port 3000)
Write-Host "[2/2] Starting Frontend with API (port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend'; Write-Host 'Frontend + API Routes' -ForegroundColor Cyan; Write-Host 'Port: 3000' -ForegroundColor Green; Write-Host ''; npm run dev"
Start-Sleep -Seconds 8

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All Services Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Services Running:" -ForegroundColor Cyan
Write-Host "  Python AI Service: http://localhost:8000" -ForegroundColor Yellow
Write-Host "  Frontend + API:    http://localhost:3000" -ForegroundColor Yellow
Write-Host ""

Write-Host "API Routes:" -ForegroundColor Cyan
Write-Host "  Schedule:      http://localhost:3000/api/schedule" -ForegroundColor Gray
Write-Host "  Calendar Sync: http://localhost:3000/api/calendar/sync" -ForegroundColor Gray
Write-Host "  Health Check:  http://localhost:8000/health" -ForegroundColor Gray
Write-Host ""

Write-Host "Logs are in separate terminal windows." -ForegroundColor Gray
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Wait and test services
Write-Host ""
Write-Host "Testing services..." -ForegroundColor Yellow

Start-Sleep -Seconds 3

try {
    $pythonHealth = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 5
    Write-Host "  Python service: OK" -ForegroundColor Green
} catch {
    Write-Host "  Python service: Not responding yet..." -ForegroundColor Yellow
}

try {
    $frontendTest = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
    Write-Host "  Frontend: OK" -ForegroundColor Green
} catch {
    Write-Host "  Frontend: Starting up..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Open http://localhost:3000 in your browser" -ForegroundColor Green
Write-Host ""
Write-Host "Architecture (Simplified):" -ForegroundColor Cyan
Write-Host "  Browser → Frontend (3000) → Python AI (8000)" -ForegroundColor Gray
Write-Host "            ↑ UI + API routes" -ForegroundColor Gray
Write-Host ""
Write-Host "To stop services, close the terminal windows." -ForegroundColor Gray
Write-Host ""
