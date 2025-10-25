# Fix lucide-react imports in UI components
# Converts: import ChevronDownIcon from "lucide-react/dist/esm/icons/chevron-down"
# To: import { ChevronDown } from "lucide-react"

$uiPath = "src/components/ui"
$iconMap = @{
    'ChevronDownIcon' = 'ChevronDown'
    'ChevronRightIcon' = 'ChevronRight'
    'ChevronLeftIcon' = 'ChevronLeft'
    'ChevronUpIcon' = 'ChevronUp'
    'CheckIcon' = 'Check'
    'XIcon' = 'X'
    'SearchIcon' = 'Search'
    'MoreHorizontalIcon' = 'MoreHorizontal'
    'ArrowLeftIcon' = 'ArrowLeft'
    'ArrowRightIcon' = 'ArrowRight'
    'CircleIcon' = 'Circle'
    'MinusIcon' = 'Minus'
    'PanelLeftIcon' = 'PanelLeft'
    'GripVerticalIcon' = 'GripVertical'
}

Get-ChildItem -Path $uiPath -Filter "*.tsx" -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $modified = $false

    # First pass: Update import statements
    $content = $content -replace 'import\s+(\w+)\s+from\s+"lucide-react/dist/esm/icons/([^"]+)"', {
        param($match)
        $importName = $match.Groups[1].Value
        $iconPath = $match.Groups[2].Value

        # Convert kebab-case to PascalCase
        $properName = ($iconPath -split '-' | ForEach-Object {
            $_.Substring(0,1).ToUpper() + $_.Substring(1)
        }) -join ''

        $modified = $true
        "import { $properName } from `"lucide-react`""
    }

    # Second pass: Replace icon usage in JSX (old name to new name)
    foreach ($oldName in $iconMap.Keys) {
        $newName = $iconMap[$oldName]
        if ($content -match [regex]::Escape($oldName)) {
            $content = $content -replace [regex]::Escape($oldName), $newName
            $modified = $true
        }
    }

    if ($modified) {
        Set-Content $_.FullName $content -NoNewline
        Write-Host "Updated: $($_.Name)" -ForegroundColor Green
    }
}

Write-Host "`n✓ Lucide imports fixed!" -ForegroundColor Cyan
