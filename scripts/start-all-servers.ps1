#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start all HomeHub development servers in separate terminal windows
.DESCRIPTION
    Launches three terminal windows running:
    1. Vite dev server (localhost:5173)
    2. KV Worker (localhost:8787)
    3. Arlo Proxy Worker (localhost:8788)
.EXAMPLE
    .\scripts\start-all-servers.ps1
    # Or from package.json:
    npm run dev:servers
#>

Write-Host "🚀 Starting all HomeHub servers..." -ForegroundColor Cyan
Write-Host ""

# Get the project root directory
$projectRoot = Split-Path -Parent $PSScriptRoot

# Start Vite dev server
Write-Host "▶️  Starting Vite dev server (localhost:5173)..." -ForegroundColor Green
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$projectRoot'; npm run dev"

# Wait a moment between launches
Start-Sleep -Milliseconds 500

# Start KV Worker
Write-Host "▶️  Starting KV Worker (localhost:8787)..." -ForegroundColor Blue
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$projectRoot'; npm run worker:dev"

# Wait a moment between launches
Start-Sleep -Milliseconds 500

# Start Arlo Proxy Worker
Write-Host "▶️  Starting Arlo Proxy Worker (localhost:8788)..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$projectRoot'; npm run proxy:dev"

Write-Host ""
Write-Host "✅ All servers started in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 URLs:" -ForegroundColor Cyan
Write-Host "   Frontend:    http://localhost:5173" -ForegroundColor White
Write-Host "   KV Worker:   http://localhost:8787" -ForegroundColor White
Write-Host "   Arlo Proxy:  http://localhost:8788" -ForegroundColor White
Write-Host ""
Write-Host "💡 To stop all servers, close each terminal window" -ForegroundColor Gray
