/**
 * Enhanced Virtual MQTT Device Simulator
 *
 * Simulates smart home devices for testing HomeHub MQTT integration.
 * Supports multiple device types with realistic behaviors.
 *
 * Usage:
 *   node scripts/virtual-device.js light living-room-light
 *   node scripts/virtual-device.js thermostat main-thermostat
 *   node scripts/virtual-device.js sensor front-door-sensor
 *   node scripts/virtual-device.js plug coffee-maker
 *   node scripts/virtual-device.js switch hallway-switch
 */

import mqtt from 'mqtt'

const BROKER_URL =
  process.env.VITE_MQTT_BROKER_URL?.replace('ws:', 'mqtt:') || 'mqtt://localhost:1883'
const deviceType = process.argv[2] || 'light'
const deviceId = process.argv[3] || `virtual-${deviceType}-${Date.now()}`

console.log(`🚀 Starting virtual ${deviceType}: ${deviceId}`)
console.log(`📡 Connecting to: ${BROKER_URL}\n`)

// Device type configurations
const DEVICE_CONFIGS = {
  light: {
    name: 'Virtual Light',
    type: 'light',
    capabilities: ['toggle', 'set_value'], // set_value = brightness
    initialState: { enabled: false, value: 0 },
    unit: '%',
    minValue: 0,
    maxValue: 100,
  },
  thermostat: {
    name: 'Virtual Thermostat',
    type: 'thermostat',
    capabilities: ['toggle', 'set_value', 'set_temperature'],
    initialState: { enabled: true, value: 72 },
    unit: '°F',
    minValue: 60,
    maxValue: 85,
  },
  sensor: {
    name: 'Virtual Sensor',
    type: 'sensor',
    capabilities: ['get_state'],
    initialState: { enabled: true, value: 0 },
    unit: '',
    minValue: 0,
    maxValue: 100,
    sensorType: 'motion', // motion, temperature, humidity, door
  },
  plug: {
    name: 'Virtual Smart Plug',
    type: 'light', // Using 'light' type for compatibility with existing Dashboard
    capabilities: ['toggle', 'get_state'],
    initialState: { enabled: false, value: 0 },
    unit: 'W',
    minValue: 0,
    maxValue: 1500,
    measuresPower: true,
  },
  switch: {
    name: 'Virtual Switch',
    type: 'light', // Using 'light' type for compatibility
    capabilities: ['toggle', 'get_state'],
    initialState: { enabled: false, value: 0 },
    unit: '',
    minValue: 0,
    maxValue: 1,
  },
}

const config = DEVICE_CONFIGS[deviceType] || DEVICE_CONFIGS.light

// Device state
const state = {
  id: deviceId,
  name: `${config.name} (${deviceId})`,
  type: config.type,
  room: 'Virtual Room',
  enabled: config.initialState.enabled,
  value: config.initialState.value,
  status: 'online',
  lastSeen: new Date().toISOString(),
  batteryLevel: deviceType === 'sensor' ? 85 : undefined,
  signalStrength: 95,
  unit: config.unit,
}

// Connect to broker
const client = mqtt.connect(BROKER_URL, {
  clientId: `virtual-device-${deviceId}`,
  clean: true,
  keepalive: 60,
})

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker')

  // Subscribe to command topics
  const commandTopic = `homehub/devices/${deviceId}/set`
  const getTopic = `homehub/devices/${deviceId}/get`

  client.subscribe(commandTopic, { qos: 1 }, err => {
    if (err) {
      console.error('❌ Subscribe error (set):', err)
      process.exit(1)
    }
    console.log(`📥 Subscribed to: ${commandTopic}`)
  })

  client.subscribe(getTopic, { qos: 1 }, err => {
    if (err) {
      console.error('❌ Subscribe error (get):', err)
      process.exit(1)
    }
    console.log(`📥 Subscribed to: ${getTopic}`)
  })

  // Subscribe to system status (for discovery requests)
  client.subscribe('homehub/system/status', { qos: 1 }, err => {
    if (err) {
      console.error('❌ Subscribe error (system):', err)
    }
  })

  // Announce device on discovery topic
  announceDevice()

  // Publish initial state
  publishState()

  // Simulate realistic behavior
  startSimulation()

  console.log(`\n🎮 Device ready! Waiting for commands...`)
  console.log(`   ID: ${deviceId}`)
  console.log(`   Type: ${deviceType}`)
  console.log(`   Capabilities: ${config.capabilities.join(', ')}\n`)
})

client.on('message', (topic, payload) => {
  const message = payload.toString()

  // Handle discovery requests
  if (topic === 'homehub/system/status') {
    try {
      const request = JSON.parse(message)
      if (request.action === 'discover') {
        console.log('🔍 Discovery request received, announcing device...')
        announceDevice()
      }
    } catch (err) {
      // Ignore malformed messages
    }
    return
  }

  // Handle get state requests
  if (topic.endsWith('/get')) {
    console.log('📤 State request received')
    publishState()
    return
  }

  // Handle commands
  console.log(`📨 Received command: ${message}`)

  try {
    const command = JSON.parse(message)

    // Handle different command types
    switch (command.command) {
      case 'toggle':
        state.enabled = !state.enabled
        console.log(`🔄 Toggled ${state.enabled ? 'ON' : 'OFF'}`)

        // Simulate power consumption for plugs
        if (config.measuresPower) {
          state.value = state.enabled ? Math.floor(Math.random() * 500) + 50 : 0
        }
        break

      case 'set_value':
        if (command.value !== undefined) {
          state.value = Math.max(config.minValue, Math.min(config.maxValue, Number(command.value)))
          state.enabled = state.value > 0
          console.log(`🎚️  Set value to ${state.value}${config.unit}`)
        }
        break

      case 'set_temperature':
        if (command.value !== undefined) {
          state.value = Math.max(config.minValue, Math.min(config.maxValue, Number(command.value)))
          console.log(`🌡️  Set temperature to ${state.value}${config.unit}`)
        }
        break

      case 'get_state':
        console.log('📋 Get state command (will publish current state)')
        break

      default:
        console.log(`⚠️  Unknown command: ${command.command}`)
        return
    }

    // Update last seen
    state.lastSeen = new Date().toISOString()

    // Publish updated state immediately
    publishState()
  } catch (error) {
    console.error('❌ Error processing command:', error.message)
  }
})

client.on('error', error => {
  console.error('❌ Connection error:', error)
  process.exit(1)
})

client.on('disconnect', () => {
  console.log('🔌 Disconnected from broker')
})

client.on('offline', () => {
  console.log('📡 Client offline')
})

client.on('reconnect', () => {
  console.log('🔄 Reconnecting to broker...')
})

/**
 * Publish current device state
 */
function publishState() {
  const stateTopic = `homehub/devices/${deviceId}/state`
  client.publish(stateTopic, JSON.stringify(state), { qos: 1 }, err => {
    if (err) {
      console.error('❌ Publish error:', err)
    } else {
      console.log(
        `✅ Published state: ${state.enabled ? 'ON' : 'OFF'}, value: ${state.value}${config.unit}`
      )
    }
  })
}

/**
 * Announce device for discovery
 */
function announceDevice() {
  const announcement = {
    id: deviceId,
    name: state.name,
    type: config.type,
    protocol: 'mqtt',
    capabilities: config.capabilities,
    metadata: {
      unit: config.unit,
      minValue: config.minValue,
      maxValue: config.maxValue,
      room: state.room,
    },
  }

  client.publish('homehub/discovery/announce', JSON.stringify(announcement), { qos: 1 }, err => {
    if (err) {
      console.error('❌ Announcement error:', err)
    } else {
      console.log('📢 Device announced for discovery')
    }
  })
}

/**
 * Simulate realistic device behavior
 */
function startSimulation() {
  // Publish state every 30 seconds (heartbeat)
  setInterval(() => {
    state.lastSeen = new Date().toISOString()

    // Simulate sensor readings
    if (deviceType === 'sensor') {
      if (config.sensorType === 'motion') {
        // Random motion detection
        state.value = Math.random() > 0.9 ? 1 : 0
      } else {
        // Simulate gradual changes
        state.value = Math.max(
          config.minValue,
          Math.min(config.maxValue, state.value + (Math.random() - 0.5) * 2)
        )
      }
    }

    // Simulate thermostat temperature fluctuation
    if (deviceType === 'thermostat' && state.enabled) {
      const drift = (Math.random() - 0.5) * 0.5
      state.value = Math.max(config.minValue, Math.min(config.maxValue, state.value + drift))
    }

    // Simulate power consumption fluctuation for plugs
    if (config.measuresPower && state.enabled) {
      const fluctuation = (Math.random() - 0.5) * 20
      state.value = Math.max(0, state.value + fluctuation)
    }

    // Simulate signal strength variation
    state.signalStrength = Math.max(
      70,
      Math.min(100, state.signalStrength + (Math.random() - 0.5) * 5)
    )

    // Simulate battery drain for sensors
    if (state.batteryLevel !== undefined) {
      state.batteryLevel = Math.max(0, state.batteryLevel - 0.01)
    }

    publishState()
  }, 30000) // Every 30 seconds
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down...')
  state.status = 'offline'
  publishState()

  setTimeout(() => {
    client.end()
    console.log('👋 Device stopped')
    process.exit(0)
  }, 500)
})

// Handle uncaught errors
process.on('uncaughtException', error => {
  console.error('❌ Uncaught exception:', error)
  process.exit(1)
})
