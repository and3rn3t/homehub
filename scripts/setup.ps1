#!/usr/bin/env pwsh
# HomeHub Development Setup Script (PowerShell)
# Run this to set up your development environment quickly

Write-Host "🚀 HomeHub Development Setup" -ForegroundColor Cyan
Write-Host "==============================`n" -ForegroundColor Cyan

# Check Node.js version
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found! Please install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check npm
$npmVersion = npm --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ npm: v$npmVersion" -ForegroundColor Green
} else {
    Write-Host "❌ npm not found!" -ForegroundColor Red
    exit 1
}

# 1. Copy environment file
Write-Host "`n📝 Setting up environment file..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env created from template" -ForegroundColor Green
    Write-Host "   💡 Edit .env if you need custom settings" -ForegroundColor Gray
} else {
    Write-Host "✅ .env already exists" -ForegroundColor Green
}

# 2. Install main dependencies
Write-Host "`n📦 Installing main project dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Main dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# 3. Install worker dependencies
Write-Host "`n📦 Installing worker dependencies..." -ForegroundColor Yellow
Set-Location workers
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Worker dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install worker dependencies" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..

# 4. Run validation
Write-Host "`n🔍 Running validation checks..." -ForegroundColor Yellow
npm run validate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ All validation checks passed!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some validation checks failed (this may be OK for initial setup)" -ForegroundColor Yellow
}

# 5. Check for Wrangler
Write-Host "`n🔧 Checking Cloudflare Wrangler..." -ForegroundColor Yellow
$wranglerVersion = npx wrangler --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Wrangler CLI available: $wranglerVersion" -ForegroundColor Green
} else {
    Write-Host "⚠️  Wrangler CLI not found (will use npx)" -ForegroundColor Yellow
}

# 6. Final summary
Write-Host "`n✨ Setup Complete!" -ForegroundColor Green
Write-Host "==================`n" -ForegroundColor Green

Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Configure Cloudflare (see docs/SETUP_CHECKLIST.md section 4)" -ForegroundColor White
Write-Host "   2. Install VS Code extensions (open project in VS Code)" -ForegroundColor White
Write-Host "   3. Start development servers:`n" -ForegroundColor White
Write-Host "      Terminal 1: npm run worker:dev" -ForegroundColor Gray
Write-Host "      Terminal 2: npm run dev`n" -ForegroundColor Gray

Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - Setup Guide: docs/SETUP_CHECKLIST.md" -ForegroundColor White
Write-Host "   - Configuration: docs/CONFIGURATION_QUICKREF.md" -ForegroundColor White
Write-Host "   - Extensions: EXTENSIONS_QUICKREF.md`n" -ForegroundColor White

Write-Host "🎯 Quick Start:" -ForegroundColor Cyan
Write-Host "   npm run dev          # Start frontend (port 5173)" -ForegroundColor White
Write-Host "   npm run worker:dev   # Start worker (port 8787)`n" -ForegroundColor White

Write-Host "Happy coding! 🚀" -ForegroundColor Magenta
