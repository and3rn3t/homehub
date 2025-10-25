#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Complete reset of dev environment - clears all caches and restarts fresh
.DESCRIPTION
    This script:
    1. Stops all running servers
    2. Clears Vite cache
    3. Clears browser cache (instructions)
    4. Restarts all servers
.EXAMPLE
    .\scripts\reset-dev-environment.ps1
#>

Write-Host "🔄 Resetting HomeHub development environment..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop all servers
Write-Host "1️⃣  Stopping all running servers..." -ForegroundColor Yellow
& "$PSScriptRoot\stop-all-servers.ps1"

Start-Sleep -Seconds 2

# Step 2: Clear Vite cache
Write-Host ""
Write-Host "2️⃣  Clearing Vite cache..." -ForegroundColor Yellow
$projectRoot = Split-Path -Parent $PSScriptRoot

if (Test-Path "$projectRoot/node_modules/.vite") {
  Remove-Item -Path "$projectRoot/node_modules/.vite" -Recurse -Force
  Write-Host "   ✅ Vite cache cleared" -ForegroundColor Green
}
else {
  Write-Host "   ℹ️  No Vite cache found" -ForegroundColor Gray
}

if (Test-Path "$projectRoot/dist") {
  Remove-Item -Path "$projectRoot/dist" -Recurse -Force
  Write-Host "   ✅ Build output cleared" -ForegroundColor Green
}

# Step 3: Browser cache instructions
Write-Host ""
Write-Host "3️⃣  Clear your browser cache:" -ForegroundColor Yellow
Write-Host "   📌 Chrome/Edge: Press Ctrl + Shift + Delete" -ForegroundColor White
Write-Host "      → Select 'Cached images and files'" -ForegroundColor Gray
Write-Host "      → Click 'Clear data'" -ForegroundColor Gray
Write-Host ""
Write-Host "   OR do a hard refresh:" -ForegroundColor White
Write-Host "      → Press Ctrl + Shift + R (or Ctrl + F5)" -ForegroundColor Gray
Write-Host ""

# Step 4: Restart servers
Write-Host "4️⃣  Starting all servers in 5 seconds..." -ForegroundColor Yellow
Write-Host "   (Press Ctrl+C to cancel)" -ForegroundColor Gray
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "🚀 Launching servers..." -ForegroundColor Cyan
& "$PSScriptRoot\start-all-servers.ps1"

Write-Host ""
Write-Host "✅ Environment reset complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Wait for servers to start (check terminal windows)" -ForegroundColor White
Write-Host "   2. Open browser to http://localhost:5173" -ForegroundColor White
Write-Host "   3. Do a hard refresh: Ctrl + Shift + R" -ForegroundColor White
Write-Host "   4. CSS should now load correctly!" -ForegroundColor White
