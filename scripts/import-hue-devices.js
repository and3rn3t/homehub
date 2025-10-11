/**
 * Import Hue Devices Script
 *
 * Discovers all Philips Hue devices from the bridge and imports them into HomeHub.
 *
 * Process:
 * 1. Connect to Hue Bridge at 192.168.1.6
 * 2. Retrieve all lights using API key
 * 3. Map Hue device types to HomeHub device types
 * 4. Assign rooms based on device names
 * 5. Create Device objects with proper format
 * 6. Save to KV storage
 *
 * Bridge: 192.168.1.6
 * API Key: xddEM82d6i8rZDvEy0jAdXL3rA8vxmnxTSUBIhyA
 */

const BRIDGE_IP = '192.168.1.6'
const API_KEY = 'xddEM82d6i8rZDvEy0jAdXL3rA8vxmnxTSUBIhyA'
const KV_WORKER_URL = 'http://127.0.0.1:8787'

// Statistics
const stats = {
  discovered: 0,
  imported: 0,
  skipped: 0,
  errors: 0,
  roomsCreated: new Set(),
}

/**
 * Discover all lights from Hue Bridge
 */
async function discoverHueLights() {
  console.log('🔍 Discovering Hue Devices')
  console.log('─'.repeat(60))

  const url = `http://${BRIDGE_IP}/api/${API_KEY}/lights`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const lights = await response.json()

    console.log(`✅ Found ${Object.keys(lights).length} devices on bridge`)
    stats.discovered = Object.keys(lights).length

    return lights
  } catch (error) {
    console.error('❌ Failed to discover lights:', error.message)
    throw error
  }
}

/**
 * Extract room name from device name
 * Examples:
 *   "Matt's Table 2" -> "Office" (contains office-related context)
 *   "Family Room Speaker Lamp 2" -> "Family Room"
 *   "Game Room Play 1" -> "Game Room"
 *   "Sun Room Floor Lamp" -> "Sun Room"
 */
function extractRoomFromName(deviceName) {
  const name = deviceName.toLowerCase()

  // Explicit room names
  if (name.includes('family room')) return 'Family Room'
  if (name.includes('game room')) return 'Game Room'
  if (name.includes('sun room') || name.includes('sunroom')) return 'Sun Room'
  if (name.includes('dining room')) return 'Dining Room'
  if (name.includes('living room')) return 'Living Room'
  if (name.includes('bedroom') || name.includes('master')) return 'Bedroom'
  if (name.includes('kitchen')) return 'Kitchen'
  if (name.includes('bathroom')) return 'Bathroom'
  if (name.includes('office')) return 'Office'
  if (name.includes('entry') || name.includes('entrance')) return 'Entryway'
  if (name.includes('stairs') || name.includes('stairway')) return 'Stairs'
  if (name.includes('hallway') || name.includes('hall')) return 'Hallway'
  if (name.includes('garage')) return 'Garage'
  if (name.includes('basement')) return 'Basement'
  if (name.includes('attic')) return 'Attic'
  if (name.includes('patio') || name.includes('deck')) return 'Outdoor'
  if (name.includes('garden') || name.includes('yard')) return 'Outdoor'

  // Context-based detection
  if (name.includes('matt') || name.includes('desk')) return 'Office'

  // Default fallback
  return 'Other'
}

/**
 * Map Hue device type to HomeHub device type
 */
function mapDeviceType(hueType) {
  // All Hue devices are lights
  return 'light'
}

/**
 * Determine device capabilities based on Hue type
 */
function getDeviceCapabilities(hueType) {
  const type = hueType.toLowerCase()

  if (type.includes('extended color')) {
    return ['dimming', 'color', 'color-temp']
  }

  if (type.includes('color')) {
    return ['dimming', 'color']
  }

  if (type.includes('temperature')) {
    return ['dimming', 'color-temp']
  }

  // Dimmable lights
  return ['dimming']
}

/**
 * Convert Hue light to HomeHub Device object
 */
function convertToDevice(lightId, hueLight) {
  const room = extractRoomFromName(hueLight.name)
  const capabilities = getDeviceCapabilities(hueLight.type)

  // Calculate brightness percentage (0-254 -> 0-100)
  const brightness = hueLight.state.on ? Math.round((hueLight.state.bri / 254) * 100) : 0

  const device = {
    id: `hue-${lightId}`,
    name: hueLight.name,
    type: mapDeviceType(hueLight.type),
    room: room,
    status: hueLight.state.reachable ? 'online' : 'offline',
    enabled: hueLight.state.on,
    protocol: 'hue',
    value: brightness,
    unit: '%',
    lastSeen: new Date(),
    signalStrength: 100, // Hue devices are always 100% when reachable
    capabilities: capabilities,
  }

  stats.roomsCreated.add(room)

  return device
}

/**
 * Load existing devices from KV store
 */
async function loadExistingDevices() {
  console.log('\n📋 Loading Existing Devices')
  console.log('─'.repeat(60))

  try {
    const response = await fetch(`${KV_WORKER_URL}/kv/devices`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    const devices = data.value || []

    console.log(`✅ Found ${devices.length} existing devices in KV store`)

    // Filter out Hue devices (we'll replace them)
    const nonHueDevices = devices.filter(d => d.protocol !== 'hue')
    console.log(`   ${nonHueDevices.length} non-Hue devices (keeping)`)
    console.log(`   ${devices.length - nonHueDevices.length} Hue devices (will replace)`)

    return nonHueDevices
  } catch (error) {
    console.error('❌ Failed to load existing devices:', error.message)
    console.log('   Using empty device list')
    return []
  }
}

/**
 * Save devices to KV store
 */
async function saveDevices(devices) {
  console.log('\n💾 Saving to KV Store')
  console.log('─'.repeat(60))

  // Try up to 3 times with timeout
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

      const response = await fetch(`${KV_WORKER_URL}/kv/devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: devices }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      console.log(`✅ Saved ${devices.length} total devices to KV store`)
      return true
    } catch (error) {
      if (attempt < 3) {
        console.log(`⚠️  Attempt ${attempt} failed: ${error.message}`)
        console.log(`🔄 Retrying in 2 seconds...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      } else {
        console.error(`❌ Failed to save devices after 3 attempts: ${error.message}`)
        return false
      }
    }
  }
  return false
}

/**
 * Create room definitions
 */
async function updateRooms(roomNames) {
  console.log('\n🏠 Updating Rooms')
  console.log('─'.repeat(60))

  try {
    // Load existing rooms
    const response = await fetch(`${KV_WORKER_URL}/kv/rooms`)
    let existingRooms = []

    if (response.ok) {
      const data = await response.json()
      existingRooms = data.value || []
    }

    console.log(`   Found ${existingRooms.length} existing rooms`)

    // Create room objects for new rooms
    const roomIcons = {
      'Family Room': 'couch',
      'Game Room': 'game-controller',
      'Sun Room': 'sun',
      'Dining Room': 'fork-knife',
      'Living Room': 'television',
      Bedroom: 'bed',
      Kitchen: 'cooking-pot',
      Bathroom: 'bathtub',
      Office: 'desktop',
      Entryway: 'door-open',
      Stairs: 'stairs',
      Hallway: 'door',
      Garage: 'garage',
      Basement: 'stairs-down',
      Attic: 'stairs-up',
      Outdoor: 'tree',
      Other: 'house',
    }

    const existingRoomNames = new Set(existingRooms.map(r => r.name))
    const newRooms = []

    for (const roomName of roomNames) {
      if (!existingRoomNames.has(roomName)) {
        newRooms.push({
          id: roomName.toLowerCase().replace(/\s+/g, '-'),
          name: roomName,
          icon: roomIcons[roomName] || 'house',
          deviceIds: [], // Will be populated by UI
        })
      }
    }

    if (newRooms.length > 0) {
      const updatedRooms = [...existingRooms, ...newRooms]

      const saveResponse = await fetch(`${KV_WORKER_URL}/kv/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: updatedRooms }),
      })

      if (saveResponse.ok) {
        console.log(`✅ Added ${newRooms.length} new rooms:`)
        newRooms.forEach(room => {
          console.log(`   - ${room.name}`)
        })
      }
    } else {
      console.log('   No new rooms to add')
    }

    return true
  } catch (error) {
    console.error('⚠️  Failed to update rooms:', error.message)
    return false
  }
}

/**
 * Main import process
 */
async function importHueDevices() {
  console.log('🎨 Hue Device Import Tool')
  console.log('═'.repeat(60))
  console.log(`Bridge: ${BRIDGE_IP}`)
  console.log(`Worker: ${KV_WORKER_URL}`)
  console.log('═'.repeat(60))

  // Test worker connectivity first
  console.log('\n🔌 Testing Worker Connection')
  console.log('─'.repeat(60))
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${KV_WORKER_URL}/kv/devices`, {
      method: 'GET',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      console.log('✅ Worker is responding')
    } else {
      throw new Error(`Worker returned ${response.status}`)
    }
  } catch (error) {
    console.error(`❌ Cannot connect to worker: ${error.message}`)
    console.error('\nPlease ensure the worker is running:')
    console.error('   npm run worker:dev')
    process.exit(1)
  }

  try {
    // Step 1: Discover devices from Hue Bridge
    const hueLights = await discoverHueLights()

    // Step 2: Load existing non-Hue devices
    const existingDevices = await loadExistingDevices()

    // Step 3: Convert Hue lights to HomeHub devices
    console.log('\n🔄 Converting Hue Devices')
    console.log('─'.repeat(60))

    const hueDevices = []

    for (const [lightId, hueLight] of Object.entries(hueLights)) {
      try {
        const device = convertToDevice(lightId, hueLight)
        hueDevices.push(device)

        console.log(`✅ ${device.name}`)
        console.log(`   ID: ${device.id}`)
        console.log(`   Room: ${device.room}`)
        console.log(`   Type: ${hueLight.type}`)
        console.log(
          `   State: ${device.enabled ? 'ON' : 'OFF'} ${device.enabled ? `(${device.value}%)` : ''}`
        )
        console.log(`   Status: ${device.status}`)
        console.log(`   Capabilities: ${device.capabilities.join(', ')}`)
        console.log()

        stats.imported++
      } catch (error) {
        console.error(`❌ Failed to convert device ${lightId}: ${error.message}`)
        stats.errors++
      }
    }

    // Step 4: Combine with existing devices
    const allDevices = [...existingDevices, ...hueDevices]

    console.log('📊 Device Summary')
    console.log('─'.repeat(60))
    console.log(`Existing non-Hue devices: ${existingDevices.length}`)
    console.log(`New Hue devices: ${hueDevices.length}`)
    console.log(`Total devices: ${allDevices.length}`)

    // Step 5: Save to KV store
    const saved = await saveDevices(allDevices)

    if (!saved) {
      throw new Error('Failed to save devices to KV store')
    }

    // Step 6: Update rooms
    await updateRooms(Array.from(stats.roomsCreated))

    // Final summary
    console.log('\n' + '═'.repeat(60))
    console.log('✅ Import Complete!')
    console.log('═'.repeat(60))
    console.log(`Discovered: ${stats.discovered} devices`)
    console.log(`Imported: ${stats.imported} devices`)
    console.log(`Errors: ${stats.errors}`)
    console.log(`Rooms: ${stats.roomsCreated.size}`)
    console.log(`   ${Array.from(stats.roomsCreated).join(', ')}`)
    console.log('═'.repeat(60))
    console.log('\n🎉 All Hue devices are now available in HomeHub!')
    console.log('   Refresh the Dashboard to see your devices.')
  } catch (error) {
    console.error('\n💥 Import failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run the import
importHueDevices().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
