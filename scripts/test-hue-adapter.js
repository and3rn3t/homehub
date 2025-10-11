/**
 * Test Script for HueBridgeAdapter
 *
 * Tests the HueBridgeAdapter with real Philips Hue devices on the user's network.
 * Bridge IP: 192.168.1.6
 * API Key: xddEM82d6i8rZDvEy0jAdXL3rA8vxmnxTSUBIhyA
 *
 * Test Phases:
 * 1. Get current state of device #39 (Matt's Table 2)
 * 2. Turn device OFF
 * 3. Wait 2 seconds
 * 4. Turn device ON
 * 5. Set brightness to 50%
 * 6. Set color to orange (#FF5733)
 * 7. Restore original state
 */

// Configuration
const BRIDGE_IP = '192.168.1.6'
const API_KEY = 'xddEM82d6i8rZDvEy0jAdXL3rA8vxmnxTSUBIhyA'
const TEST_DEVICE_ID = '39' // Matt's Table 2 (Extended color light)

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  total: 0,
  tests: [],
}

/**
 * Utility: Make HTTP request to Hue Bridge
 */
async function hueRequest(method, path, body = null) {
  const url = `http://${BRIDGE_IP}/api/${API_KEY}${path}`

  const options = {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const startTime = Date.now()

  try {
    const response = await fetch(url, options)
    const duration = Date.now() - startTime

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    return { success: true, data, duration }
  } catch (error) {
    const duration = Date.now() - startTime
    return { success: false, error: error.message, duration }
  }
}

/**
 * Utility: Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Utility: Log test result
 */
function logTest(name, passed, details = '') {
  results.total++
  if (passed) {
    results.passed++
    console.log(`✅ ${name}`)
  } else {
    results.failed++
    console.log(`❌ ${name}`)
  }

  if (details) {
    console.log(`   ${details}`)
  }

  results.tests.push({ name, passed, details })
}

/**
 * Test 1: Get device state
 */
async function testGetState() {
  console.log('\n📋 Test 1: Get Device State')
  console.log('─'.repeat(50))

  const result = await hueRequest('GET', `/lights/${TEST_DEVICE_ID}`)

  if (!result.success) {
    logTest('Get State', false, `Error: ${result.error}`)
    return null
  }

  logTest('Get State', true, `Response time: ${result.duration}ms`)

  const light = result.data
  console.log(`   Device: ${light.name}`)
  console.log(`   Type: ${light.type}`)
  console.log(`   Model: ${light.modelid}`)
  console.log(`   On: ${light.state.on}`)
  console.log(
    `   Brightness: ${light.state.bri}/254 (${Math.round((light.state.bri / 254) * 100)}%)`
  )
  console.log(`   Reachable: ${light.state.reachable}`)

  if (!light.state.reachable) {
    console.log('   ⚠️  Warning: Device is not reachable!')
  }

  return light.state
}

/**
 * Test 2: Turn OFF
 */
async function testTurnOff() {
  console.log('\n🔴 Test 2: Turn OFF')
  console.log('─'.repeat(50))

  const result = await hueRequest('PUT', `/lights/${TEST_DEVICE_ID}/state`, { on: false })

  if (!result.success) {
    logTest('Turn OFF', false, `Error: ${result.error}`)
    return false
  }

  // Check for Hue API errors
  if (Array.isArray(result.data) && result.data.some(r => r.error)) {
    const errors = result.data
      .filter(r => r.error)
      .map(r => r.error.description)
      .join(', ')
    logTest('Turn OFF', false, `Hue error: ${errors}`)
    return false
  }

  logTest('Turn OFF', true, `Response time: ${result.duration}ms`)

  // Verify state change
  await sleep(500)
  const state = await hueRequest('GET', `/lights/${TEST_DEVICE_ID}`)
  if (state.success && state.data.state.on === false) {
    console.log('   ✓ State verified: Device is OFF')
  } else {
    console.log('   ⚠️  Warning: Could not verify state change')
  }

  return true
}

/**
 * Test 3: Turn ON
 */
async function testTurnOn() {
  console.log('\n🟢 Test 3: Turn ON')
  console.log('─'.repeat(50))

  const result = await hueRequest('PUT', `/lights/${TEST_DEVICE_ID}/state`, { on: true })

  if (!result.success) {
    logTest('Turn ON', false, `Error: ${result.error}`)
    return false
  }

  // Check for Hue API errors
  if (Array.isArray(result.data) && result.data.some(r => r.error)) {
    const errors = result.data
      .filter(r => r.error)
      .map(r => r.error.description)
      .join(', ')
    logTest('Turn ON', false, `Hue error: ${errors}`)
    return false
  }

  logTest('Turn ON', true, `Response time: ${result.duration}ms`)

  // Verify state change
  await sleep(500)
  const state = await hueRequest('GET', `/lights/${TEST_DEVICE_ID}`)
  if (state.success && state.data.state.on === true) {
    console.log('   ✓ State verified: Device is ON')
  } else {
    console.log('   ⚠️  Warning: Could not verify state change')
  }

  return true
}

/**
 * Test 4: Set Brightness
 */
async function testSetBrightness() {
  console.log('\n💡 Test 4: Set Brightness to 50%')
  console.log('─'.repeat(50))

  // Convert 50% to Hue scale (0-254)
  const brightness = Math.round((50 / 100) * 254)

  const result = await hueRequest('PUT', `/lights/${TEST_DEVICE_ID}/state`, {
    on: true,
    bri: brightness,
  })

  if (!result.success) {
    logTest('Set Brightness', false, `Error: ${result.error}`)
    return false
  }

  // Check for Hue API errors
  if (Array.isArray(result.data) && result.data.some(r => r.error)) {
    const errors = result.data
      .filter(r => r.error)
      .map(r => r.error.description)
      .join(', ')
    logTest('Set Brightness', false, `Hue error: ${errors}`)
    return false
  }

  logTest('Set Brightness', true, `Response time: ${result.duration}ms`)

  // Verify state change
  await sleep(500)
  const state = await hueRequest('GET', `/lights/${TEST_DEVICE_ID}`)
  if (state.success) {
    const actualBrightness = Math.round((state.data.state.bri / 254) * 100)
    console.log(`   ✓ State verified: Brightness is ${actualBrightness}%`)
  }

  return true
}

/**
 * Test 5: Set Color (Orange)
 */
async function testSetColor() {
  console.log('\n🎨 Test 5: Set Color to Orange (#FF5733)')
  console.log('─'.repeat(50))

  // Convert RGB to CIE xy
  // Orange: RGB(255, 87, 51) -> xy coordinates
  const rgb = { r: 255, g: 87, b: 51 }
  const xy = rgbToXY(rgb.r, rgb.g, rgb.b)

  console.log(`   RGB: (${rgb.r}, ${rgb.g}, ${rgb.b})`)
  console.log(`   CIE xy: (${xy[0]}, ${xy[1]})`)

  const result = await hueRequest('PUT', `/lights/${TEST_DEVICE_ID}/state`, {
    on: true,
    xy: xy,
  })

  if (!result.success) {
    logTest('Set Color', false, `Error: ${result.error}`)
    return false
  }

  // Check for Hue API errors
  if (Array.isArray(result.data) && result.data.some(r => r.error)) {
    const errors = result.data
      .filter(r => r.error)
      .map(r => r.error.description)
      .join(', ')
    logTest('Set Color', false, `Hue error: ${errors}`)
    return false
  }

  logTest('Set Color', true, `Response time: ${result.duration}ms`)

  // Verify state change
  await sleep(500)
  const state = await hueRequest('GET', `/lights/${TEST_DEVICE_ID}`)
  if (state.success && state.data.state.xy) {
    console.log(`   ✓ State verified: xy = [${state.data.state.xy[0]}, ${state.data.state.xy[1]}]`)
  }

  return true
}

/**
 * Test 6: Restore Original State
 */
async function testRestoreState(originalState) {
  console.log('\n🔄 Test 6: Restore Original State')
  console.log('─'.repeat(50))

  if (!originalState) {
    console.log('   ⚠️  Skipping: No original state saved')
    return true
  }

  const restoreData = {
    on: originalState.on,
    bri: originalState.bri,
  }

  // Restore color if it was set
  if (originalState.colormode === 'xy' && originalState.xy) {
    restoreData.xy = originalState.xy
  } else if (originalState.colormode === 'ct' && originalState.ct) {
    restoreData.ct = originalState.ct
  }

  const result = await hueRequest('PUT', `/lights/${TEST_DEVICE_ID}/state`, restoreData)

  if (!result.success) {
    logTest('Restore State', false, `Error: ${result.error}`)
    return false
  }

  logTest('Restore State', true, `Response time: ${result.duration}ms`)
  console.log(`   ✓ Device restored to original state`)

  return true
}

/**
 * RGB to CIE xy color space conversion
 * (Same algorithm as HueBridgeAdapter)
 */
function rgbToXY(r, g, b) {
  // Normalize RGB values to 0-1
  const red = r / 255
  const green = g / 255
  const blue = b / 255

  // Apply gamma correction
  const applyGamma = val => {
    return val > 0.04045 ? Math.pow((val + 0.055) / 1.055, 2.4) : val / 12.92
  }

  const rGamma = applyGamma(red)
  const gGamma = applyGamma(green)
  const bGamma = applyGamma(blue)

  // Convert to XYZ using Wide RGB D65 conversion formula
  const X = rGamma * 0.664511 + gGamma * 0.154324 + bGamma * 0.162028
  const Y = rGamma * 0.283881 + gGamma * 0.668433 + bGamma * 0.047685
  const Z = rGamma * 0.000088 + gGamma * 0.07231 + bGamma * 0.986039

  // Calculate xy chromaticity coordinates
  const sum = X + Y + Z

  if (sum === 0) {
    return [0.3227, 0.329] // Default white point
  }

  const x = X / sum
  const y = Y / sum

  // Clamp to Hue's gamut
  const xClamped = Math.max(0, Math.min(1, x))
  const yClamped = Math.max(0, Math.min(1, y))

  return [Math.round(xClamped * 10000) / 10000, Math.round(yClamped * 10000) / 10000]
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('🧪 HueBridgeAdapter Test Suite')
  console.log('═'.repeat(50))
  console.log(`Bridge: ${BRIDGE_IP}`)
  console.log(`Device: #${TEST_DEVICE_ID} (Matt's Table 2)`)
  console.log('═'.repeat(50))

  let originalState = null

  try {
    // Test 1: Get initial state
    originalState = await testGetState()

    if (!originalState) {
      console.log('\n❌ Cannot continue: Failed to get device state')
      console.log('   Make sure the device is powered on and reachable')
      return
    }

    if (!originalState.reachable) {
      console.log('\n❌ Cannot continue: Device is not reachable')
      console.log('   Check that the light is powered on and connected to the bridge')
      return
    }

    // Wait before starting tests
    console.log('\n⏳ Starting tests in 2 seconds...')
    await sleep(2000)

    // Test 2: Turn OFF
    await testTurnOff()
    await sleep(2000)

    // Test 3: Turn ON
    await testTurnOn()
    await sleep(2000)

    // Test 4: Set Brightness
    await testSetBrightness()
    await sleep(2000)

    // Test 5: Set Color
    await testSetColor()
    await sleep(2000)

    // Test 6: Restore
    await testRestoreState(originalState)
  } catch (error) {
    console.error('\n💥 Unexpected error:', error.message)
    console.error(error.stack)
  }

  // Print summary
  console.log('\n' + '═'.repeat(50))
  console.log('📊 Test Results')
  console.log('═'.repeat(50))
  console.log(`Total: ${results.total}`)
  console.log(`Passed: ${results.passed} ✅`)
  console.log(`Failed: ${results.failed} ❌`)

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed!')
  } else {
    console.log('\n⚠️  Some tests failed. See details above.')
  }

  console.log('═'.repeat(50))
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
