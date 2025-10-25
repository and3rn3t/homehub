#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Stop all HomeHub development servers
.DESCRIPTION
    Kills all Node.js and Wrangler processes running the dev servers
.EXAMPLE
    .\scripts\stop-all-servers.ps1
    # Or from package.json:
    npm run stop:servers
#>

Write-Host "🛑 Stopping all HomeHub servers..." -ForegroundColor Red
Write-Host ""

# Function to kill processes on specific ports
function Stop-ProcessOnPort {
  param([int]$Port)

  try {
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
      $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
      if ($process) {
        Write-Host "   Stopping process on port $Port (PID: $($process.Id))..." -ForegroundColor Yellow
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
      }
    }
  }
  catch {
    # Port not in use, skip
  }
}

# Stop processes on each server port
Write-Host "🔍 Checking for running servers..." -ForegroundColor Cyan

Stop-ProcessOnPort -Port 5173  # Vite
Stop-ProcessOnPort -Port 8787  # KV Worker
Stop-ProcessOnPort -Port 8788  # Arlo Proxy

# Also stop any wrangler dev processes
Write-Host ""
Write-Host "🔍 Stopping Wrangler processes..." -ForegroundColor Cyan
Get-Process -Name "wrangler*", "workerd*" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Stop any node processes running vite
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
  $_.CommandLine -like "*vite*"
} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ All servers stopped!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 You can restart with: npm run dev:servers" -ForegroundColor Gray
