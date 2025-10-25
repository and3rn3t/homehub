#!/usr/bin/env pwsh
# Migration script to replace Spark imports with custom useKV

Write-Host "🚀 Starting Cloudflare KV Migration..." -ForegroundColor Cyan

# Update all component imports
Write-Host "`n📝 Updating imports in components..." -ForegroundColor Yellow

$files = Get-ChildItem -Path "src/components" -Filter "*.tsx" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Replace Spark useKV import with custom hook
    $updated = $content -replace "import { useKV } from '@github/spark/hooks'", "import { useKV } from '@/hooks/use-kv'"
    
    # Remove duplicate imports if any
    $updated = $updated -replace "import { useKV } from '@github/spark/hooks'\s*\n\s*import { useKV } from '@github/spark/hooks'", "import { useKV } from '@/hooks/use-kv'"
    
    if ($content -ne $updated) {
        Set-Content $file.FullName $updated -NoNewline
        Write-Host "  ✓ Updated: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`n✅ Import migration complete!" -ForegroundColor Green
Write-Host "`n📦 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run: npm uninstall @github/spark" -ForegroundColor White
Write-Host "  2. Run: npm install" -ForegroundColor White
Write-Host "  3. Setup Cloudflare Worker (see docs/CLOUDFLARE_DEPLOYMENT.md)" -ForegroundColor White
Write-Host "  4. Test: npm run dev" -ForegroundColor White
