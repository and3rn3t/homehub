#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Generate PNG favicon files from the SVG source

.DESCRIPTION
    This script generates PNG versions of the favicon for better browser compatibility.
    Requires ImageMagick to be installed.

.EXAMPLE
    .\generate-favicon.ps1

.NOTES
    Install ImageMagick:
    Windows: choco install imagemagick
    Or download from: https://imagemagick.org/script/download.php
#>

$ErrorActionPreference = "Stop"

# Check if ImageMagick is installed
$magickCmd = Get-Command magick -ErrorAction SilentlyContinue

if (-not $magickCmd) {
  Write-Host "❌ ImageMagick not found!" -ForegroundColor Red
  Write-Host ""
  Write-Host "Please install ImageMagick:" -ForegroundColor Yellow
  Write-Host "  Windows: choco install imagemagick" -ForegroundColor Cyan
  Write-Host "  Or download from: https://imagemagick.org/script/download.php" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "Alternatively, use an online tool:" -ForegroundColor Yellow
  Write-Host "  https://realfavicongenerator.net/" -ForegroundColor Cyan
  exit 1
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$publicDir = Join-Path $projectRoot "public"
$svgFile = Join-Path $publicDir "favicon.svg"

# Check if SVG exists
if (-not (Test-Path $svgFile)) {
  Write-Host "❌ favicon.svg not found at: $svgFile" -ForegroundColor Red
  exit 1
}

Write-Host "🎨 Generating favicon PNG files..." -ForegroundColor Cyan
Write-Host ""

# Generate apple-touch-icon (180x180)
Write-Host "📱 Generating apple-touch-icon.png (180x180)..." -ForegroundColor Yellow
& magick -background none -density 300 $svgFile -resize 180x180 (Join-Path $publicDir "apple-touch-icon.png")

# Generate standard favicon sizes
Write-Host "🖼️  Generating favicon-32x32.png..." -ForegroundColor Yellow
& magick -background none -density 300 $svgFile -resize 32x32 (Join-Path $publicDir "favicon-32x32.png")

Write-Host "🖼️  Generating favicon-16x16.png..." -ForegroundColor Yellow
& magick -background none -density 300 $svgFile -resize 16x16 (Join-Path $publicDir "favicon-16x16.png")

Write-Host ""
Write-Host "✅ Favicon files generated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Generated files:" -ForegroundColor White
Write-Host "  - apple-touch-icon.png (180x180)" -ForegroundColor Gray
Write-Host "  - favicon-32x32.png" -ForegroundColor Gray
Write-Host "  - favicon-16x16.png" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 To add these to your HTML, update index.html:" -ForegroundColor Yellow
Write-Host '  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />' -ForegroundColor Gray
Write-Host '  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />' -ForegroundColor Gray
Write-Host '  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />' -ForegroundColor Gray
