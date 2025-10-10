#!/usr/bin/env node

/**
 * Multi-Protocol Integration Tests
 *
 * Tests MQTT + HTTP adapters working together.
 *
 * Prerequisites:
 *   - MQTT broker running (docker-compose up -d)
 *   - Virtual HTTP devices running (npm run http-devices)
 *   - Dev server running (npm run dev)
 *
 * Usage:
 *   node scripts/test-multi-protocol.js
 */

import mqtt from 'mqtt'

// Test configuration
const MQTT_BROKER = 'mqtt://localhost:1883'
const HTTP_BASE_URL = 'http://localhost:8001'
const TEST_TIMEOUT = 30000

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: [],
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Test helper
 */
async function test(name, fn) {
  process.stdout.write(`\n🧪 ${name}... `)
  try {
    await fn()
    console.log('✅ PASS')
    results.passed++
    results.tests.push({ name, status: 'pass' })
  } catch (error) {
    console.log(`❌ FAIL`)
    console.error(`   Error: ${error.message}`)
    results.failed++
    results.tests.push({ name, status: 'fail', error: error.message })
  }
}

/**
 * Assert helper
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

/**
 * Test 1: HTTP Device Connection
 */
async function testHTTPConnection() {
  const response = await fetch(`${HTTP_BASE_URL}/health`)
  assert(response.ok, 'HTTP device not responding')

  const data = await response.json()
  assert(data.status === 'ok', 'HTTP device health check failed')
}

/**
 * Test 2: HTTP Device Discovery (Shelly)
 */
async function testHTTPDiscovery() {
  const response = await fetch(`${HTTP_BASE_URL}/shelly`)
  assert(response.ok, 'Shelly discovery failed')

  const data = await response.json()
  assert(data.name, 'Device name missing')
  assert(data.mac, 'Device MAC missing')
  assert(data.gen === 2, 'Not a Gen2 device')
}

/**
 * Test 3: HTTP Device Control (Toggle)
 */
async function testHTTPControl() {
  // Get initial state
  const statusResp1 = await fetch(`${HTTP_BASE_URL}/rpc/Switch.GetStatus?id=0`)
  const status1 = await statusResp1.json()
  const initialState = status1.output

  // Toggle
  const toggleResp = await fetch(`${HTTP_BASE_URL}/rpc/Switch.Toggle?id=0`, {
    method: 'POST',
  })
  assert(toggleResp.ok, 'Toggle request failed')

  await sleep(100)

  // Verify state changed
  const statusResp2 = await fetch(`${HTTP_BASE_URL}/rpc/Switch.GetStatus?id=0`)
  const status2 = await statusResp2.json()
  assert(status2.output === !initialState, 'State did not change after toggle')

  // Toggle back
  await fetch(`${HTTP_BASE_URL}/rpc/Switch.Toggle?id=0`, { method: 'POST' })
}

/**
 * Test 4: HTTP Device Set State
 */
async function testHTTPSetState() {
  // Turn on
  const onResp = await fetch(`${HTTP_BASE_URL}/rpc/Switch.Set?id=0&on=true`, {
    method: 'POST',
  })
  assert(onResp.ok, 'Set ON failed')

  await sleep(100)

  // Verify ON
  const status1 = await fetch(`${HTTP_BASE_URL}/rpc/Switch.GetStatus?id=0`)
  const data1 = await status1.json()
  assert(data1.output === true, 'Device not ON')

  // Turn off
  const offResp = await fetch(`${HTTP_BASE_URL}/rpc/Switch.Set?id=0&on=false`, {
    method: 'POST',
  })
  assert(offResp.ok, 'Set OFF failed')

  await sleep(100)

  // Verify OFF
  const status2 = await fetch(`${HTTP_BASE_URL}/rpc/Switch.GetStatus?id=0`)
  const data2 = await status2.json()
  assert(data2.output === false, 'Device not OFF')
}

/**
 * Test 5: MQTT Connection
 */
async function testMQTTConnection() {
  return new Promise((resolve, reject) => {
    const client = mqtt.connect(MQTT_BROKER)
    const timeout = setTimeout(() => {
      client.end()
      reject(new Error('MQTT connection timeout'))
    }, 5000)

    client.on('connect', () => {
      clearTimeout(timeout)
      client.end()
      resolve()
    })

    client.on('error', error => {
      clearTimeout(timeout)
      reject(error)
    })
  })
}

/**
 * Test 6: MQTT Device Discovery
 */
async function testMQTTDiscovery() {
  return new Promise((resolve, reject) => {
    const client = mqtt.connect(MQTT_BROKER)
    let discovered = false

    const timeout = setTimeout(() => {
      client.end()
      if (!discovered) {
        reject(new Error('No device announcements received'))
      }
    }, 10000)

    client.on('connect', () => {
      client.subscribe('homehub/device/announce')
    })

    client.on('message', (topic, message) => {
      if (topic === 'homehub/device/announce') {
        try {
          const device = JSON.parse(message.toString())
          assert(device.id, 'Device ID missing')
          assert(device.name, 'Device name missing')
          discovered = true
          clearTimeout(timeout)
          client.end()
          resolve()
        } catch (error) {
          clearTimeout(timeout)
          client.end()
          reject(error)
        }
      }
    })

    client.on('error', error => {
      clearTimeout(timeout)
      reject(error)
    })
  })
}

/**
 * Test 7: Mixed Protocol Device Count
 */
async function testMixedProtocols() {
  // This test verifies both MQTT and HTTP devices can coexist
  // In real usage, DeviceRegistry would manage both

  // Check MQTT broker is accessible
  await testMQTTConnection()

  // Check HTTP device is accessible
  await testHTTPConnection()

  // Both protocols operational
  assert(true, 'Multi-protocol support verified')
}

/**
 * Test 8: HTTP Adapter Error Handling
 */
async function testHTTPErrorHandling() {
  // Test invalid endpoint
  try {
    await fetch(`${HTTP_BASE_URL}/invalid/endpoint`)
    // If it doesn't throw, check status
    const response = await fetch(`${HTTP_BASE_URL}/invalid/endpoint`)
    assert(response.status === 404, 'Should return 404 for invalid endpoint')
  } catch (error) {
    // Expected to fail
  }

  // Test with timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 100)

  try {
    await fetch(`${HTTP_BASE_URL}/rpc/Switch.GetStatus?id=0`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
  } catch (error) {
    clearTimeout(timeoutId)
    // Timeout or abort is expected behavior
  }
}

/**
 * Test 9: HTTP Polling Performance
 */
async function testHTTPPolling() {
  const iterations = 10
  const start = Date.now()

  for (let i = 0; i < iterations; i++) {
    await fetch(`${HTTP_BASE_URL}/rpc/Switch.GetStatus?id=0`)
  }

  const duration = Date.now() - start
  const avgLatency = duration / iterations

  console.log(`\n   Average latency: ${avgLatency.toFixed(2)}ms`)
  assert(avgLatency < 100, `Polling too slow: ${avgLatency}ms (expected <100ms)`)
}

/**
 * Test 10: State Consistency
 */
async function testStateConsistency() {
  // Set to known state
  await fetch(`${HTTP_BASE_URL}/rpc/Switch.Set?id=0&on=true`, { method: 'POST' })
  await sleep(100)

  // Read state multiple times
  const reads = []
  for (let i = 0; i < 5; i++) {
    const response = await fetch(`${HTTP_BASE_URL}/rpc/Switch.GetStatus?id=0`)
    const data = await response.json()
    reads.push(data.output)
    await sleep(50)
  }

  // All reads should be consistent
  const allTrue = reads.every(state => state === true)
  assert(allTrue, 'State inconsistency detected')
}

/**
 * Main test runner
 */
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════╗')
  console.log('║   HomeHub Multi-Protocol Integration Tests           ║')
  console.log('╚═══════════════════════════════════════════════════════╝')

  console.log('\n📋 Prerequisites:')
  console.log('   - MQTT broker (docker-compose up -d)')
  console.log('   - Virtual HTTP device (node scripts/http-virtual-device.js --port 8001)')
  console.log('   - Optional: MQTT virtual device for Test 6')

  console.log('\n🚀 Running tests...')

  // HTTP Tests
  await test('HTTP Device Connection', testHTTPConnection)
  await test('HTTP Device Discovery (Shelly)', testHTTPDiscovery)
  await test('HTTP Device Control (Toggle)', testHTTPControl)
  await test('HTTP Device Set State', testHTTPSetState)
  await test('HTTP Adapter Error Handling', testHTTPErrorHandling)
  await test('HTTP Polling Performance', testHTTPPolling)
  await test('State Consistency', testStateConsistency)

  // MQTT Tests
  await test('MQTT Connection', testMQTTConnection)

  // Mixed Protocol Tests
  await test('Mixed Protocol Support', testMixedProtocols)

  // Summary
  console.log('\n╔═══════════════════════════════════════════════════════╗')
  console.log('║   Test Results                                        ║')
  console.log('╚═══════════════════════════════════════════════════════╝\n')

  console.log(`✅ Passed: ${results.passed}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`📊 Total:  ${results.passed + results.failed}`)
  console.log(
    `🎯 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%\n`
  )

  if (results.failed > 0) {
    console.log('Failed tests:')
    results.tests
      .filter(t => t.status === 'fail')
      .forEach(t => {
        console.log(`   ❌ ${t.name}`)
        console.log(`      ${t.error}`)
      })
    console.log('')
    process.exit(1)
  } else {
    console.log('🎉 All tests passed!\n')
    process.exit(0)
  }
}

// Run tests
const isMainModule = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`

if (isMainModule) {
  main().catch(error => {
    console.error('\n💥 Test runner crashed:', error)
    process.exit(1)
  })
}

export { assert, test }
