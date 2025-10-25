#!/usr/bin/env node
/**
 * Import Hue Devices Directly to localStorage File
 * Bypasses the worker and writes directly to the browser's localStorage
 */

import { writeFileSync } from 'fs'

// Configuration
const BRIDGE_IP = '192.168.1.6'
const API_KEY = 'xddEM82d6i8rZDvEy0jAdXL3rA8vxmnxTSUBIhyA'
const LOCALSTORAGE_FILE =
  'C:\\Users\\Matt\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Local Storage\\leveldb'

// Stats
const stats = {
  discovered: 0,
  imported: 0,
  errors: 0,
  roomsCreated: new Set(),
}

/**
 * Discover lights from Hue Bridge
 */
async function discoverHueLights() {
  console.log('\n🔍 Discovering Hue Devices')
  console.log('─'.repeat(60))

  try {
    const response = await fetch(`http://${BRIDGE_IP}/api/${API_KEY}/lights`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const lights = await response.json()
    stats.discovered = Object.keys(lights).length

    console.log(`✅ Found ${stats.discovered} devices on bridge\n`)
    return lights
  } catch (error) {
    console.error(`❌ Failed to discover devices: ${error.message}`)
    throw error
  }
}

/**
 * Extract room name from device name
 */
function extractRoomFromName(name) {
  const roomPatterns = {
    'Family Room': /family room|couch|speaker lamp|play.*[12]/i,
    Office: /office|matt's table|jonah's.*desk/i,
    'Sun Room': /sun.*room|sunroom/i,
    'Game Room': /game room/i,
    Bedroom: /bedroom|silas's lamp/i,
    Kitchen: /kitchen/i,
    'Dining Room': /dining/i,
    'Living Room': /living/i,
    Bathroom: /bathroom/i,
    Garage: /garage/i,
    Basement: /basement/i,
    Entryway: /entry/i,
    Hallway: /hallway/i,
    Stairs: /stairs/i,
    Outdoor: /front door exterior/i,
  }

  for (const [room, pattern] of Object.entries(roomPatterns)) {
    if (pattern.test(name)) {
      stats.roomsCreated.add(room)
      return room
    }
  }

  stats.roomsCreated.add('Other')
  return 'Other'
}

/**
 * Get device capabilities based on type
 */
function getDeviceCapabilities(type) {
  if (type.includes('Extended color')) {
    return ['dimming', 'color', 'color-temp']
  }
  if (type.includes('Color')) {
    return ['dimming', 'color']
  }
  if (type.includes('Dimmable')) {
    return ['dimming']
  }
  return []
}

/**
 * Convert Hue light to HomeHub device format
 */
function convertToDevice(lightId, hueLight) {
  const room = extractRoomFromName(hueLight.name)
  const capabilities = getDeviceCapabilities(hueLight.type)

  return {
    id: `hue-${lightId}`,
    name: hueLight.name,
    type: 'light',
    room,
    protocol: 'hue',
    status: hueLight.state.reachable ? 'online' : 'offline',
    enabled: hueLight.state.on,
    value: Math.round((hueLight.state.bri / 254) * 100) || 0,
    unit: '%',
    capabilities,
    lastSeen: new Date().toISOString(),
    metadata: {
      bridgeId: lightId,
      modelId: hueLight.modelid,
      manufacturer: hueLight.manufacturername,
      productName: hueLight.productname,
      swVersion: hueLight.swversion,
    },
  }
}

/**
 * Main import process - outputs JSON for manual import
 */
async function importHueDevices() {
  console.log('🎨 Hue Device Direct Import Tool')
  console.log('═'.repeat(60))
  console.log(`Bridge: ${BRIDGE_IP}`)
  console.log('═'.repeat(60))

  try {
    // Step 1: Discover devices from Hue Bridge
    const hueLights = await discoverHueLights()

    // Step 2: Convert Hue lights to HomeHub devices
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
        const stateStr = device.enabled ? `ON (${device.value}%)` : 'OFF'
        console.log(`   State: ${stateStr}`)
        console.log(`   Status: ${device.status}`)
        console.log(`   Capabilities: ${device.capabilities.join(', ')}`)
        console.log()

        stats.imported++
      } catch (error) {
        console.error(`❌ Failed to convert device ${lightId}: ${error.message}`)
        stats.errors++
      }
    }

    // Step 3: Write to JSON file
    const outputFile = 'data/hue-devices.json'
    writeFileSync(outputFile, JSON.stringify(hueDevices, null, 2))

    console.log('📊 Device Summary')
    console.log('─'.repeat(60))
    console.log(`New Hue devices: ${hueDevices.length}`)
    console.log(`Output file: ${outputFile}`)

    // Final summary
    console.log('\n' + '═'.repeat(60))
    console.log('✅ Export Complete!')
    console.log('═'.repeat(60))
    console.log(`Discovered: ${stats.discovered} devices`)
    console.log(`Exported: ${stats.imported} devices`)
    console.log(`Errors: ${stats.errors}`)
    console.log(`Rooms: ${stats.roomsCreated.size}`)
    console.log(`   ${Array.from(stats.roomsCreated).join(', ')}`)
    console.log('═'.repeat(60))
    console.log(`\n📁 Devices saved to: ${outputFile}`)
    console.log('\n📋 Next Steps:')
    console.log('   1. Open the Dashboard in your browser')
    console.log('   2. Open DevTools Console (F12)')
    console.log('   3. Run this command to import:')
    console.log(
      `      fetch('/data/hue-devices.json').then(r=>r.json()).then(devices=>localStorage.setItem('devices',JSON.stringify(devices)))`
    )
    console.log('   4. Refresh the page to see your devices')
  } catch (error) {
    console.error('\n💥 Export failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run the import
importHueDevices().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
