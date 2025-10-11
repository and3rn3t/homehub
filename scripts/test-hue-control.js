#!/usr/bin/env node

/**
 * Test Hue Bridge Control
 * 
 * Quick test to verify we can control Hue lights
 */

const BRIDGE_IP = '192.168.1.6'
const API_KEY = 'xddEM82d6i8rZDvEy0jAdXL3rA8vxmnxTSUBIhyA'

console.log('🧪 Testing Hue Bridge Control\n')
console.log(`Bridge: ${BRIDGE_IP}`)
console.log(`API Key: ${API_KEY}\n`)

async function testControl() {
  try {
    // Step 1: Get list of lights
    console.log('Step 1: Getting lights list...')
    const lightsResponse = await fetch(`http://${BRIDGE_IP}/api/${API_KEY}/lights`)
    
    if (!lightsResponse.ok) {
      console.error('❌ Failed to get lights:', lightsResponse.status)
      return
    }

    const lights = await lightsResponse.json()
    
    if (lights[0]?.error) {
      console.error('❌ API Error:', lights[0].error)
      return
    }

    const lightIds = Object.keys(lights)
    console.log(`✅ Found ${lightIds.length} lights`)
    
    if (lightIds.length === 0) {
      console.log('No lights to test')
      return
    }

    // Pick first light for testing
    const testLightId = lightIds[0]
    const testLight = lights[testLightId]
    console.log(`\n🔦 Testing with: ${testLight.name} (ID: ${testLightId})`)
    console.log(`   Current state: ${testLight.state.on ? 'ON' : 'OFF'}`)
    console.log(`   Brightness: ${testLight.state.bri} (${Math.round((testLight.state.bri / 254) * 100)}%)`)
    console.log(`   Reachable: ${testLight.state.reachable ? '✅' : '❌'}\n`)

    if (!testLight.state.reachable) {
      console.log('⚠️  Light is not reachable, skipping control test')
      return
    }

    // Step 2: Turn light ON
    console.log('Step 2: Turning light ON...')
    const turnOnResponse = await fetch(
      `http://${BRIDGE_IP}/api/${API_KEY}/lights/${testLightId}/state`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on: true, bri: 254 }),
      }
    )

    const turnOnResult = await turnOnResponse.json()
    console.log('Response:', JSON.stringify(turnOnResult, null, 2))

    if (turnOnResult[0]?.error) {
      console.error('❌ Turn ON failed:', turnOnResult[0].error)
      return
    }

    console.log('✅ Light turned ON')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Step 3: Set to 50% brightness
    console.log('\nStep 3: Setting brightness to 50%...')
    const dimResponse = await fetch(
      `http://${BRIDGE_IP}/api/${API_KEY}/lights/${testLightId}/state`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bri: 127 }),
      }
    )

    const dimResult = await dimResponse.json()
    console.log('Response:', JSON.stringify(dimResult, null, 2))

    if (dimResult[0]?.error) {
      console.error('❌ Brightness change failed:', dimResult[0].error)
      return
    }

    console.log('✅ Brightness set to 50%')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Step 4: Turn light OFF
    console.log('\nStep 4: Turning light OFF...')
    const turnOffResponse = await fetch(
      `http://${BRIDGE_IP}/api/${API_KEY}/lights/${testLightId}/state`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on: false }),
      }
    )

    const turnOffResult = await turnOffResponse.json()
    console.log('Response:', JSON.stringify(turnOffResult, null, 2))

    if (turnOffResult[0]?.error) {
      console.error('❌ Turn OFF failed:', turnOffResult[0].error)
      return
    }

    console.log('✅ Light turned OFF')

    // Step 5: Verify state
    console.log('\nStep 5: Verifying final state...')
    const finalStateResponse = await fetch(`http://${BRIDGE_IP}/api/${API_KEY}/lights/${testLightId}`)
    const finalState = await finalStateResponse.json()

    console.log(`Final state: ${finalState.state.on ? 'ON' : 'OFF'}`)
    console.log(`Brightness: ${finalState.state.bri} (${Math.round((finalState.state.bri / 254) * 100)}%)`)

    console.log('\n✅ All tests passed!')
    console.log('\n📊 Summary:')
    console.log('   ✅ API key is valid')
    console.log('   ✅ Can read light state')
    console.log('   ✅ Can turn lights on/off')
    console.log('   ✅ Can adjust brightness')
    console.log('\n💡 Your Hue integration is working correctly!')

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error('\nPossible issues:')
    console.error('  1. Bridge is not reachable at', BRIDGE_IP)
    console.error('  2. API key is invalid')
    console.error('  3. Network connectivity issue')
  }
}

testControl()
