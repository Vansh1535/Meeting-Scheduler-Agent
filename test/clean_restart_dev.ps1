# Clean up multiple node processes and restart dev server fresh
# Run this if you have too many node processes or experiencing memory issues

Write-Host "🧹 Cleaning up node processes..." -ForegroundColor Cyan

# Get current location
$originalLocation = Get-Location

try {
    # Step 1: Count current node processes
    $nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
    $count = ($nodeProcesses | Measure-Object).Count
    Write-Host "📊 Found $count node processes running" -ForegroundColor Yellow

    if ($count -gt 10) {
        Write-Host "⚠️  WARNING: Too many node processes detected!" -ForegroundColor Red
        Write-Host "   This can cause performance issues and memory leaks" -ForegroundColor Red
        Write-Host ""
        
        $continue = Read-Host "Do you want to kill all node processes and restart? (y/n)"
        if ($continue -ne 'y') {
            Write-Host "❌ Cancelled" -ForegroundColor Red
            exit
        }
    }

    # Step 2: Stop all node processes
    Write-Host "🛑 Stopping all node processes..." -ForegroundColor Yellow
    Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2

    # Verify they're stopped
    $remaining = Get-Process -Name node -ErrorAction SilentlyContinue
    if ($remaining) {
        Write-Host "⚠️  Some processes still running, trying again..." -ForegroundColor Yellow
        $remaining | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }

    Write-Host "✅ All node processes stopped" -ForegroundColor Green
    Write-Host ""

    # Step 3: Navigate to frontend directory
    Write-Host "📁 Navigating to frontend directory..." -ForegroundColor Cyan
    Set-Location "C:\Users\lilan\Desktop\ScaleDown_Proj\frontend"

    # Step 4: Clean npm cache and node_modules (optional)
    Write-Host ""
    $cleanCache = Read-Host "Do you want to clean npm cache and reinstall dependencies? (y/n)"
    if ($cleanCache -eq 'y') {
        Write-Host "🧹 Cleaning npm cache..." -ForegroundColor Yellow
        npm cache clean --force
        
        Write-Host "🗑️  Removing node_modules..." -ForegroundColor Yellow
        if (Test-Path "node_modules") {
            Remove-Item -Path "node_modules" -Recurse -Force
        }
        
        Write-Host "📦 Reinstalling dependencies..." -ForegroundColor Yellow
        npm install
        Write-Host "✅ Dependencies reinstalled" -ForegroundColor Green
        Write-Host ""
    }

    # Step 5: Start fresh dev server
    Write-Host "🚀 Starting fresh Next.js dev server..." -ForegroundColor Green
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "   Dev server will start on http://localhost:3000" -ForegroundColor Cyan
    Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor DarkGray
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
    
    # Start dev server
    npm run dev

} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
} finally {
    # Return to original location
    Set-Location $originalLocation
}
