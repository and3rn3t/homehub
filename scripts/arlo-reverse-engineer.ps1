# Arlo HTTP Interceptor Reverse Engineering - Master Script
#
# This script guides you through the entire reverse engineering process
# with step-by-step instructions and automated testing.
#
# Usage: pwsh scripts/arlo-reverse-engineer.ps1

param(
  [Parameter(HelpMessage = "Skip to specific phase (1-6)")]
  [int]$Phase = 0,

  [Parameter(HelpMessage = "Run in automated test mode")]
  [switch]$Test = $false
)

$ErrorActionPreference = "Stop"

function Write-Header {
  param([string]$Text)
  Write-Host ""
  Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
  Write-Host $Text -ForegroundColor Yellow
  Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
  Write-Host ""
}

function Write-Step {
  param([string]$Text)
  Write-Host "▶ $Text" -ForegroundColor Green
}

function Write-Info {
  param([string]$Text)
  Write-Host "  $Text" -ForegroundColor Gray
}

function Write-Success {
  param([string]$Text)
  Write-Host "✅ $Text" -ForegroundColor Green
}

function Write-Warning {
  param([string]$Text)
  Write-Host "⚠️  $Text" -ForegroundColor Yellow
}

function Write-Error {
  param([string]$Text)
  Write-Host "❌ $Text" -ForegroundColor Red
}

function Wait-UserConfirmation {
  param([string]$Message = "Press Enter to continue...")
  if (-not $Test) {
    Write-Host ""
    Write-Host $Message -ForegroundColor Cyan -NoNewline
    $null = Read-Host
  }
}

function Test-FileExists {
  param([string]$Path, [string]$Description)

  if (Test-Path $Path) {
    Write-Success "$Description exists: $Path"
    return $true
  }
  else {
    Write-Warning "$Description not found: $Path"
    return $false
  }
}

# Phase 1: Setup and Verification
function Start-Phase1 {
  Write-Header "Phase 1: Setup and Verification"

  Write-Step "Checking required files..."

  $files = @{
    "Guide"           = "scripts/arlo-intercept-network.md"
    "Test Script"     = "scripts/test-arlo-interceptor.js"
    "Parser"          = "scripts/parse-curl-to-json.js"
    "Bundle Analyzer" = "scripts/arlo-analyze-bundle.js"
  }

  $allExist = $true
  foreach ($file in $files.GetEnumerator()) {
    if (-not (Test-FileExists $file.Value $file.Key)) {
      $allExist = $false
    }
  }

  if (-not $allExist) {
    Write-Error "Missing required files. Please ensure all scripts are present."
    exit 1
  }

  Write-Success "All required files present!"

  Write-Step "Creating data directory..."
  $dataDir = "data"
  if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir | Out-Null
    Write-Success "Created: $dataDir"
  }
  else {
    Write-Info "Already exists: $dataDir"
  }

  Write-Success "Phase 1 Complete!"
}

# Phase 2: Capture Request from Browser
function Start-Phase2 {
  Write-Header "Phase 2: Capture Request from Browser"

  Write-Step "Instructions to capture Arlo API request:"
  Write-Host ""
  Write-Info "1. Open Chrome and navigate to: https://my.arlo.com/"
  Write-Info "2. Login with your credentials"
  Write-Info "3. Press F12 to open DevTools"
  Write-Info "4. Go to Network tab, enable 'Preserve log'"
  Write-Info "5. Click on a camera or navigate to Devices"
  Write-Info "6. Find a request to: myapi.arlo.com/hmsweb/users/devices"
  Write-Info "7. Right-click the request → Copy → Copy as cURL (bash)"
  Write-Info "8. Open: scripts/arlo-captured-request.txt"
  Write-Info "9. Paste the cURL command and save"

  Write-Host ""
  Wait-UserConfirmation "Complete the steps above, then press Enter..."

  Write-Step "Verifying captured request..."
  $curlFile = "scripts/arlo-captured-request.txt"

  if (Test-Path $curlFile) {
    $content = Get-Content $curlFile -Raw
    if ($content -match "curl.*myapi\.arlo\.com") {
      Write-Success "Valid cURL command detected!"
      Write-Info "Length: $($content.Length) bytes"
    }
    else {
      Write-Warning "File exists but doesn't look like an Arlo cURL command"
      Write-Info "Expected: curl 'https://myapi.arlo.com/...'"
      Write-Info "Found: $($content.Substring(0, [Math]::Min(100, $content.Length)))..."
    }
  }
  else {
    Write-Error "File not found: $curlFile"
    Write-Info "Please create this file and paste the cURL command"
    exit 1
  }

  Write-Success "Phase 2 Complete!"
}

# Phase 3: Parse and Analyze Request
function Start-Phase3 {
  Write-Header "Phase 3: Parse and Analyze Request"

  Write-Step "Parsing cURL command to JSON..."

  try {
    node scripts/parse-curl-to-json.js
    Write-Success "Parsing complete!"

    # Check if output files were created
    $outputFiles = @(
      "data/arlo-request-headers.json",
      "scripts/test-arlo-exact-request.js"
    )

    foreach ($file in $outputFiles) {
      if (Test-Path $file) {
        Write-Success "Generated: $file"
      }
      else {
        Write-Warning "Expected output not found: $file"
      }
    }
  }
  catch {
    Write-Error "Failed to parse cURL command: $_"
    exit 1
  }

  Write-Success "Phase 3 Complete!"
}

# Phase 4: Test Exact Request Replication
function Start-Phase4 {
  Write-Header "Phase 4: Test Exact Request Replication"

  Write-Step "Testing if captured request works from Node.js..."

  if (-not (Test-Path "scripts/test-arlo-exact-request.js")) {
    Write-Error "Generated test script not found. Please run Phase 3 first."
    exit 1
  }

  # Check Node.js version
  Write-Step "Checking Node.js version..."
  $nodeVersion = node --version
  Write-Info "Node.js version: $nodeVersion"

  $versionMatch = $nodeVersion -match 'v(\d+)\.'
  if ($versionMatch -and [int]$Matches[1] -lt 18) {
    Write-Warning "Node.js v18+ required for native fetch support"
    Write-Info "Current version: $nodeVersion"
    Write-Info "Please upgrade Node.js: https://nodejs.org/"
    exit 1
  }

  try {
    Write-Info "Running: node scripts/test-arlo-exact-request.js"
    Write-Host ""
    node scripts/test-arlo-exact-request.js

    Write-Host ""
    Write-Info "Check the output above:"
    Write-Info "  ✅ Status 200 = SUCCESS! Headers work from Node.js"
    Write-Info "  ❌ Status 401 = Token expired or invalid"
    Write-Info "  ❌ Status 403 = Additional verification needed"

  }
  catch {
    Write-Warning "Test failed: $_"
  }

  Write-Host ""
  Wait-UserConfirmation "Review the results above, then press Enter..."

  Write-Success "Phase 4 Complete!"
}

# Phase 5: Analyze JavaScript Bundles
function Start-Phase5 {
  Write-Header "Phase 5: Analyze JavaScript Bundles"

  Write-Step "Instructions to analyze Arlo JavaScript bundles:"
  Write-Host ""
  Write-Info "1. Open Chrome and navigate to: https://my.arlo.com/ (stay logged in)"
  Write-Info "2. Press F12 to open DevTools"
  Write-Info "3. Go to Console tab"
  Write-Info "4. Open file: scripts/arlo-analyze-bundle.js"
  Write-Info "5. Copy the ENTIRE script"
  Write-Info "6. Paste into Console and press Enter"
  Write-Info "7. Copy the JSON output (at bottom of console)"
  Write-Info "8. Save to: data/arlo-bundle-analysis.json"

  Write-Host ""
  Wait-UserConfirmation "Complete the steps above, then press Enter..."

  Write-Step "Verifying bundle analysis..."
  $analysisFile = "data/arlo-bundle-analysis.json"

  if (Test-Path $analysisFile) {
    try {
      $analysis = Get-Content $analysisFile | ConvertFrom-Json
      Write-Success "Valid JSON analysis detected!"
      Write-Info "Timestamp: $($analysis.timestamp)"
      Write-Info "Findings: $($analysis.findings.Count)"
      Write-Info "Scripts: $($analysis.scripts.Count)"
      Write-Info "localStorage items: $($analysis.localStorage.PSObject.Properties.Count)"
    }
    catch {
      Write-Warning "File exists but contains invalid JSON"
    }
  }
  else {
    Write-Warning "Analysis file not found: $analysisFile"
    Write-Info "You can continue to Phase 6 anyway"
  }

  Write-Success "Phase 5 Complete!"
}

# Phase 6: Run Comprehensive Analysis
function Start-Phase6 {
  Write-Header "Phase 6: Run Comprehensive Analysis"

  Write-Step "Running comprehensive interceptor analysis..."

  try {
    node scripts/test-arlo-interceptor.js
    Write-Success "Analysis complete!"
  }
  catch {
    Write-Warning "Analysis failed: $_"
  }

  Write-Host ""
  Write-Step "Next steps for token generation:"
  Write-Info "1. Review analysis output above"
  Write-Info "2. Go to Chrome DevTools → Sources tab"
  Write-Info "3. Press Ctrl+Shift+F to search all files"
  Write-Info "4. Search for: 'Authorization' or 'Bearer ' or 'interceptor'"
  Write-Info "5. Look for token generation functions"
  Write-Info "6. Set breakpoints and trace token creation"
  Write-Info "7. Extract secret key and signing algorithm"
  Write-Info "8. Implement in src/services/devices/ArloAdapter.ts"

  Write-Host ""
  Write-Success "Phase 6 Complete!"
  Write-Success "All automated phases finished!"
  Write-Host ""
  Write-Info "See scripts/arlo-intercept-network.md for detailed manual steps"
}

# Main execution
function Start-ReverseEngineering {
  Write-Host ""
  Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
  Write-Host "║   Arlo HTTP Interceptor Reverse Engineering - Master     ║" -ForegroundColor Yellow
  Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
  Write-Host ""

  if ($Phase -eq 0) {
    Write-Info "This script will guide you through all 6 phases:"
    Write-Info "  Phase 1: Setup and Verification"
    Write-Info "  Phase 2: Capture Request from Browser"
    Write-Info "  Phase 3: Parse and Analyze Request"
    Write-Info "  Phase 4: Test Exact Request Replication"
    Write-Info "  Phase 5: Analyze JavaScript Bundles"
    Write-Info "  Phase 6: Run Comprehensive Analysis"
    Write-Host ""

    if (-not $Test) {
      $response = Read-Host "Start from Phase 1? (Y/n)"
      if ($response -eq "n" -or $response -eq "N") {
        $Phase = [int](Read-Host "Enter phase number (1-6)")
      }
      else {
        $Phase = 1
      }
    }
    else {
      $Phase = 1
    }
  }

  $phases = @{
    1 = ${function:Start-Phase1}
    2 = ${function:Start-Phase2}
    3 = ${function:Start-Phase3}
    4 = ${function:Start-Phase4}
    5 = ${function:Start-Phase5}
    6 = ${function:Start-Phase6}
  }

  for ($i = $Phase; $i -le 6; $i++) {
    & $phases[$i]

    if ($i -lt 6 -and -not $Test) {
      Write-Host ""
      $continue = Read-Host "Continue to Phase $($i + 1)? (Y/n)"
      if ($continue -eq "n" -or $continue -eq "N") {
        Write-Info "Stopping at Phase $i"
        Write-Info "To resume later, run: pwsh scripts/arlo-reverse-engineer.ps1 -Phase $($i + 1)"
        break
      }
    }
  }

  Write-Host ""
  Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
  Write-Success "Process Complete!"
  Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
  Write-Host ""
  Write-Info "Documentation: scripts/arlo-intercept-network.md"
  Write-Info "Test Scripts: scripts/test-arlo-*.js"
  Write-Info "Data Output: data/arlo-*.json"
  Write-Host ""
}

# Run the script
Start-ReverseEngineering
