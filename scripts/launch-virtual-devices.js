/**
 * Multi-Device Virtual MQTT Device Launcher
 *
 * Spawns multiple virtual devices simultaneously for comprehensive testing.
 * Simulates a complete smart home ecosystem.
 *
 * Usage:
 *   node scripts/launch-virtual-devices.js
 *   node scripts/launch-virtual-devices.js --count 5 --type light
 *   node scripts/launch-virtual-devices.js --preset full-house
 */

import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Parse command-line arguments
const args = process.argv.slice(2)
const options = {
  count: 3,
  type: null,
  preset: 'default',
}

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--count' && args[i + 1]) {
    options.count = parseInt(args[i + 1], 10)
    i++
  } else if (args[i] === '--type' && args[i + 1]) {
    options.type = args[i + 1]
    i++
  } else if (args[i] === '--preset' && args[i + 1]) {
    options.preset = args[i + 1]
    i++
  }
}

// Device presets
const PRESETS = {
  default: [
    { type: 'light', id: 'living-room-light' },
    { type: 'light', id: 'bedroom-light' },
    { type: 'thermostat', id: 'main-thermostat' },
  ],
  'full-house': [
    // Living Room
    { type: 'light', id: 'living-room-ceiling' },
    { type: 'light', id: 'living-room-lamp' },
    { type: 'plug', id: 'living-room-tv-plug' },
    { type: 'sensor', id: 'living-room-motion' },

    // Kitchen
    { type: 'light', id: 'kitchen-ceiling' },
    { type: 'light', id: 'kitchen-under-cabinet' },
    { type: 'plug', id: 'kitchen-coffee-maker' },

    // Bedroom
    { type: 'light', id: 'bedroom-ceiling' },
    { type: 'light', id: 'bedroom-nightstand' },
    { type: 'switch', id: 'bedroom-fan-switch' },
    { type: 'sensor', id: 'bedroom-door' },

    // Bathroom
    { type: 'light', id: 'bathroom-ceiling' },
    { type: 'sensor', id: 'bathroom-motion' },

    // Hallway
    { type: 'light', id: 'hallway-ceiling' },
    { type: 'switch', id: 'hallway-3way-switch' },

    // HVAC
    { type: 'thermostat', id: 'main-thermostat' },
    { type: 'thermostat', id: 'upstairs-thermostat' },

    // Outdoor
    { type: 'light', id: 'front-porch-light' },
    { type: 'light', id: 'back-patio-light' },
    { type: 'sensor', id: 'front-door-sensor' },
  ],
  minimal: [
    { type: 'light', id: 'test-light-1' },
    { type: 'sensor', id: 'test-sensor-1' },
  ],
  stress: Array.from({ length: 20 }, (_, i) => ({
    type: ['light', 'sensor', 'plug', 'switch'][i % 4],
    id: `stress-device-${i + 1}`,
  })),
}

// Determine which devices to launch
let devices = []
if (options.type) {
  // Launch multiple devices of same type
  devices = Array.from({ length: options.count }, (_, i) => ({
    type: options.type,
    id: `${options.type}-${i + 1}`,
  }))
} else {
  // Use preset
  devices = PRESETS[options.preset] || PRESETS.default
}

console.log(`🚀 Launching Virtual Device Ecosystem`)
console.log(`   Preset: ${options.preset}`)
console.log(`   Devices: ${devices.length}`)
console.log(``)

// Track spawned processes
const processes = []

// Spawn each device
devices.forEach((device, index) => {
  setTimeout(() => {
    const virtualDeviceScript = path.join(__dirname, 'virtual-device.js')

    const child = spawn('node', [virtualDeviceScript, device.type, device.id], {
      stdio: 'inherit',
      shell: true,
    })

    child.on('error', error => {
      console.error(`❌ Failed to start ${device.id}:`, error.message)
    })

    child.on('exit', code => {
      if (code !== 0) {
        console.log(`⚠️  Device ${device.id} exited with code ${code}`)
      }
      // Remove from process list
      const idx = processes.indexOf(child)
      if (idx > -1) processes.splice(idx, 1)

      // If all processes have exited, exit launcher
      if (processes.length === 0) {
        console.log('\n✅ All devices stopped')
        process.exit(0)
      }
    })

    processes.push(child)
    console.log(`✓ Started ${device.type}: ${device.id}`)
  }, index * 500) // Stagger startup by 500ms
})

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down all devices...')

  processes.forEach(child => {
    child.kill('SIGINT')
  })

  // Force exit after 3 seconds if processes don't terminate
  setTimeout(() => {
    console.log('⏰ Force stopping remaining processes...')
    processes.forEach(child => {
      child.kill('SIGKILL')
    })
    process.exit(0)
  }, 3000)
})

// Show help message after startup
setTimeout(
  () => {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`✅ All devices launched successfully!`)
    console.log(``)
    console.log(`🎮 Test Commands:`)
    console.log(`   - Send commands via Dashboard UI`)
    console.log(`   - Use MQTT client to publish to topics`)
    console.log(`   - Monitor state updates in real-time`)
    console.log(``)
    console.log(`📋 Available Presets:`)
    console.log(`   --preset default      3 devices (2 lights, 1 thermostat)`)
    console.log(`   --preset full-house   20 devices (complete smart home)`)
    console.log(`   --preset minimal      2 devices (quick testing)`)
    console.log(`   --preset stress       20 devices (load testing)`)
    console.log(``)
    console.log(`⚡ Custom Launch:`)
    console.log(`   --type light --count 5   Launch 5 light devices`)
    console.log(`   --type sensor --count 3  Launch 3 sensor devices`)
    console.log(``)
    console.log(`Press Ctrl+C to stop all devices`)
    console.log(`${'='.repeat(60)}\n`)
  },
  devices.length * 500 + 1000
)
