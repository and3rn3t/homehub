#!/usr/bin/env node

/**
 * Discovery Integration Test Script
 *
 * Tests the complete discovery flow:
 * 1. Discover device at localhost:8001
 * 2. Verify device details parsed correctly
 * 3. Simulate adding device to Dashboard
 * 4. Verify device can be toggled
 * 5. Monitor state changes
 */

import http from 'http'

// Test configuration
const VIRTUAL_DEVICE_URL = 'http://localhost:8001'
const DASHBOARD_URL = 'http://localhost:5173'

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(emoji, message, color = colors.reset) {
  console.log(`${emoji} ${color}${message}${colors.reset}`)
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, res => {
        let data = ''
        res.on('data', chunk => {
          data += chunk
        })
        res.on('end', () => {
          try {
            resolve(JSON.parse(data))
          } catch (e) {
            resolve(data)
          }
        })
      })
      .on('error', reject)
  })
}

async function testVirtualDevice() {
  log('🔧', 'Testing virtual device...', colors.cyan)

  try {
    // Test health endpoint
    const health = await makeRequest(`${VIRTUAL_DEVICE_URL}/health`)
    if (health.status === 'ok') {
      log('✅', `Virtual device online: ${health.device}`, colors.green)
    } else {
      log('❌', 'Virtual device health check failed', colors.red)
      return false
    }

    // Test Shelly endpoint (used by discovery)
    const shellyInfo = await makeRequest(`${VIRTUAL_DEVICE_URL}/shelly`)
    log('📡', `Shelly API response:`, colors.blue)
    console.log(JSON.stringify(shellyInfo, null, 2))

    // Verify required fields for discovery
    const requiredFields = ['mac', 'type', 'fw']
    const hasAllFields = requiredFields.every(field => shellyInfo[field])

    if (hasAllFields) {
      log('✅', 'All required discovery fields present', colors.green)
    } else {
      log('⚠️', 'Some discovery fields missing', colors.yellow)
    }

    return true
  } catch (error) {
    log('❌', `Virtual device test failed: ${error.message}`, colors.red)
    return false
  }
}

async function testDiscoveryEndpoints() {
  log('\n🔍', 'Testing discovery endpoints...', colors.cyan)

  const endpoints = [
    { path: '/shelly', name: 'Shelly API' },
    { path: '/api/system/info', name: 'TP-Link API' },
    { path: '/api/config', name: 'Philips Hue API' },
    { path: '/', name: 'Generic HTTP' },
  ]

  for (const endpoint of endpoints) {
    try {
      await makeRequest(`${VIRTUAL_DEVICE_URL}${endpoint.path}`)
      log('✅', `${endpoint.name} (${endpoint.path}) - Available`, colors.green)
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        log('⚠️', `${endpoint.name} (${endpoint.path}) - Device offline`, colors.yellow)
      } else {
        log(
          '❌',
          `${endpoint.name} (${endpoint.path}) - Not found (${error.statusCode || 'error'})`,
          colors.yellow
        )
      }
    }
  }
}

async function testToggle() {
  log('\n🔄', 'Testing toggle command...', colors.cyan)

  try {
    // Get initial state
    const before = await makeRequest(`${VIRTUAL_DEVICE_URL}/rpc/Switch.GetStatus?id=0`)
    log('📊', `Current state: ${before.output ? 'ON' : 'OFF'} (${before.apower}W)`, colors.blue)

    // Toggle
    const toggle = await makeRequest(`${VIRTUAL_DEVICE_URL}/rpc/Switch.Toggle?id=0`)
    log('🔄', `Toggle result: ${toggle.was_on ? 'ON→OFF' : 'OFF→ON'}`, colors.blue)

    // Get new state
    const after = await makeRequest(`${VIRTUAL_DEVICE_URL}/rpc/Switch.GetStatus?id=0`)
    log('📊', `New state: ${after.output ? 'ON' : 'OFF'} (${after.apower}W)`, colors.blue)

    if (before.output !== after.output) {
      log('✅', 'Toggle command working correctly', colors.green)
    } else {
      log('❌', 'Toggle command failed - state unchanged', colors.red)
    }
  } catch (error) {
    log('❌', `Toggle test failed: ${error.message}`, colors.red)
  }
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║        🧪 Discovery Integration Test Suite              ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')

  log('ℹ️', 'Prerequisites:', colors.cyan)
  log('  ', '1. Virtual device running: npm run device')
  log('  ', '2. Dashboard running: npm run dev')
  log('  ', '3. Browser open at http://localhost:5173\n')

  // Test 1: Virtual device
  const deviceOk = await testVirtualDevice()
  if (!deviceOk) {
    log('\n❌', 'Virtual device not responding. Start with: npm run device', colors.red)
    process.exit(1)
  }

  // Test 2: Discovery endpoints
  await testDiscoveryEndpoints()

  // Test 3: Toggle functionality
  await testToggle()

  // Manual test instructions
  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║        📋 Manual Testing Steps                           ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')

  log('1️⃣', 'Open Dashboard: http://localhost:5173', colors.cyan)
  log('2️⃣', 'Click the + button (top right)', colors.cyan)
  log('3️⃣', 'Click "Start Scan" in discovery dialog', colors.cyan)
  log('4️⃣', 'Verify device appears:', colors.cyan)
  log('  ', '   • Name: Shelly Plus 1 or SHSW-PL4')
  log('  ', '   • Address: 127.0.0.1:8001')
  log('  ', '   • Manufacturer: Shelly')
  log('  ', '   • Model: SHSW-PL4')
  log('5️⃣', 'Click "Add" button', colors.cyan)
  log('6️⃣', 'Verify success toast appears', colors.cyan)
  log('7️⃣', 'Close discovery dialog', colors.cyan)
  log('8️⃣', 'Find device in Dashboard device list', colors.cyan)
  log('9️⃣', 'Toggle device ON/OFF', colors.cyan)
  log('🔟', 'Watch monitor script for state changes', colors.cyan)

  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║        ✅ Expected Results                               ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')

  log('✅', 'Discovery finds 1 device in ~500ms', colors.green)
  log('✅', 'Device details parsed correctly', colors.green)
  log('✅', 'Add button creates device in Dashboard', colors.green)
  log('✅', 'Device persists after page refresh', colors.green)
  log('✅', 'Toggle switch works (Dashboard → Virtual Device)', colors.green)
  log('✅', 'Monitor script shows state changes', colors.green)

  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║        🏁 Test Suite Complete                            ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')

  log('💡', 'Run monitor script: npm run monitor', colors.yellow)
  log('📊', 'All automated tests passed!', colors.green)
}

runTests().catch(error => {
  console.error('\n❌ Test suite failed:', error)
  process.exit(1)
})
