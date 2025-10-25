#!/usr/bin/env node
/**
 * Worker Smoke Tests
 *
 * Tests the Cloudflare Worker API at homehub-kv-worker.andernet.workers.dev
 * Verifies: health check, KV operations, CORS, error handling
 */

const WORKER_URL = 'https://homehub-kv-worker.andernet.workers.dev'
const TEST_KEY = `smoke-test-${Date.now()}`
const TEST_VALUE = { test: true, timestamp: Date.now(), message: 'Smoke test data' }

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

async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

async function runWorkerTests() {
  log('\n🔧 Starting Worker Smoke Tests\n', 'blue')
  log(`Testing: ${WORKER_URL}\n`, 'cyan')

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: [],
  }

  try {
    // Test 1: Health Check
    log('🏥 Test 1: Health Check', 'yellow')
    try {
      const response = await fetchWithTimeout(`${WORKER_URL}/health`)
      const data = await response.json()

      if (response.ok && data.status === 'healthy') {
        logTest(
          'Health endpoint returns 200',
          'pass',
          `Response time: ${response.headers.get('cf-ray') ? 'Cloudflare' : 'Direct'}`
        )
        results.passed++
      } else {
        logTest('Health endpoint returns 200', 'fail', `Status: ${response.status}`)
        results.failed++
      }

      if (data.timestamp && typeof data.timestamp === 'number') {
        logTest('Health response includes timestamp', 'pass')
        results.passed++
      } else {
        logTest('Health response includes timestamp', 'fail')
        results.failed++
      }
    } catch (error) {
      logTest('Health check', 'fail', error.message)
      results.failed += 2
    }

    // Test 2: CORS Headers
    log('\n🌐 Test 2: CORS Configuration', 'yellow')
    try {
      const response = await fetchWithTimeout(`${WORKER_URL}/health`)
      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
      }

      if (corsHeaders['Access-Control-Allow-Origin']) {
        logTest(
          'CORS headers present',
          'pass',
          `Origin: ${corsHeaders['Access-Control-Allow-Origin']}`
        )
        results.passed++
      } else {
        logTest('CORS headers present', 'fail')
        results.failed++
      }
    } catch (error) {
      logTest('CORS check', 'fail', error.message)
      results.failed++
    }

    // Test 3: OPTIONS (preflight) request
    log('\n🚦 Test 3: CORS Preflight', 'yellow')
    try {
      const response = await fetchWithTimeout(`${WORKER_URL}/kv`, {
        method: 'OPTIONS',
      })

      if (response.ok) {
        logTest('OPTIONS request succeeds', 'pass', `Status: ${response.status}`)
        results.passed++
      } else {
        logTest('OPTIONS request succeeds', 'fail', `Status: ${response.status}`)
        results.failed++
      }
    } catch (error) {
      logTest('OPTIONS request', 'fail', error.message)
      results.failed++
    }

    // Test 4: List Keys (GET /kv)
    log('\n📋 Test 4: List KV Keys', 'yellow')
    try {
      const response = await fetchWithTimeout(`${WORKER_URL}/kv`)
      const data = await response.json()

      if (response.ok) {
        logTest('List keys endpoint works', 'pass', `Found ${data.count || 0} keys`)
        results.passed++
      } else {
        logTest('List keys endpoint works', 'fail', `Status: ${response.status}`)
        results.failed++
      }

      if (data.keys !== undefined && data.count !== undefined) {
        logTest('Response has correct structure', 'pass')
        results.passed++
      } else {
        logTest('Response has correct structure', 'fail', 'Missing keys or count')
        results.failed++
      }
    } catch (error) {
      logTest('List keys', 'fail', error.message)
      results.failed += 2
    }

    // Test 5: Write Data (POST /kv/:key)
    log('\n✍️  Test 5: Write to KV Store', 'yellow')
    try {
      const response = await fetchWithTimeout(`${WORKER_URL}/kv/${TEST_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: TEST_VALUE }),
      })

      if (response.ok) {
        logTest('Write operation succeeds', 'pass', `Key: ${TEST_KEY}`)
        results.passed++
      } else {
        const errorText = await response.text()
        logTest(
          'Write operation succeeds',
          'fail',
          `Status: ${response.status}, Error: ${errorText}`
        )
        results.failed++
      }
    } catch (error) {
      logTest('Write operation', 'fail', error.message)
      results.failed++
    }

    // Test 6: Read Data (GET /kv/:key)
    log('\n📖 Test 6: Read from KV Store', 'yellow')
    try {
      const response = await fetchWithTimeout(`${WORKER_URL}/kv/${TEST_KEY}`)

      if (response.ok) {
        const data = await response.json()

        // Worker returns: { key, value, timestamp }
        if (
          data.value &&
          data.value.test === TEST_VALUE.test &&
          data.value.message === TEST_VALUE.message
        ) {
          logTest('Read operation retrieves correct data', 'pass')
          results.passed++
        } else {
          logTest('Read operation retrieves correct data', 'fail', 'Data mismatch')
          results.failed++
        }
      } else if (response.status === 404) {
        logTest('Read operation', 'warn', 'Key not found (KV eventual consistency delay?)')
        results.warnings++
      } else {
        logTest('Read operation', 'fail', `Status: ${response.status}`)
        results.failed++
      }
    } catch (error) {
      logTest('Read operation', 'fail', error.message)
      results.failed++
    }

    // Test 7: Delete Data (DELETE /kv/:key)
    log('\n🗑️  Test 7: Delete from KV Store', 'yellow')
    try {
      const response = await fetchWithTimeout(`${WORKER_URL}/kv/${TEST_KEY}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        logTest('Delete operation succeeds', 'pass')
        results.passed++
      } else {
        logTest('Delete operation succeeds', 'fail', `Status: ${response.status}`)
        results.failed++
      }
    } catch (error) {
      logTest('Delete operation', 'fail', error.message)
      results.failed++
    }

    // Test 8: Verify Deletion (GET /kv/:key should 404)
    log('\n🔍 Test 8: Verify Deletion', 'yellow')
    try {
      const response = await fetchWithTimeout(`${WORKER_URL}/kv/${TEST_KEY}`)

      if (response.status === 404) {
        logTest('Deleted key returns 404', 'pass')
        results.passed++
      } else if (response.ok) {
        logTest('Deleted key returns 404', 'warn', 'Key still exists (eventual consistency)')
        results.warnings++
      } else {
        logTest('Deleted key returns 404', 'fail', `Unexpected status: ${response.status}`)
        results.failed++
      }
    } catch (error) {
      logTest('Verify deletion', 'fail', error.message)
      results.failed++
    }

    // Test 9: Error Handling (Invalid key)
    log('\n🚨 Test 9: Error Handling', 'yellow')
    try {
      const response = await fetchWithTimeout(`${WORKER_URL}/kv/nonexistent-key-${Date.now()}`)

      if (response.status === 404) {
        const data = await response.json()
        if (data.error) {
          logTest('404 returns proper error response', 'pass')
          results.passed++
        } else {
          logTest('404 returns proper error response', 'warn', 'No error field in response')
          results.warnings++
        }
      } else {
        logTest('404 handling', 'fail', `Expected 404, got ${response.status}`)
        results.failed++
      }
    } catch (error) {
      logTest('Error handling', 'fail', error.message)
      results.failed++
    }

    // Test 10: Invalid Route
    log('\n🛤️  Test 10: Invalid Route Handling', 'yellow')
    try {
      const response = await fetchWithTimeout(`${WORKER_URL}/invalid-route-${Date.now()}`)

      if (response.status === 404) {
        logTest('Invalid route returns 404', 'pass')
        results.passed++
      } else {
        logTest('Invalid route returns 404', 'fail', `Status: ${response.status}`)
        results.failed++
      }
    } catch (error) {
      logTest('Invalid route', 'fail', error.message)
      results.failed++
    }

    // Test 11: Cloudflare Headers
    log('\n☁️  Test 11: Cloudflare Infrastructure', 'yellow')
    try {
      const response = await fetchWithTimeout(`${WORKER_URL}/health`)
      const cfRay = response.headers.get('cf-ray')
      const server = response.headers.get('server')

      if (cfRay) {
        logTest('Cloudflare cf-ray header present', 'pass', `Ray ID: ${cfRay}`)
        results.passed++
      } else {
        logTest('Cloudflare cf-ray header present', 'warn', 'Not served by Cloudflare?')
        results.warnings++
      }

      if (server && server.toLowerCase().includes('cloudflare')) {
        logTest('Server header indicates Cloudflare', 'pass')
        results.passed++
      } else {
        logTest('Server header indicates Cloudflare', 'warn', `Server: ${server || 'unknown'}`)
        results.warnings++
      }
    } catch (error) {
      logTest('Cloudflare headers', 'warn', error.message)
      results.warnings++
    }

    // Test 12: Response Time
    log('\n⚡ Test 12: Performance', 'yellow')
    try {
      const start = Date.now()
      const response = await fetchWithTimeout(`${WORKER_URL}/health`)
      const duration = Date.now() - start

      if (duration < 500) {
        logTest('Health check response time', 'pass', `${duration}ms (target: <500ms)`)
        results.passed++
      } else if (duration < 1000) {
        logTest('Health check response time', 'warn', `${duration}ms (acceptable, target: <500ms)`)
        results.warnings++
      } else {
        logTest('Health check response time', 'fail', `${duration}ms (slow, target: <500ms)`)
        results.failed++
      }
    } catch (error) {
      logTest('Performance check', 'warn', error.message)
      results.warnings++
    }
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red')
    results.failed++
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
runWorkerTests().catch(error => {
  console.error('Test runner crashed:', error)
  process.exit(1)
})
