const fs = require('fs')

const cov = JSON.parse(fs.readFileSync('coverage/coverage-final.json', 'utf8'))

// Tier 1 files - Critical path for Phase 3
const tier1Files = ['use-kv.ts', 'HTTPScanner.ts', 'HueBridgeAdapter.ts']

console.log('\n╔══════════════════════════════════════════════════════════╗')
console.log('║         Week 1 Critical Path Coverage Report            ║')
console.log('╚══════════════════════════════════════════════════════════╝\n')

let totalStmts = 0
let totalBranches = 0
let totalFuncs = 0
let fileCount = 0

tier1Files.forEach(filename => {
  const file = Object.keys(cov).find(k => k.includes(filename) && !k.includes('test'))

  if (file) {
    const d = cov[file]
    const stmts = (Object.values(d.s).filter(v => v > 0).length / Object.keys(d.s).length) * 100
    const branches =
      (Object.values(d.b)
        .flat()
        .filter(v => v > 0).length /
        Object.values(d.b).flat().length) *
      100
    const funcs = (Object.values(d.f).filter(v => v > 0).length / Object.keys(d.f).length) * 100

    console.log(`📄 ${filename}`)
    console.log(`   Statements: ${stmts.toFixed(2)}%`)
    console.log(`   Branches:   ${branches.toFixed(2)}%`)
    console.log(`   Functions:  ${funcs.toFixed(2)}%`)
    console.log()

    totalStmts += stmts
    totalBranches += branches
    totalFuncs += funcs
    fileCount++
  }
})

if (fileCount > 0) {
  console.log('─────────────────────────────────────────────────────────')
  console.log(`📊 Average Coverage (${fileCount} files):`)
  console.log(`   Statements: ${(totalStmts / fileCount).toFixed(2)}%`)
  console.log(`   Branches:   ${(totalBranches / fileCount).toFixed(2)}%`)
  console.log(`   Functions:  ${(totalFuncs / fileCount).toFixed(2)}%`)
  console.log('═════════════════════════════════════════════════════════\n')
}
