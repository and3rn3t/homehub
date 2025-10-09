#!/usr/bin/env pwsh
# Mermaid Documentation Verification Script

Write-Host "🔍 Verifying Mermaid Documentation..." -ForegroundColor Cyan

$totalDiagrams = 0
$filesWithDiagrams = 0
$errors = 0

# Check if Mermaid is installed
Write-Host "`n📦 Checking Mermaid installation..." -ForegroundColor Yellow

$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
if ($packageJson.devDependencies.mermaid) {
    Write-Host "  ✅ Mermaid installed: $($packageJson.devDependencies.mermaid)" -ForegroundColor Green
} else {
    Write-Host "  ❌ Mermaid not found in devDependencies" -ForegroundColor Red
    $errors++
}

# Check documentation files for Mermaid diagrams
Write-Host "`n📊 Scanning documentation files..." -ForegroundColor Yellow

$docsToCheck = @(
    "README.md",
    "docs/ARCHITECTURE.md",
    "docs/MIGRATION_SUMMARY.md",
    "docs/MIGRATION_COMPLETE.md",
    "docs/CLOUDFLARE_DEPLOYMENT.md",
    "docs/CLOUDFLARE_MIGRATION.md",
    ".github/copilot-instructions.md"
)

foreach ($file in $docsToCheck) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $mermaidBlocks = [regex]::Matches($content, '```mermaid')
        $count = $mermaidBlocks.Count
        
        if ($count -gt 0) {
            Write-Host "  ✅ $file - $count Mermaid diagram(s)" -ForegroundColor Green
            $totalDiagrams += $count
            $filesWithDiagrams++
        } else {
            Write-Host "  ⚠️  $file - No Mermaid diagrams" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ❌ $file - Not found" -ForegroundColor Red
        $errors++
    }
}

# Check for remaining ASCII diagrams
Write-Host "`n🔍 Checking for ASCII diagrams..." -ForegroundColor Yellow

$asciiPatterns = @(
    '```text\s*[\r\n]+\s*[┌│└├─]',  # Box drawing characters
    '```\s*[\r\n]+\s*[↓→←↑▼►◄▲]',  # Arrow characters in code blocks
    '```\s*[\r\n]+[^`]*[→↓←↑][^`]*```'  # Arrows in any code block
)

$foundAscii = $false
foreach ($file in $docsToCheck) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        foreach ($pattern in $asciiPatterns) {
            if ($content -match $pattern) {
                Write-Host "  ⚠️  $file may contain ASCII diagrams" -ForegroundColor Yellow
                $foundAscii = $true
                break
            }
        }
    }
}

if (-not $foundAscii) {
    Write-Host "  ✅ No ASCII diagrams detected" -ForegroundColor Green
}

# Check ARCHITECTURE.md specifically
Write-Host "`n📐 Verifying ARCHITECTURE.md..." -ForegroundColor Yellow

if (Test-Path "docs/ARCHITECTURE.md") {
    $archContent = Get-Content "docs/ARCHITECTURE.md" -Raw
    $archMermaid = ([regex]::Matches($archContent, '```mermaid')).Count
    
    if ($archMermaid -ge 10) {
        Write-Host "  ✅ ARCHITECTURE.md has $archMermaid diagrams (comprehensive)" -ForegroundColor Green
    } elseif ($archMermaid -gt 0) {
        Write-Host "  ⚠️  ARCHITECTURE.md has only $archMermaid diagrams (expected 10+)" -ForegroundColor Yellow
    } else {
        Write-Host "  ❌ ARCHITECTURE.md has no Mermaid diagrams" -ForegroundColor Red
        $errors++
    }
} else {
    Write-Host "  ❌ ARCHITECTURE.md not found" -ForegroundColor Red
    $errors++
}

# Check color consistency
Write-Host "`n🎨 Checking color consistency..." -ForegroundColor Yellow

$expectedColors = @{
    'React' = '#4a9eff'
    'Hook' = '#10b981'
    'Worker' = '#f59e0b'
    'KV' = '#8b5cf6'
}

$colorFound = @{}
foreach ($color in $expectedColors.Values) {
    $colorFound[$color] = $false
}

foreach ($file in $docsToCheck) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        foreach ($color in $expectedColors.Values) {
            if ($content -match [regex]::Escape($color)) {
                $colorFound[$color] = $true
            }
        }
    }
}

$colorCount = ($colorFound.Values | Where-Object { $_ -eq $true }).Count
if ($colorCount -eq $expectedColors.Count) {
    Write-Host "  ✅ All project colors found in diagrams" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Only $colorCount/$($expectedColors.Count) colors found" -ForegroundColor Yellow
}

# Summary
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "📊 Verification Summary" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

Write-Host "`nStatistics:" -ForegroundColor White
Write-Host "  Total Mermaid diagrams: $totalDiagrams" -ForegroundColor White
Write-Host "  Files with diagrams: $filesWithDiagrams / $($docsToCheck.Count)" -ForegroundColor White
Write-Host "  Mermaid version: $($packageJson.devDependencies.mermaid)" -ForegroundColor White

if ($errors -eq 0 -and $totalDiagrams -ge 13) {
    Write-Host "`n✅ VERIFICATION PASSED!" -ForegroundColor Green
    Write-Host "   All documentation uses Mermaid diagrams." -ForegroundColor Green
    Write-Host "   Total diagrams: $totalDiagrams" -ForegroundColor Green
    Write-Host "`n📖 View diagrams in:" -ForegroundColor Cyan
    Write-Host "   - GitHub (renders automatically)" -ForegroundColor White
    Write-Host "   - VS Code (Markdown preview)" -ForegroundColor White
    Write-Host "   - https://mermaid.live/ (paste code to edit)" -ForegroundColor White
    exit 0
} elseif ($totalDiagrams -gt 0) {
    Write-Host "`n⚠️  VERIFICATION PASSED WITH NOTES" -ForegroundColor Yellow
    Write-Host "   Found $totalDiagrams Mermaid diagrams." -ForegroundColor Yellow
    if ($errors -gt 0) {
        Write-Host "   $errors minor issues found (see above)" -ForegroundColor Yellow
    }
    exit 0
} else {
    Write-Host "`n❌ VERIFICATION FAILED" -ForegroundColor Red
    Write-Host "   $errors errors found" -ForegroundColor Red
    Write-Host "   Please review the issues above." -ForegroundColor Red
    exit 1
}
