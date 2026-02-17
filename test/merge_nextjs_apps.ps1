# Merge Next.js Applications
# This script merges nextjs-orchestrator into frontend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Merging Next.js Applications" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = "C:\Users\lilan\Desktop\ScaleDown_Proj"
$frontend = "$projectRoot\frontend"
$orchestrator = "$projectRoot\nextjs-orchestrator"

# Backup frontend first
Write-Host "[1/7] Creating backup of frontend..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = "$projectRoot\frontend_backup_$timestamp"
Copy-Item -Path $frontend -Destination $backupPath -Recurse
Write-Host "  Backup created at: $backupPath" -ForegroundColor Green

# Copy API routes
Write-Host "[2/7] Copying API routes..." -ForegroundColor Yellow
$apiSource = "$orchestrator\src\app\api"
$apiDest = "$frontend\app\api"

if (Test-Path $apiSource) {
    # Create api directory if it doesn't exist
    if (-not (Test-Path $apiDest)) {
        New-Item -ItemType Directory -Path $apiDest -Force | Out-Null
    }
    
    # Copy all API routes
    Copy-Item -Path "$apiSource\*" -Destination $apiDest -Recurse -Force
    Write-Host "  Copied API routes to frontend/app/api/" -ForegroundColor Green
} else {
    Write-Host "  No API routes found in orchestrator" -ForegroundColor Yellow
}

# Copy lib services
Write-Host "[3/7] Copying lib services..." -ForegroundColor Yellow
$libSource = "$orchestrator\src\lib"
$libDest = "$frontend\lib"

if (Test-Path $libSource) {
    # Get all files from orchestrator lib
    $libFiles = Get-ChildItem -Path $libSource -File
    
    foreach ($file in $libFiles) {
        $destFile = Join-Path $libDest $file.Name
        
        # Check if file already exists in frontend
        if (Test-Path $destFile) {
            Write-Host "  Skipping $($file.Name) (already exists in frontend)" -ForegroundColor Gray
        } else {
            Copy-Item -Path $file.FullName -Destination $destFile -Force
            Write-Host "  Copied $($file.Name)" -ForegroundColor Green
        }
    }
}

# Copy types if they exist
Write-Host "[4/7] Copying types..." -ForegroundColor Yellow
$typesSource = "$orchestrator\src\types"
$typesDest = "$frontend\types"

if (Test-Path $typesSource) {
    if (-not (Test-Path $typesDest)) {
        New-Item -ItemType Directory -Path $typesDest -Force | Out-Null
    }
    
    Copy-Item -Path "$typesSource\*" -Destination $typesDest -Recurse -Force
    Write-Host "  Copied types to frontend/types/" -ForegroundColor Green
} else {
    Write-Host "  No types directory found" -ForegroundColor Gray
}

# Merge environment variables
Write-Host "[5/7] Merging environment variables..." -ForegroundColor Yellow

$frontendEnv = "$frontend\.env.local"
$orchestratorEnv = "$orchestrator\.env.local"

if (Test-Path $orchestratorEnv) {
    $orchEnvContent = Get-Content $orchestratorEnv -Raw
    
    # Append orchestrator env to frontend env
    Add-Content -Path $frontendEnv -Value "`n# Merged from nextjs-orchestrator"
    Add-Content -Path $frontendEnv -Value $orchEnvContent
    
    Write-Host "  Merged environment variables" -ForegroundColor Green
}

# Install orchestrator dependencies in frontend
Write-Host "[6/7] Merging dependencies..." -ForegroundColor Yellow

$orchestratorPkg = "$orchestrator\package.json"
$frontendPkg = "$frontend\package.json"

if (Test-Path $orchestratorPkg) {
    $orchPkg = Get-Content $orchestratorPkg | ConvertFrom-Json
    $frontPkg = Get-Content $frontendPkg | ConvertFrom-Json
    
    Write-Host "  Need to install these from orchestrator:" -ForegroundColor Gray
    
    # List dependencies that need to be added
    $toInstall = @()
    foreach ($dep in $orchPkg.dependencies.PSObject.Properties) {
        if (-not $frontPkg.dependencies.PSObject.Properties.Name.Contains($dep.Name)) {
            Write-Host "    - $($dep.Name)@$($dep.Value)" -ForegroundColor Gray
            $toInstall += "$($dep.Name)@$($dep.Value)"
        }
    }
    
    if ($toInstall.Count -gt 0) {
        Write-Host "  Installing missing dependencies..." -ForegroundColor Yellow
        Push-Location $frontend
        npm install $toInstall
        Pop-Location
        Write-Host "  Dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "  All dependencies already present" -ForegroundColor Green
    }
}

# Update API client to use relative URLs
Write-Host "[7/7] Updating API client configuration..." -ForegroundColor Yellow

$apiClientPath = "$frontend\lib\api.ts"

if (Test-Path $apiClientPath) {
    $apiContent = Get-Content $apiClientPath -Raw
    
    # Change from http://localhost:3001 to empty string (relative URLs)
    $apiContent = $apiContent -replace "process\.env\.NEXT_PUBLIC_API_BASE_URL \|\| 'http://localhost:3001'", "''"
    
    Set-Content -Path $apiClientPath -Value $apiContent
    Write-Host "  Updated API client to use relative URLs" -ForegroundColor Green
}

# Update frontend .env.local
$envContent = Get-Content $frontendEnv -Raw
$envContent = $envContent -replace "NEXT_PUBLIC_API_BASE_URL=http://localhost:3001", "# NEXT_PUBLIC_API_BASE_URL= (not needed, using relative URLs)"

Set-Content -Path $frontendEnv -Value $envContent

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  MERGE COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Frontend now contains:" -ForegroundColor White
Write-Host "    • UI pages (app/*.tsx)" -ForegroundColor Gray
Write-Host "    • API routes (app/api/*)" -ForegroundColor Gray
Write-Host "    • Services (lib/*)" -ForegroundColor Gray
Write-Host "    • Types (types/*)" -ForegroundColor Gray
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test the merged application:" -ForegroundColor White
Write-Host "     cd frontend" -ForegroundColor Cyan
Write-Host "     npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. The application will run on http://localhost:3000" -ForegroundColor White
Write-Host "     (API routes will be at http://localhost:3000/api/*)" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. If everything works, you can delete the orchestrator:" -ForegroundColor White
Write-Host "     Remove-Item -Recurse -Force nextjs-orchestrator" -ForegroundColor Cyan
Write-Host ""

Write-Host "Backup location:" -ForegroundColor Yellow
Write-Host "  $backupPath" -ForegroundColor Gray
Write-Host ""

Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
