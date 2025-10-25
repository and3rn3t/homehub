#!/usr/bin/env pwsh
# Migration verification script - checks that all Spark references are removed

Write-Host "🔍 Verifying Cloudflare Migration..." -ForegroundColor Cyan

$errors = 0
$warnings = 0

# Check 1: No Spark imports in components
Write-Host "`n📝 Checking for remaining Spark imports..." -ForegroundColor Yellow

$sparkImports = Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse | 
    Select-String -Pattern "@github/spark" -CaseSensitive

if ($sparkImports) {
    Write-Host "  ❌ Found Spark imports in:" -ForegroundColor Red
    foreach ($match in $sparkImports) {
        Write-Host "     $($match.Path):$($match.LineNumber)" -ForegroundColor Red
    }
    $errors++
} else {
    Write-Host "  ✅ No Spark imports found" -ForegroundColor Green
}

# Check 2: Spark dependency removed from package.json
Write-Host "`n📦 Checking package.json..." -ForegroundColor Yellow

$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
if ($packageJson.dependencies.'@github/spark') {
    Write-Host "  ❌ @github/spark still in dependencies" -ForegroundColor Red
    $errors++
} else {
    Write-Host "  ✅ @github/spark removed from dependencies" -ForegroundColor Green
}

# Check 3: spark.meta.json deleted
Write-Host "`n📄 Checking for spark.meta.json..." -ForegroundColor Yellow

if (Test-Path "spark.meta.json") {
    Write-Host "  ❌ spark.meta.json still exists" -ForegroundColor Red
    $errors++
} else {
    Write-Host "  ✅ spark.meta.json removed" -ForegroundColor Green
}

# Check 4: Worker files exist
Write-Host "`n🔧 Checking Worker files..." -ForegroundColor Yellow

$workerFiles = @(
    "workers/src/index.ts",
    "workers/wrangler.toml",
    "workers/package.json"
)

foreach ($file in $workerFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file missing" -ForegroundColor Red
        $errors++
    }
}

# Check 5: Custom hook exists
Write-Host "`n🪝 Checking custom useKV hook..." -ForegroundColor Yellow

if (Test-Path "src/hooks/use-kv.ts") {
    Write-Host "  ✅ src/hooks/use-kv.ts exists" -ForegroundColor Green
} else {
    Write-Host "  ❌ src/hooks/use-kv.ts missing" -ForegroundColor Red
    $errors++
}

# Check 6: Environment config
Write-Host "`n🌐 Checking environment configuration..." -ForegroundColor Yellow

if (Test-Path ".env.example") {
    Write-Host "  ✅ .env.example exists" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  .env.example missing" -ForegroundColor Yellow
    $warnings++
}

if (Test-Path ".env") {
    Write-Host "  ✅ .env exists" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  .env missing (copy from .env.example)" -ForegroundColor Yellow
    $warnings++
}

# Check 7: Documentation
Write-Host "`n📚 Checking documentation..." -ForegroundColor Yellow

$docs = @(
    "README.md",
    "DEPLOYMENT_CHECKLIST.md",
    "docs/CLOUDFLARE_DEPLOYMENT.md",
    "docs/CLOUDFLARE_MIGRATION.md",
    "docs/MIGRATION_COMPLETE.md",
    "docs/MIGRATION_SUMMARY.md"
)

foreach ($doc in $docs) {
    if (Test-Path $doc) {
        Write-Host "  ✅ $doc exists" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  $doc missing" -ForegroundColor Yellow
        $warnings++
    }
}

# Check 8: Components using new hook
Write-Host "`n🎨 Checking component imports..." -ForegroundColor Yellow

$newImports = Get-ChildItem -Path "src/components" -Filter "*.tsx" -Recurse | 
    Select-String -Pattern "from '@/hooks" -CaseSensitive

$componentCount = (Get-ChildItem -Path "src/components" -Filter "*.tsx" -Exclude "*ui*" -Recurse).Count

if ($newImports) {
    $importCount = ($newImports | Measure-Object).Count
    Write-Host "  ✅ $importCount components using new useKV import" -ForegroundColor Green
    
    if ($importCount -lt 15) {
        Write-Host "  ⚠️  Expected ~20 components, found $importCount" -ForegroundColor Yellow
        $warnings++
    }
} else {
    Write-Host "  ❌ No components using new useKV import" -ForegroundColor Red
    $errors++
}

# Summary
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "📊 Migration Verification Summary" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

if ($errors -eq 0 -and $warnings -eq 0) {
    Write-Host "`n✅ MIGRATION VERIFIED!" -ForegroundColor Green
    Write-Host "   All checks passed. Ready for deployment." -ForegroundColor Green
    Write-Host "`n📖 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. cd workers && npm install" -ForegroundColor White
    Write-Host "   2. wrangler login" -ForegroundColor White
    Write-Host "   3. wrangler kv:namespace create `"HOMEHUB_KV`"" -ForegroundColor White
    Write-Host "   4. Update workers/wrangler.toml with namespace IDs" -ForegroundColor White
    Write-Host "   5. npm run worker:deploy" -ForegroundColor White
    Write-Host "   6. Update .env with Worker URL" -ForegroundColor White
    Write-Host "   7. npm run dev (test locally)" -ForegroundColor White
    Write-Host "   8. npm run deploy (deploy to Cloudflare Pages)" -ForegroundColor White
    exit 0
} elseif ($errors -eq 0) {
    Write-Host "`n⚠️  MIGRATION COMPLETE WITH WARNINGS" -ForegroundColor Yellow
    Write-Host "   $warnings warnings found (see above)" -ForegroundColor Yellow
    Write-Host "   Migration is functional but some optional files are missing." -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "`n❌ MIGRATION INCOMPLETE" -ForegroundColor Red
    Write-Host "   $errors errors, $warnings warnings" -ForegroundColor Red
    Write-Host "   Please fix the errors above before deploying." -ForegroundColor Red
    exit 1
}
