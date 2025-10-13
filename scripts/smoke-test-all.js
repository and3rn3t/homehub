#!/usr/bin/env node
/**
 * Run All Smoke Tests
 *
 * Orchestrates both frontend and worker smoke tests
 * Provides comprehensive deployment verification
 */

import { spawn } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function runScript(scriptPath, name) {
  return new Promise((resolve, reject) => {
    log(`\n${'='.repeat(70)}`, 'cyan')
    log(`🚀 Running ${name}`, 'blue')
    log(`${'='.repeat(70)}\n`, 'cyan')

    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      shell: true,
    })

    child.on('close', code => {
      if (code === 0) {
        log(`\n✅ ${name} completed successfully\n`, 'green')
        resolve({ name, success: true, code })
      } else {
        log(`\n❌ ${name} failed with exit code ${code}\n`, 'red')
        resolve({ name, success: false, code })
      }
    })

    child.on('error', error => {
      log(`\n❌ ${name} crashed: ${error.message}\n`, 'red')
      reject({ name, error })
    })
  })
}

async function runAllTests() {
  const startTime = Date.now()

  log('\n' + '='.repeat(70), 'magenta')
  log('🧪 HomeHub Production Deployment - Comprehensive Smoke Tests', 'magenta')
  log('='.repeat(70), 'magenta')
  log('Testing:', 'cyan')
  log('  • Frontend: https://homehub.andernet.dev', 'cyan')
  log('  • Worker:   https://homehub-kv-worker.andernet.workers.dev', 'cyan')
  log('='.repeat(70) + '\n', 'magenta')

  const results = []

  try {
    // Run Worker tests first (backend)
    const workerResult = await runScript(
      join(__dirname, 'smoke-test-worker.js'),
      'Worker API Tests'
    )
    results.push(workerResult)

    // Run Frontend tests (frontend)
    const frontendResult = await runScript(
      join(__dirname, 'smoke-test-frontend.js'),
      'Frontend App Tests'
    )
    results.push(frontendResult)
  } catch (error) {
    log(`\n💥 Test suite crashed: ${error.message}`, 'red')
    process.exit(1)
  }

  // Final summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  log('\n' + '='.repeat(70), 'magenta')
  log('📊 Final Test Summary', 'blue')
  log('='.repeat(70), 'magenta')

  results.forEach(result => {
    const icon = result.success ? '✅' : '❌'
    const color = result.success ? 'green' : 'red'
    log(`${icon} ${result.name}`, color)
  })

  log(`\n⏱️  Total Duration: ${duration}s`, 'cyan')
  log(`✅ Passed: ${passed}/${results.length}`, passed === results.length ? 'green' : 'yellow')
  log(`❌ Failed: ${failed}/${results.length}`, failed > 0 ? 'red' : 'green')
  log('='.repeat(70) + '\n', 'magenta')

  if (failed > 0) {
    log('❌ DEPLOYMENT VERIFICATION FAILED', 'red')
    log('Please review the test output above and fix any issues.\n', 'yellow')
    process.exit(1)
  } else {
    log('🎉 ALL TESTS PASSED - DEPLOYMENT VERIFIED!', 'green')
    log('Your HomeHub app is ready for production use.\n', 'cyan')
    process.exit(0)
  }
}

// Run all tests
runAllTests().catch(error => {
  console.error('Test orchestrator crashed:', error)
  process.exit(1)
})
