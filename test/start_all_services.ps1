# Start All Services - Windows PowerShell Script
# This script starts the Python AI service, Next.js orchestrator, and frontend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Full Stack Services" -ForegroundColor Cyan
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

if (Test-Port 3001) {
    Write-Host "  Port 3001 (Orchestrator) already in use" -ForegroundColor Red
    $killOrch = Read-Host "Kill existing process? (y/n)"
    if ($killOrch -eq "y") {
        $process = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
        Stop-Process -Id $process -Force
        Write-Host "  Killed process on port 3001" -ForegroundColor Green
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
Write-Host "[1/3] Starting Python AI Service (port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\python-service'; Write-Host 'Python AI Service' -ForegroundColor Cyan; Write-Host 'Port: 8000' -ForegroundColor Green; Write-Host ''; python main.py"
Start-Sleep -Seconds 3

# 2. Start Next.js Orchestrator (Port 3001)
Write-Host "[2/3] Starting Next.js Orchestrator (port 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\nextjs-orchestrator'; Write-Host 'Next.js Orchestrator' -ForegroundColor Cyan; Write-Host 'Port: 3001' -ForegroundColor Green; Write-Host ''; npm run dev -- -p 3001"
Start-Sleep -Seconds 5

# 3. Start Frontend (Port 3000)
Write-Host "[3/3] Starting Frontend (port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend'; Write-Host 'Frontend Application' -ForegroundColor Cyan; Write-Host 'Port: 3000' -ForegroundColor Green; Write-Host ''; npm run dev"
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All Services Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Services Running:" -ForegroundColor Cyan
Write-Host "  Python AI Service:    http://localhost:8000" -ForegroundColor Yellow
Write-Host "  Next.js Orchestrator: http://localhost:3001" -ForegroundColor Yellow
Write-Host "  Frontend:             http://localhost:3000" -ForegroundColor Yellow
Write-Host ""

Write-Host "Health Checks:" -ForegroundColor Cyan
Write-Host "  Python:      http://localhost:8000/health" -ForegroundColor Gray
Write-Host "  Orchestrator: http://localhost:3001/api/schedule" -ForegroundColor Gray
Write-Host "  Frontend:     http://localhost:3000" -ForegroundColor Gray
Write-Host ""

Write-Host "Logs are in separate terminal windows." -ForegroundColor Gray
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Wait a bit and then test the services
Write-Host ""
Write-Host "Testing services..." -ForegroundColor Yellow

Start-Sleep -Seconds 3

try {
    $pythonHealth = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 5
    Write-Host "  Python service: OK" -ForegroundColor Green
} catch {
    Write-Host "  Python service: Not responding" -ForegroundColor Red
}

try {
    # Test orchestrator with a simple GET (it will return method not allowed, but that confirms it's running)
    $null = Invoke-WebRequest -Uri "http://localhost:3001/api/schedule" -Method Get -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
    Write-Host "  Orchestrator: OK" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 405) {
        Write-Host "  Orchestrator: OK (Method Not Allowed is expected)" -ForegroundColor Green
    } else {
        Write-Host "  Orchestrator: Not responding" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Open http://localhost:3000 in your browser" -ForegroundColor Green
Write-Host ""
Write-Host "To stop all services, close the terminal windows." -ForegroundColor Gray
Write-Host ""
