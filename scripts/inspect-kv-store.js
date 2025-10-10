#!/usr/bin/env node

/**
 * KV Store Inspector
 *
 * Browser console helper for inspecting KV store data
 *
 * Usage:
 * 1. Open browser DevTools (F12)
 * 2. Go to Console tab
 * 3. Paste this entire script and press Enter
 * 4. Or save as bookmark and click to run
 */

console.log('🔍 KV Store Inspector\n')
console.log('='.repeat(60))

// Get all KV keys
const keys = Object.keys(localStorage).filter(
  key => !key.startsWith('_') && !key.includes('devtools')
)

console.log(`\n📦 Found ${keys.length} KV store keys:\n`)

keys.forEach(key => {
  console.log(`📌 ${key}`)
})

console.log('\n' + '='.repeat(60))

// Inspect devices
if (localStorage.getItem('devices')) {
  console.log('\n🔌 DEVICES:\n')
  try {
    const devices = JSON.parse(localStorage.getItem('devices'))
    console.log(`Total devices: ${devices.length}`)
    console.log('\nDevice List:')
    devices.forEach((device, i) => {
      console.log(`\n${i + 1}. ${device.name}`)
      console.log(`   ID: ${device.id}`)
      console.log(`   Type: ${device.type}`)
      console.log(`   Room: ${device.room}`)
      console.log(`   Status: ${device.status}`)
      console.log(`   Enabled: ${device.enabled ? '✅ ON' : '⚫ OFF'}`)
      if (device.protocol) console.log(`   Protocol: ${device.protocol}`)
      if (device.config?.httpEndpoint) console.log(`   Endpoint: ${device.config.httpEndpoint}`)
    })
  } catch (err) {
    console.error('❌ Error parsing devices:', err)
  }
} else {
  console.log('\n⚠️  No devices found in KV store')
}

console.log('\n' + '='.repeat(60))

// Inspect rooms
if (localStorage.getItem('rooms')) {
  console.log('\n🏠 ROOMS:\n')
  try {
    const rooms = JSON.parse(localStorage.getItem('rooms'))
    console.log(`Total rooms: ${rooms.length}`)
    rooms.forEach((room, i) => {
      console.log(`\n${i + 1}. ${room.name}`)
      console.log(`   ID: ${room.id}`)
      console.log(`   Devices: ${room.deviceIds?.length || 0}`)
    })
  } catch (err) {
    console.error('❌ Error parsing rooms:', err)
  }
}

console.log('\n' + '='.repeat(60))

// Inspect favorite devices
if (localStorage.getItem('favorite-devices')) {
  console.log('\n⭐ FAVORITE DEVICES:\n')
  try {
    const favorites = JSON.parse(localStorage.getItem('favorite-devices'))
    console.log(`Total favorites: ${favorites.length}`)
    console.log('IDs:', favorites)
  } catch (err) {
    console.error('❌ Error parsing favorites:', err)
  }
}

console.log('\n' + '='.repeat(60))

// Check for discovered devices
const devices = localStorage.getItem('devices') ? JSON.parse(localStorage.getItem('devices')) : []
const unassignedDevices = devices.filter(d => d.room === 'Unassigned')
const discoveredDevices = devices.filter(d => d.protocol === 'http')

console.log('\n📊 DISCOVERY STATUS:\n')
console.log(`Unassigned devices: ${unassignedDevices.length}`)
console.log(`HTTP discovered devices: ${discoveredDevices.length}`)

if (discoveredDevices.length > 0) {
  console.log('\nDiscovered devices:')
  discoveredDevices.forEach(device => {
    console.log(`  • ${device.name} (${device.id})`)
    console.log(`    Room: ${device.room}`)
    console.log(`    State: ${device.enabled ? '✅ ON' : '⚫ OFF'}`)
  })
}

console.log('\n' + '='.repeat(60))

// Helper functions
console.log('\n🛠️  HELPER FUNCTIONS:\n')
console.log('Run these commands to inspect data:')
console.log('')
console.log('// Get all devices')
console.log('JSON.parse(localStorage.getItem("devices"))')
console.log('')
console.log('// Get specific device by ID')
console.log('JSON.parse(localStorage.getItem("devices")).find(d => d.id === "YOUR_ID")')
console.log('')
console.log('// Get devices in a room')
console.log('JSON.parse(localStorage.getItem("devices")).filter(d => d.room === "Living Room")')
console.log('')
console.log('// Get unassigned devices')
console.log('JSON.parse(localStorage.getItem("devices")).filter(d => d.room === "Unassigned")')
console.log('')
console.log('// Clear all KV data (CAUTION!)')
console.log('localStorage.clear()')
console.log('')

console.log('='.repeat(60))
console.log('\n✨ Inspection complete!\n')
