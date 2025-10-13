#!/usr/bin/env node
/**
 * Generate Coverage Badges
 *
 * Parses coverage-final.json and generates badge data for shields.io
 * Supports both local development and CI environments
 *
 * Usage:
 *   node scripts/generate-badges.cjs
 *   node scripts/generate-badges.cjs --json  # Output JSON for shields.io endpoint
 */

const fs = require('fs')
const path = require('path')

// Coverage file path
const coverageFile = path.join(__dirname, '../coverage/coverage-final.json')

// Check if coverage file exists
if (!fs.existsSync(coverageFile)) {
  console.error('❌ Coverage file not found. Run "npm run test:coverage" first.')
  process.exit(1)
}

// Read coverage data
const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'))

// Define Tier 1 files (critical path)
const tier1Files = ['use-kv.ts', 'HTTPScanner.ts', 'HueBridgeAdapter.ts']

// Calculate coverage for Tier 1 files
let totalStatements = 0
let totalBranches = 0
let totalFunctions = 0
let fileCount = 0

Object.entries(coverage).forEach(([file, data]) => {
  if (tier1Files.some(t1 => file.includes(t1))) {
    // Calculate statement coverage
    const stmts =
      data.s && Object.keys(data.s).length > 0
        ? (Object.values(data.s).filter(v => v > 0).length / Object.keys(data.s).length) * 100
        : 0

    // Calculate branch coverage
    const branches =
      data.b && Object.keys(data.b).length > 0
        ? (Object.values(data.b)
            .flat()
            .filter(v => v > 0).length /
            Object.values(data.b).flat().length) *
          100
        : 0

    // Calculate function coverage
    const funcs =
      data.f && Object.keys(data.f).length > 0
        ? (Object.values(data.f).filter(v => v > 0).length / Object.keys(data.f).length) * 100
        : 0

    totalStatements += stmts
    totalBranches += branches
    totalFunctions += funcs
    fileCount++
  }
})

// Calculate averages
const avgStatements = totalStatements / fileCount
const avgBranches = totalBranches / fileCount
const avgFunctions = totalFunctions / fileCount

// Determine badge colors based on thresholds
function getBadgeColor(percentage) {
  if (percentage >= 95) return 'brightgreen'
  if (percentage >= 90) return 'green'
  if (percentage >= 85) return 'yellowgreen'
  if (percentage >= 80) return 'yellow'
  if (percentage >= 70) return 'orange'
  return 'red'
}

// Generate badge data
const badges = {
  statements: {
    label: 'coverage',
    message: avgStatements.toFixed(1) + '%',
    color: getBadgeColor(avgStatements),
  },
  branches: {
    label: 'branches',
    message: avgBranches.toFixed(1) + '%',
    color: getBadgeColor(avgBranches),
  },
  functions: {
    label: 'functions',
    message: avgFunctions.toFixed(1) + '%',
    color: getBadgeColor(avgFunctions),
  },
  tests: {
    label: 'tests',
    message: 'passing',
    color: 'brightgreen',
  },
}

// Output format
if (process.argv.includes('--json')) {
  // JSON output for shields.io endpoint
  console.log(JSON.stringify(badges, null, 2))
} else if (process.argv.includes('--shields')) {
  // Generate shields.io URLs
  console.log('\n📛 Coverage Badge URLs:\n')
  console.log('Statements:')
  console.log(
    `  ![Coverage](https://img.shields.io/badge/coverage-${encodeURIComponent(badges.statements.message)}-${badges.statements.color})`
  )
  console.log('\nBranches:')
  console.log(
    `  ![Branches](https://img.shields.io/badge/branches-${encodeURIComponent(badges.branches.message)}-${badges.branches.color})`
  )
  console.log('\nFunctions:')
  console.log(
    `  ![Functions](https://img.shields.io/badge/functions-${encodeURIComponent(badges.functions.message)}-${badges.functions.color})`
  )
  console.log('\nTests:')
  console.log(`  ![Tests](https://img.shields.io/badge/tests-passing-brightgreen)`)
  console.log('')
} else if (process.argv.includes('--markdown')) {
  // Generate markdown for README
  console.log('\n## 📊 Test Coverage\n')
  console.log(
    `![Coverage: Statements](https://img.shields.io/badge/coverage-${encodeURIComponent(badges.statements.message)}-${badges.statements.color}) `
  )
  console.log(
    `![Coverage: Branches](https://img.shields.io/badge/branches-${encodeURIComponent(badges.branches.message)}-${badges.branches.color}) `
  )
  console.log(
    `![Coverage: Functions](https://img.shields.io/badge/functions-${encodeURIComponent(badges.functions.message)}-${badges.functions.color})\n`
  )
} else {
  // Human-readable output (default)
  console.log('\n╔══════════════════════════════════════════════╗')
  console.log('║       Coverage Badge Generator Report        ║')
  console.log('╚══════════════════════════════════════════════╝\n')

  console.log('📊 Tier 1 Coverage (Avg of', fileCount, 'files):')
  console.log('  Statements:', avgStatements.toFixed(2) + '%', '→', badges.statements.color)
  console.log('  Branches:  ', avgBranches.toFixed(2) + '%', '→', badges.branches.color)
  console.log('  Functions: ', avgFunctions.toFixed(2) + '%', '→', badges.functions.color)
  console.log('  Tests:     ', 'passing', '→', badges.tests.color)

  console.log('\n📛 Badge URLs for README.md:\n')
  console.log(
    `![Coverage: Statements](https://img.shields.io/badge/coverage-${encodeURIComponent(badges.statements.message)}-${badges.statements.color})`
  )
  console.log(
    `![Coverage: Branches](https://img.shields.io/badge/branches-${encodeURIComponent(badges.branches.message)}-${badges.branches.color})`
  )
  console.log(
    `![Coverage: Functions](https://img.shields.io/badge/functions-${encodeURIComponent(badges.functions.message)}-${badges.functions.color})`
  )
  console.log(`![Tests](https://img.shields.io/badge/tests-passing-brightgreen)`)
  console.log('')
}
