# Phase 5 Setup Script - Camera System Dependencies
# Run this with: powershell -ExecutionPolicy Bypass -File .\scripts\setup-phase5-dependencies.ps1

Write-Host "Phase 5: Camera System Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
  Write-Host "WARNING: This script needs Administrator privileges" -ForegroundColor Yellow
  Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
  Write-Host ""
  Read-Host "Press Enter to exit"
  exit 1
}

Write-Host "Running as Administrator" -ForegroundColor Green
Write-Host ""

# Step 1: Install Chocolatey
Write-Host "Step 1: Installing Chocolatey Package Manager..." -ForegroundColor Cyan
try {
  $chocoInstalled = Get-Command choco -ErrorAction SilentlyContinue
  if ($chocoInstalled) {
    Write-Host "   Chocolatey already installed" -ForegroundColor Green
  }
  else {
    Write-Host "   Installing Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

    # Refresh environment
    $machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = $machinePath + ";" + $userPath

    Write-Host "   Chocolatey installed successfully" -ForegroundColor Green
  }
}
catch {
  Write-Host "   Failed to install Chocolatey: $_" -ForegroundColor Red
  Read-Host "Press Enter to exit"
  exit 1
}

Write-Host ""

# Step 2: Install FFmpeg
Write-Host "Step 2: Installing FFmpeg..." -ForegroundColor Cyan
try {
  $ffmpegInstalled = Get-Command ffmpeg -ErrorAction SilentlyContinue
  if ($ffmpegInstalled) {
    Write-Host "   FFmpeg already installed" -ForegroundColor Green
    & ffmpeg -version | Select-Object -First 1
  }
  else {
    Write-Host "   Installing FFmpeg (this may take 2-3 minutes)..." -ForegroundColor Yellow
    choco install ffmpeg -y

    # Refresh environment
    $machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = $machinePath + ";" + $userPath

    Write-Host "   FFmpeg installed successfully" -ForegroundColor Green
    & ffmpeg -version | Select-Object -First 1
  }
}
catch {
  Write-Host "   Failed to install FFmpeg: $_" -ForegroundColor Red
  Read-Host "Press Enter to exit"
  exit 1
}

Write-Host ""

# Step 3: Install npm packages
Write-Host "Step 3: Installing npm packages..." -ForegroundColor Cyan
Write-Host "   This will install:" -ForegroundColor Gray
Write-Host "   - eufy-security-client (Eufy camera control)" -ForegroundColor Gray
Write-Host "   - arlo-client (Arlo camera control)" -ForegroundColor Gray
Write-Host "   - fluent-ffmpeg (FFmpeg wrapper)" -ForegroundColor Gray
Write-Host "   - hls-server (HLS streaming server)" -ForegroundColor Gray
Write-Host "   - hls.js (Browser HLS player)" -ForegroundColor Gray
Write-Host "   - express (API server)" -ForegroundColor Gray
Write-Host "   - ws (WebSocket support)" -ForegroundColor Gray
Write-Host ""

try {
  npm install eufy-security-client arlo-client fluent-ffmpeg hls-server hls.js express ws
  Write-Host ""
  Write-Host "   npm packages installed successfully" -ForegroundColor Green
}
catch {
  Write-Host "   Failed to install npm packages: $_" -ForegroundColor Red
  Read-Host "Press Enter to exit"
  exit 1
}

Write-Host ""
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Close and reopen your terminal (to refresh PATH)" -ForegroundColor White
Write-Host "2. Run: node scripts/test-eufy-connect.js" -ForegroundColor White
Write-Host "3. Run: node scripts/test-arlo-connect.js" -ForegroundColor White
Write-Host ""
Write-Host "See docs/development/PHASE_5_DIY_QUICKSTART.md for details" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to exit"
