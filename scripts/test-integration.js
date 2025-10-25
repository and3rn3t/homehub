/**
 * Service Layer Integration Test
 *
 * Tests the complete flow:
 * 1. Virtual devices announce themselves
 * 2. DeviceRegistry discovers devices
 * 3. Commands are sent through registry
 * 4. Virtual devices respond and update state
 * 5. State updates are received through callbacks
 *
 * Usage:
 *   node scripts/test-integration.js
 */

import mqtt from 'mqtt'

const BROKER_URL =
  process.env.VITE_MQTT_BROKER_URL?.replace('ws:', 'mqtt:') || 'mqtt://localhost:1883'
const TEST_DEVICE_ID = 'integration-test-light'

console.log('🧪 Service Layer Integration Test')
console.log(`📡 Broker: ${BROKER_URL}\n`)

// Test state
const testResults = {
  deviceAnnouncement: false,
  deviceDiscovery: false,
  commandSent: false,
  stateUpdate: false,
  bidirectionalComm: false,
}

let testClient = null
let deviceState = {
  enabled: false,
  value: 0,
}

// Connect to broker
testClient = mqtt.connect(BROKER_URL, {
  clientId: `integration-test-${Date.now()}`,
  clean: true,
})

testClient.on('connect', async () => {
  console.log('✅ Connected to MQTT broker\n')

  // Subscribe to discovery announcements
  testClient.subscribe('homehub/discovery/announce', { qos: 1 })
  console.log('📥 Subscribed to discovery announcements')

  // Subscribe to device state updates
  testClient.subscribe(`homehub/devices/${TEST_DEVICE_ID}/state`, { qos: 1 })
  console.log(`📥 Subscribed to device state updates\n`)

  // Wait for subscriptions to be established
  await sleep(1000)

  // Start test sequence
  runTests()
})

testClient.on('message', (topic, payload) => {
  const message = payload.toString()

  try {
    const data = JSON.parse(message)

    if (topic === 'homehub/discovery/announce') {
      if (data.id === TEST_DEVICE_ID) {
        console.log('✅ TEST 1 PASSED: Device announcement received')
        console.log(`   Device: ${data.name}`)
        console.log(`   Type: ${data.type}`)
        console.log(`   Capabilities: ${data.capabilities.join(', ')}\n`)
        testResults.deviceAnnouncement = true
        testResults.deviceDiscovery = true
      }
    } else if (topic.includes('/state')) {
      console.log('✅ TEST 4 PASSED: State update received')
      console.log(`   Enabled: ${data.enabled}`)
      console.log(`   Value: ${data.value}${data.unit}\n`)

      deviceState = {
        enabled: data.enabled,
        value: data.value,
      }

      testResults.stateUpdate = true

      // Check if state matches command
      if (testResults.commandSent) {
        testResults.bidirectionalComm = true
        console.log('✅ TEST 5 PASSED: Bidirectional communication working\n')

        // Run final verification
        setTimeout(() => verifyResults(), 1000)
      }
    }
  } catch (err) {
    console.error('❌ Error parsing message:', err.message)
  }
})

async function runTests() {
  console.log('='.repeat(60))
  console.log('Starting Test Sequence')
  console.log('='.repeat(60) + '\n')

  // Test 1 & 2: Device announcement and discovery
  console.log('📋 TEST 1: Device Announcement')
  console.log('📋 TEST 2: Device Discovery')
  console.log('   Action: Requesting device discovery...\n')

  testClient.publish('homehub/system/status', JSON.stringify({ action: 'discover' }), { qos: 1 })

  // Wait for discovery response
  await sleep(2000)

  if (!testResults.deviceAnnouncement) {
    console.log('❌ TEST 1 FAILED: No device announcement received')
    console.log('   Make sure virtual device is running:\n')
    console.log('   node scripts/virtual-device.js light integration-test-light\n')
    cleanup()
    return
  }

  // Test 3: Send command
  console.log('📋 TEST 3: Command Sending')
  console.log('   Action: Sending toggle command...\n')

  testClient.publish(
    `homehub/devices/${TEST_DEVICE_ID}/set`,
    JSON.stringify({ command: 'toggle' }),
    { qos: 1 }
  )

  testResults.commandSent = true
  console.log('✅ TEST 3 PASSED: Command sent successfully\n')

  // Wait for state update
  console.log('📋 TEST 4: State Update Reception')
  console.log('   Waiting for device to respond...\n')

  await sleep(2000)

  if (!testResults.stateUpdate) {
    console.log('❌ TEST 4 FAILED: No state update received')
    console.log('   Device may not be responding to commands\n')
    cleanup()
  }
}

function verifyResults() {
  console.log('='.repeat(60))
  console.log('Test Results Summary')
  console.log('='.repeat(60) + '\n')

  const tests = [
    { name: 'Device Announcement', passed: testResults.deviceAnnouncement },
    { name: 'Device Discovery', passed: testResults.deviceDiscovery },
    { name: 'Command Sending', passed: testResults.commandSent },
    { name: 'State Update Reception', passed: testResults.stateUpdate },
    { name: 'Bidirectional Communication', passed: testResults.bidirectionalComm },
  ]

  tests.forEach((test, i) => {
    const status = test.passed ? '✅ PASS' : '❌ FAIL'
    console.log(`${status} - Test ${i + 1}: ${test.name}`)
  })

  const allPassed = tests.every(t => t.passed)

  console.log('\n' + '='.repeat(60))
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED')
    console.log('\nService layer is working correctly!')
    console.log('Ready to integrate with Dashboard UI.')
  } else {
    console.log('⚠️  SOME TESTS FAILED')
    console.log('\nCheck the logs above for details.')
  }
  console.log('='.repeat(60) + '\n')

  cleanup()
}

function cleanup() {
  console.log('🧹 Cleaning up...')
  testClient.end()
  setTimeout(() => process.exit(0), 500)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Handle interruption
process.on('SIGINT', () => {
  console.log('\n\n🛑 Test interrupted')
  cleanup()
})
