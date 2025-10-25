#!/usr/bin/env node

/**
 * Launch Multiple Virtual HTTP Devices
 *
 * Starts multiple virtual HTTP devices for testing multi-protocol scenarios.
 *
 * Usage:
 *   node scripts/launch-http-devices.js --preset full-house
 *   node scripts/launch-http-devices.js --preset shelly-only
 *   node scripts/launch-http-devices.js --count 3 --preset generic
 */

import { VirtualHTTPDevice } from './http-virtual-device.js'

/**
 * Device presets
 */
const PRESETS = {
  'full-house': [
    { port: 8001, name: 'Living Room Light', type: 'light', preset: 'shelly', deviceId: '0' },
    { port: 8002, name: 'Bedroom Light', type: 'light', preset: 'shelly', deviceId: '0' },
    { port: 8003, name: 'Kitchen Light', type: 'light', preset: 'tplink', deviceId: '1' },
    { port: 8004, name: 'Bathroom Light', type: 'light', preset: 'hue', deviceId: '1' },
    { port: 8005, name: 'Office Light', type: 'light', preset: 'generic', deviceId: '1' },
  ],
  'shelly-only': [
    { port: 8001, name: 'Shelly Light 1', type: 'light', preset: 'shelly', deviceId: '0' },
    { port: 8002, name: 'Shelly Light 2', type: 'light', preset: 'shelly', deviceId: '0' },
    { port: 8003, name: 'Shelly Light 3', type: 'light', preset: 'shelly', deviceId: '0' },
  ],
  'tplink-only': [
    { port: 8001, name: 'TPLink Light 1', type: 'light', preset: 'tplink', deviceId: '1' },
    { port: 8002, name: 'TPLink Light 2', type: 'light', preset: 'tplink', deviceId: '1' },
    { port: 8003, name: 'TPLink Light 3', type: 'light', preset: 'tplink', deviceId: '1' },
  ],
  'hue-only': [
    { port: 8001, name: 'Hue Light 1', type: 'light', preset: 'hue', deviceId: '1' },
    { port: 8002, name: 'Hue Light 2', type: 'light', preset: 'hue', deviceId: '2' },
    { port: 8003, name: 'Hue Light 3', type: 'light', preset: 'hue', deviceId: '3' },
  ],
  'generic-only': [
    { port: 8001, name: 'Generic Light 1', type: 'light', preset: 'generic', deviceId: '1' },
    { port: 8002, name: 'Generic Light 2', type: 'light', preset: 'generic', deviceId: '2' },
    { port: 8003, name: 'Generic Light 3', type: 'light', preset: 'generic', deviceId: '3' },
  ],
  'mixed-types': [
    { port: 8001, name: 'Living Room Light', type: 'light', preset: 'shelly', deviceId: '0' },
    { port: 8002, name: 'Thermostat', type: 'thermostat', preset: 'generic', deviceId: '1' },
    { port: 8003, name: 'Smart Switch', type: 'switch', preset: 'generic', deviceId: '2' },
  ],
}

/**
 * Launch devices
 */
async function launchDevices(configs) {
  const devices = []

  console.log(`\n🚀 Launching ${configs.length} virtual HTTP devices...\n`)

  for (const config of configs) {
    const device = new VirtualHTTPDevice(config)
    try {
      await device.start()
      devices.push(device)
      // Small delay to avoid port conflicts
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`Failed to start device ${config.name}:`, error.message)
    }
  }

  console.log(`\n✅ All devices started! (${devices.length}/${configs.length})`)
  console.log(`\n📋 Device URLs:`)
  configs.forEach((config, i) => {
    console.log(`   ${i + 1}. ${config.name}: http://localhost:${config.port}`)
  })

  console.log(`\n💡 Test commands:`)
  console.log(`   # List Shelly device info`)
  console.log(`   curl http://localhost:8001/shelly`)
  console.log(`\n   # Get Shelly switch status`)
  console.log(`   curl http://localhost:8001/rpc/Switch.GetStatus?id=0`)
  console.log(`\n   # Toggle Shelly switch`)
  console.log(`   curl -X POST http://localhost:8001/rpc/Switch.Toggle?id=0`)
  console.log(`\n   # Set Shelly switch on`)
  console.log(`   curl -X POST http://localhost:8001/rpc/Switch.Set?id=0&on=true`)

  console.log(`\n⏹️  Press Ctrl+C to stop all devices\n`)

  return devices
}

/**
 * Parse CLI arguments
 */
function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    preset: 'full-house',
    count: null,
  }

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '')
    const value = args[i + 1]
    options[key] = isNaN(value) ? value : parseInt(value)
  }

  return options
}

/**
 * Main
 */
async function main() {
  const options = parseArgs()

  let configs = []

  if (options.preset && PRESETS[options.preset]) {
    configs = PRESETS[options.preset]
    console.log(`Using preset: ${options.preset}`)
  } else if (options.count) {
    // Generate generic devices
    for (let i = 0; i < options.count; i++) {
      configs.push({
        port: 8001 + i,
        name: `Device ${i + 1}`,
        type: 'light',
        preset: 'generic',
        deviceId: `${i + 1}`,
      })
    }
  } else {
    console.log(`\n❌ Invalid preset: ${options.preset}`)
    console.log(`\nAvailable presets:`)
    Object.keys(PRESETS).forEach(name => {
      console.log(`   - ${name}`)
    })
    console.log(`\nUsage:`)
    console.log(`   node scripts/launch-http-devices.js --preset full-house`)
    console.log(`   node scripts/launch-http-devices.js --count 5`)
    process.exit(1)
  }

  const devices = await launchDevices(configs)

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down all devices...')
    for (const device of devices) {
      await device.stop()
    }
    console.log('✅ All devices stopped')
    process.exit(0)
  })
}

// Run
main().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})

export { launchDevices, PRESETS }
