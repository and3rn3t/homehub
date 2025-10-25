/**
 * Dashboard Integration Test for HueBridgeAdapter
 *
 * Tests the complete flow from Dashboard UI to Hue device control:
 * 1. Load device from KV store
 * 2. Detect Hue protocol
 * 3. Import HueBridgeAdapter dynamically
 * 4. Toggle device state
 * 5. Verify state update
 *
 * This simulates what happens when user clicks toggle in Dashboard.
 */

console.log('🧪 Dashboard Integration Test - HueBridgeAdapter')
console.log('═'.repeat(60))

// Simulate the Dashboard toggleDevice function
async function testDashboardIntegration() {
  console.log('\n📋 Test Setup')
  console.log('─'.repeat(60))

  // Mock device (same as in MOCK_DEVICES)
  const device = {
    id: 'hue-39',
    name: "Matt's Table 2",
    type: 'light',
    room: 'Office',
    status: 'online',
    enabled: true,
    protocol: 'hue',
    value: 50,
    unit: '%',
    lastSeen: new Date(),
    signalStrength: 100,
    capabilities: ['dimming', 'color', 'color-temp'],
  }

  console.log(`Device: ${device.name}`)
  console.log(`Protocol: ${device.protocol}`)
  console.log(`Initial State: ${device.enabled ? 'ON' : 'OFF'}`)
  console.log(`Brightness: ${device.value}%`)

  // Test 1: Dynamic import
  console.log('\n🔧 Test 1: Dynamic Import')
  console.log('─'.repeat(60))

  try {
    const startTime = Date.now()
    const module = await import('../src/services/devices/HueBridgeAdapter.ts')
    const importTime = Date.now() - startTime

    console.log(`✅ HueBridgeAdapter imported successfully (${importTime}ms)`)
    console.log(`   Exports:`, Object.keys(module))

    const { HueBridgeAdapter } = module

    // Test 2: Create adapter instance
    console.log('\n🔌 Test 2: Create Adapter Instance')
    console.log('─'.repeat(60))

    const adapter = new HueBridgeAdapter({
      ip: '192.168.1.6',
      username: 'xddEM82d6i8rZDvEy0jAdXL3rA8vxmnxTSUBIhyA',
      timeout: 5000,
    })

    console.log('✅ Adapter instance created')
    console.log('   Methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(adapter)))

    // Test 3: Turn OFF
    console.log('\n🔴 Test 3: Turn OFF')
    console.log('─'.repeat(60))

    const offStartTime = Date.now()
    const offResult = await adapter.turnOff(device)
    const offDuration = Date.now() - offStartTime

    if (offResult.success) {
      console.log(`✅ Turn OFF successful (${offDuration}ms)`)
      console.log(`   New State:`, offResult.newState)
      console.log(`   Enabled: ${offResult.newState?.enabled}`)
      console.log(`   Online: ${offResult.newState?.online}`)
    } else {
      console.log(`❌ Turn OFF failed: ${offResult.error}`)
    }

    // Wait 2 seconds
    console.log('\n⏳ Waiting 2 seconds...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Test 4: Turn ON
    console.log('\n🟢 Test 4: Turn ON')
    console.log('─'.repeat(60))

    const onStartTime = Date.now()
    const onResult = await adapter.turnOn(device)
    const onDuration = Date.now() - onStartTime

    if (onResult.success) {
      console.log(`✅ Turn ON successful (${onDuration}ms)`)
      console.log(`   New State:`, onResult.newState)
      console.log(`   Enabled: ${onResult.newState?.enabled}`)
      console.log(`   Online: ${onResult.newState?.online}`)
    } else {
      console.log(`❌ Turn ON failed: ${onResult.error}`)
    }

    // Test 5: Get State
    console.log('\n📊 Test 5: Get Current State')
    console.log('─'.repeat(60))

    const stateStartTime = Date.now()
    const currentState = await adapter.getState(device)
    const stateDuration = Date.now() - stateStartTime

    console.log(`✅ State retrieved (${stateDuration}ms)`)
    console.log(`   Enabled: ${currentState.enabled}`)
    console.log(`   Brightness: ${currentState.value}%`)
    console.log(`   Online: ${currentState.online}`)
    console.log(`   Metadata:`, currentState.metadata)

    // Test 6: Set Brightness
    console.log('\n💡 Test 6: Set Brightness to 75%')
    console.log('─'.repeat(60))

    const brightnessStartTime = Date.now()
    const brightnessResult = await adapter.setBrightness(device, 75)
    const brightnessDuration = Date.now() - brightnessStartTime

    if (brightnessResult.success) {
      console.log(`✅ Set Brightness successful (${brightnessDuration}ms)`)
      console.log(`   New Brightness: ${brightnessResult.newState?.value}%`)
    } else {
      console.log(`❌ Set Brightness failed: ${brightnessResult.error}`)
    }

    // Summary
    console.log('\n' + '═'.repeat(60))
    console.log('📊 Test Summary')
    console.log('═'.repeat(60))
    console.log(`Import Time: ${importTime}ms`)
    console.log(`Turn OFF: ${offDuration}ms - ${offResult.success ? '✅' : '❌'}`)
    console.log(`Turn ON: ${onDuration}ms - ${onResult.success ? '✅' : '❌'}`)
    console.log(`Get State: ${stateDuration}ms - ✅`)
    console.log(
      `Set Brightness: ${brightnessDuration}ms - ${brightnessResult.success ? '✅' : '❌'}`
    )
    console.log('\n🎉 Dashboard integration test complete!')
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run the test
testDashboardIntegration().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
