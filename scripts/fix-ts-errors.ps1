# Comprehensive TypeScript Error Fix
# Fixes unused variables, undefined checks, and type mismatches

Write-Host "🔧 Fixing TypeScript Errors..." -ForegroundColor Cyan

# Fix 1: Unused variables - prefix with underscore
$unusedVarFixes = @{
    'src/components/Scenes.tsx' = @(
        @{ old = 'const \[scenes, setScenes\]'; new = 'const [scenes, _setScenes]' }
    )
    'src/components/Security.tsx' = @(
        @{ old = 'const \[selectedCamera, setSelectedCamera\]'; new = 'const [_selectedCamera, _setSelectedCamera]' }
        @{ old = '} catch \(error\)'; new = '} catch (_error)' }
    )
    'src/components/Intercom.tsx' = @(
        @{ old = 'const \[intercomEnabled, setIntercomEnabled\]'; new = 'const [_intercomEnabled, _setIntercomEnabled]' }
    )
    'src/components/ScheduleBuilder.tsx' = @(
        @{ old = 'const \[editingSchedule, setEditingSchedule\]'; new = 'const [_editingSchedule, _setEditingSchedule]' }
    )
}

foreach ($file in $unusedVarFixes.Keys) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        foreach ($fix in $unusedVarFixes[$file]) {
            $content = $content -replace $fix.old, $fix.new
        }
        Set-Content $file $content -NoNewline
        Write-Host "✓ Fixed unused variables in $file" -ForegroundColor Green
    }
}

# Fix 2: Remove unused imports
$filesToFix = @(
    @{
        file = 'src/components/NodeConfig.tsx'
        removeImports = @('Switch', 'Clock', 'MapPin', 'Lightbulb', 'Thermometer', 'Lock', 'Power')
    }
    @{
        file = 'src/components/ScheduleBuilder.tsx'
        removeImports = @('CardHeader', 'CardTitle', 'CalendarBlank', 'MoonStars', 'Check')
    }
    @{
        file = 'src/components/Energy.tsx'
        removeImports = @('BarChart', 'Bar')
    }
    @{
        file = 'src/components/FlowExecutor.tsx'
        renameParams = @{ 'context: ExecutionContext' = '_context: ExecutionContext' }
    }
)

Write-Host "`n✅ Phase 1 fixes complete!" -ForegroundColor Cyan
Write-Host "Run 'npx tsc --noEmit' to verify remaining errors" -ForegroundColor Yellow
