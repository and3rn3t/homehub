#!/usr/bin/env node
/**
 * Frontend Smoke Tests
 *
 * Tests the production deployment at homehub.andernet.dev
 * Verifies: app loads, bundle integrity, network requests, console errors
 */

import { chromium } from 'playwright'

const FRONTEND_URL = 'https://homehub.andernet.dev'
const WORKER_URL = 'https://homehub-kv-worker.andernet.workers.dev'
const TIMEOUT = 30000

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logTest(name, status, details = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️'
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow'
  log(`${icon} ${name}`, color)
  if (details) log(`   ${details}`, 'cyan')
}

async function runSmokeTests() {
  log('\n🧪 Starting Frontend Smoke Tests\n', 'blue')
  log(`Testing: ${FRONTEND_URL}`, 'cyan')
  log(`Worker: ${WORKER_URL}\n`, 'cyan')

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: [],
  }

  let browser
  let page

  try {
    // Launch browser
    log('🚀 Launching browser...', 'yellow')
    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    })
    page = await context.newPage()

    // Collect console messages
    const consoleMessages = []
    const consoleErrors = []
    page.on('console', msg => {
      const text = msg.text()
      consoleMessages.push({ type: msg.type(), text })
      if (msg.type() === 'error') consoleErrors.push(text)
    })

    // Collect network requests
    const networkRequests = []
    const failedRequests = []
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
      })
    })
    page.on('requestfailed', request => {
      failedRequests.push({
        url: request.url(),
        failure: request.failure(),
      })
    })

    // Test 1: Page loads successfully
    log('\n📄 Test 1: Page Load', 'yellow')
    try {
      const response = await page.goto(FRONTEND_URL, {
        waitUntil: 'networkidle',
        timeout: TIMEOUT,
      })

      if (response && response.ok()) {
        logTest('Page loads with 200 OK', 'pass', `Status: ${response.status()}`)
        results.passed++
      } else {
        logTest('Page loads with 200 OK', 'fail', `Status: ${response?.status() || 'unknown'}`)
        results.failed++
      }
    } catch (error) {
      logTest('Page loads with 200 OK', 'fail', error.message)
      results.failed++
      throw error // Can't continue if page doesn't load
    }

    // Test 2: HTML structure
    log('\n🏗️  Test 2: HTML Structure', 'yellow')
    try {
      const title = await page.title()
      if (title && title.length > 0) {
        logTest('Page has title', 'pass', `Title: "${title}"`)
        results.passed++
      } else {
        logTest('Page has title', 'fail')
        results.failed++
      }

      const rootElement = await page.locator('#root').count()
      if (rootElement > 0) {
        logTest('React root element exists', 'pass')
        results.passed++
      } else {
        logTest('React root element exists', 'fail')
        results.failed++
      }
    } catch (error) {
      logTest('HTML structure check', 'fail', error.message)
      results.failed++
    }

    // Test 3: React app renders
    log('\n⚛️  Test 3: React App Rendering', 'yellow')
    try {
      // Wait for any text content in root (sign that React rendered)
      await page.waitForSelector('#root *', { timeout: 10000 })

      const hasContent = await page.evaluate(() => {
        const root = document.getElementById('root')
        return root && root.textContent.length > 100
      })

      if (hasContent) {
        logTest('React app renders content', 'pass')
        results.passed++
      } else {
        logTest('React app renders content', 'fail', 'Root element is empty')
        results.failed++
      }
    } catch (error) {
      logTest('React app renders content', 'fail', error.message)
      results.failed++
    }

    // Test 4: JavaScript bundle loads
    log('\n📦 Test 4: Asset Loading', 'yellow')
    const jsRequests = networkRequests.filter(r => r.resourceType === 'script')
    const cssRequests = networkRequests.filter(r => r.resourceType === 'stylesheet')

    if (jsRequests.length > 0) {
      logTest('JavaScript bundles loaded', 'pass', `${jsRequests.length} scripts`)
      results.passed++
    } else {
      logTest('JavaScript bundles loaded', 'fail')
      results.failed++
    }

    if (cssRequests.length > 0) {
      logTest('CSS stylesheets loaded', 'pass', `${cssRequests.length} stylesheets`)
      results.passed++
    } else {
      logTest('CSS stylesheets loaded', 'warn', 'No stylesheets detected')
      results.warnings++
    }

    // Test 5: No console errors
    log('\n🐛 Test 5: Console Errors', 'yellow')
    if (consoleErrors.length === 0) {
      logTest('No console errors', 'pass')
      results.passed++
    } else {
      logTest('No console errors', 'fail', `${consoleErrors.length} errors found`)
      consoleErrors.slice(0, 3).forEach(err => {
        log(`   - ${err.substring(0, 100)}`, 'red')
      })
      if (consoleErrors.length > 3) {
        log(`   ... and ${consoleErrors.length - 3} more errors`, 'red')
      }
      results.failed++
    }

    // Test 6: Network requests
    log('\n🌐 Test 6: Network Requests', 'yellow')
    if (failedRequests.length === 0) {
      logTest('No failed network requests', 'pass')
      results.passed++
    } else {
      logTest('No failed network requests', 'fail', `${failedRequests.length} failed`)
      failedRequests.slice(0, 3).forEach(req => {
        log(`   - ${req.url}`, 'red')
        log(`     ${req.failure?.errorText || 'Unknown error'}`, 'red')
      })
      results.failed++
    }

    // Test 7: Worker API accessibility
    log('\n🔧 Test 7: Worker API', 'yellow')
    const workerRequests = networkRequests.filter(r => r.url.includes('homehub-kv-worker'))
    if (workerRequests.length > 0) {
      logTest('App communicates with Worker', 'pass', `${workerRequests.length} requests`)
      results.passed++
    } else {
      logTest('App communicates with Worker', 'warn', 'No Worker requests detected (may be cached)')
      results.warnings++
    }

    // Test 8: Tab navigation
    log('\n🗂️  Test 8: Tab Navigation', 'yellow')
    try {
      // Look for navigation/tab elements
      const tabs = await page.locator('[role="tablist"], [role="navigation"], nav').count()
      if (tabs > 0) {
        logTest('Navigation elements present', 'pass')
        results.passed++
      } else {
        logTest('Navigation elements present', 'warn', 'No nav elements found')
        results.warnings++
      }
    } catch (error) {
      logTest('Navigation elements present', 'warn', error.message)
      results.warnings++
    }

    // Test 9: Theme detection
    log('\n🎨 Test 9: Theme System', 'yellow')
    try {
      const hasTheme = await page.evaluate(() => {
        const html = document.documentElement
        return html.classList.contains('light') || html.classList.contains('dark')
      })

      if (hasTheme) {
        logTest('Theme system active', 'pass')
        results.passed++
      } else {
        logTest('Theme system active', 'warn', 'No theme class detected')
        results.warnings++
      }
    } catch (error) {
      logTest('Theme system active', 'warn', error.message)
      results.warnings++
    }

    // Test 10: Performance check
    log('\n⚡ Test 10: Performance', 'yellow')
    try {
      const metrics = await page.evaluate(() => {
        const perf = performance.getEntriesByType('navigation')[0]
        return {
          loadTime: perf.loadEventEnd - perf.loadEventStart,
          domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
          transferSize: perf.transferSize,
        }
      })

      const loadTimeSeconds = (metrics.loadTime / 1000).toFixed(2)
      if (metrics.loadTime < 3000) {
        logTest('Page load time', 'pass', `${loadTimeSeconds}s (target: <3s)`)
        results.passed++
      } else {
        logTest('Page load time', 'warn', `${loadTimeSeconds}s (slow, target: <3s)`)
        results.warnings++
      }

      const sizeKB = (metrics.transferSize / 1024).toFixed(2)
      logTest('Transfer size', 'pass', `${sizeKB} KB`)
    } catch (error) {
      logTest('Performance metrics', 'warn', 'Could not collect metrics')
      results.warnings++
    }
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red')
    results.failed++
  } finally {
    if (browser) {
      await browser.close()
    }
  }

  // Summary
  log('\n' + '='.repeat(60), 'cyan')
  log('📊 Test Summary', 'blue')
  log('='.repeat(60), 'cyan')
  log(`✅ Passed:   ${results.passed}`, 'green')
  log(`❌ Failed:   ${results.failed}`, 'red')
  log(`⚠️  Warnings: ${results.warnings}`, 'yellow')
  log(`📈 Total:    ${results.passed + results.failed + results.warnings}`, 'cyan')
  log('='.repeat(60) + '\n', 'cyan')

  // Exit code
  if (results.failed > 0) {
    log('❌ SMOKE TESTS FAILED\n', 'red')
    process.exit(1)
  } else if (results.warnings > 0) {
    log('⚠️  SMOKE TESTS PASSED WITH WARNINGS\n', 'yellow')
    process.exit(0)
  } else {
    log('✅ ALL SMOKE TESTS PASSED\n', 'green')
    process.exit(0)
  }
}

// Run tests
runSmokeTests().catch(error => {
  console.error('Test runner crashed:', error)
  process.exit(1)
})
