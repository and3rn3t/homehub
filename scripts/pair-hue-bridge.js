#!/usr/bin/env node

/**
 * Philips Hue Bridge Pairing Script
 *
 * Interactive script to pair with your Hue bridge and discover lights.
 * Guides you through:
 * 1. Pressing the physical button on the bridge
 * 2. Obtaining an API key
 * 3. Discovering all connected lights
 * 4. Saving configuration for HomeHub
 */

import * as readline from 'readline'

const BRIDGE_IP = '192.168.1.6'
const CONFIG_FILE = './data/hue-config.json'

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function prompt(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer)
    })
  })
}

console.log('🌈 Philips Hue Bridge Pairing Script')
console.log('═'.repeat(60))
console.log(`\nBridge IP: ${BRIDGE_IP}`)
console.log('Bridge Name: Hue Hub\n')

// Step 1: Verify bridge is reachable
async function verifyBridge() {
  console.log('Step 1: Verifying bridge connection...')

  try {
    const response = await fetch(`http://${BRIDGE_IP}/api/config`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    })

    if (!response.ok) {
      console.error('❌ Bridge not reachable')
      return false
    }

    const config = await response.json()
    console.log('✅ Bridge connected!')
    console.log(`   Name: ${config.name}`)
    console.log(`   Model: ${config.modelid}`)
    console.log(`   Bridge ID: ${config.bridgeid}`)
    console.log(`   Firmware: ${config.swversion}\n`)

    return true
  } catch (error) {
    console.error(`❌ Connection failed: ${error.message}`)
    return false
  }
}

// Step 2: Create API user (requires button press)
async function createUser() {
  console.log('Step 2: Creating API user...')
  console.log('\n⚠️  IMPORTANT: Press the button on your Hue bridge NOW!')
  console.log('   You have 30 seconds after pressing the button.\n')

  const ready = await prompt('Have you pressed the button? (yes/no): ')

  if (ready.toLowerCase() !== 'yes' && ready.toLowerCase() !== 'y') {
    console.log('\n❌ Pairing cancelled. Run this script again when ready.')
    return null
  }

  console.log('\n🔄 Attempting to pair...')

  try {
    const response = await fetch(`http://${BRIDGE_IP}/api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        devicetype: 'homehub#desktop',
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      console.error('❌ API request failed')
      return null
    }

    const result = await response.json()

    if (result[0]?.error) {
      const error = result[0].error
      if (error.type === 101) {
        console.error('\n❌ Link button not pressed!')
        console.error('   Press the button on the bridge and try again.')
      } else {
        console.error(`\n❌ Error: ${error.description}`)
      }
      return null
    }

    if (result[0]?.success) {
      const username = result[0].success.username
      console.log('\n✅ Pairing successful!')
      console.log(`   API Key: ${username}\n`)
      return username
    }

    console.error('❌ Unexpected response:', result)
    return null
  } catch (error) {
    console.error(`\n❌ Pairing failed: ${error.message}`)
    return null
  }
}

// Step 3: Discover lights
async function discoverLights(apiKey) {
  console.log('Step 3: Discovering lights...')

  try {
    const response = await fetch(`http://${BRIDGE_IP}/api/${apiKey}/lights`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      console.error('❌ Failed to get lights')
      return null
    }

    const lights = await response.json()

    if (lights[0]?.error) {
      console.error(`❌ Error: ${lights[0].error.description}`)
      return null
    }

    const lightCount = Object.keys(lights).length
    console.log(`\n✅ Found ${lightCount} light(s)!\n`)

    // Display lights
    console.log('Connected Lights:')
    console.log('─'.repeat(60))

    for (const [id, light] of Object.entries(lights)) {
      console.log(`\n💡 ${light.name}`)
      console.log(`   ID: ${id}`)
      console.log(`   Type: ${light.type}`)
      console.log(`   Model: ${light.modelid}`)
      console.log(`   Manufacturer: ${light.manufacturername}`)
      console.log(`   SW Version: ${light.swversion}`)
      console.log(`   Reachable: ${light.state.reachable ? '✅ Yes' : '❌ No'}`)
      console.log(`   On: ${light.state.on ? '✅ Yes' : '❌ No'}`)

      if (light.state.bri !== undefined) {
        console.log(`   Brightness: ${Math.round((light.state.bri / 254) * 100)}%`)
      }

      if (light.capabilities?.control?.colorgamuttype) {
        console.log(`   Color Gamut: ${light.capabilities.control.colorgamuttype}`)
      }
    }

    return lights
  } catch (error) {
    console.error(`\n❌ Discovery failed: ${error.message}`)
    return null
  }
}

// Step 4: Test light control
async function testLightControl(apiKey, lights) {
  const lightIds = Object.keys(lights)

  if (lightIds.length === 0) {
    console.log('\n⚠️  No lights to test')
    return
  }

  console.log('\n\nStep 4: Test light control (optional)')
  console.log('─'.repeat(60))

  const testLight = await prompt(`\nWould you like to test controlling a light? (yes/no): `)

  if (testLight.toLowerCase() !== 'yes' && testLight.toLowerCase() !== 'y') {
    console.log('Skipping light control test.')
    return
  }

  // Pick first light
  const testId = lightIds[0]
  const lightName = lights[testId].name

  console.log(`\n🧪 Testing light: ${lightName}`)

  try {
    // Turn on
    console.log('\n   Turning ON...')
    await fetch(`http://${BRIDGE_IP}/api/${apiKey}/lights/${testId}/state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ on: true, bri: 254 }),
    })
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Set to red
    console.log('   Setting to RED...')
    await fetch(`http://${BRIDGE_IP}/api/${apiKey}/lights/${testId}/state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hue: 0, sat: 254, bri: 254 }),
    })
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Set to green
    console.log('   Setting to GREEN...')
    await fetch(`http://${BRIDGE_IP}/api/${apiKey}/lights/${testId}/state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hue: 25500, sat: 254, bri: 254 }),
    })
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Set to blue
    console.log('   Setting to BLUE...')
    await fetch(`http://${BRIDGE_IP}/api/${apiKey}/lights/${testId}/state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hue: 46920, sat: 254, bri: 254 }),
    })
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Turn off
    console.log('   Turning OFF...')
    await fetch(`http://${BRIDGE_IP}/api/${apiKey}/lights/${testId}/state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ on: false }),
    })

    console.log('\n✅ Light control test successful!')
  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`)
  }
}

// Step 5: Save configuration
async function saveConfiguration(apiKey, lights) {
  console.log('\n\nStep 5: Saving configuration...')

  const fs = await import('fs')
  const path = await import('path')

  const config = {
    bridge: {
      ip: BRIDGE_IP,
      apiKey: apiKey,
      name: 'Hue Hub',
      bridgeId: '001788FFFE22BD54',
    },
    lights: lights,
    savedAt: new Date().toISOString(),
  }

  try {
    // Ensure data directory exists
    const dir = path.dirname(CONFIG_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Write config
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))

    console.log(`✅ Configuration saved to ${CONFIG_FILE}`)
    console.log('\n📋 Configuration Summary:')
    console.log(`   Bridge IP: ${BRIDGE_IP}`)
    console.log(`   API Key: ${apiKey}`)
    console.log(`   Lights: ${Object.keys(lights).length}`)
  } catch (error) {
    console.error(`❌ Failed to save configuration: ${error.message}`)
  }
}

// Step 6: Next steps
function showNextSteps() {
  console.log('\n\n' + '═'.repeat(60))
  console.log('🎉 SETUP COMPLETE!')
  console.log('═'.repeat(60))

  console.log('\n📝 Next Steps:')
  console.log('\n1. Start the HomeHub development server:')
  console.log('   npm run dev')

  console.log('\n2. Open DeviceDiscovery dialog in the app')

  console.log('\n3. Click "Start Scan" to discover your Hue bridge')

  console.log('\n4. Add the discovered bridge to HomeHub')

  console.log('\n5. Control your Hue lights from the dashboard!')

  console.log('\n💡 Configuration file: ' + CONFIG_FILE)
  console.log('   This file contains your API key and light data.')
  console.log('   Keep it safe and do not commit it to version control!')

  console.log('\n🔗 Useful commands:')
  console.log('   node scripts/test-hue-adapter.js     - Test Hue adapter')
  console.log('   node scripts/import-hue-devices.js   - Import lights to HomeHub')
  console.log('   node scripts/check-devices.js        - Verify device data')

  console.log('\n')
}

// Main execution
async function main() {
  try {
    // Step 1: Verify bridge
    const bridgeOk = await verifyBridge()
    if (!bridgeOk) {
      console.log('\n❌ Cannot proceed without bridge connection.')
      rl.close()
      return
    }

    // Step 2: Create user
    const apiKey = await createUser()
    if (!apiKey) {
      console.log('\n❌ Pairing failed. Please try again.')
      rl.close()
      return
    }

    // Step 3: Discover lights
    const lights = await discoverLights(apiKey)
    if (!lights) {
      console.log('\n❌ Could not discover lights.')
      rl.close()
      return
    }

    // Step 4: Test control (optional)
    await testLightControl(apiKey, lights)

    // Step 5: Save configuration
    await saveConfiguration(apiKey, lights)

    // Step 6: Show next steps
    showNextSteps()

    rl.close()
  } catch (error) {
    console.error('\n❌ Script failed:', error.message)
    rl.close()
    process.exit(1)
  }
}

main()
