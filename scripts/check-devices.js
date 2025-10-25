#!/usr/bin/env node
/**
 * Check what devices are currently in the KV store
 */

const KV_WORKER_URL = 'http://127.0.0.1:8787'

async function checkDevices() {
  try {
    console.log('🔍 Checking KV Store for devices...\n')

    const response = await fetch(`${KV_WORKER_URL}/kv/devices`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    const devices = result.value || []

    console.log(`📊 Total devices: ${devices.length}`)
    console.log('─'.repeat(60))

    // Count by protocol
    const protocolCounts = {}
    const roomCounts = {}
    const hueDevices = []

    devices.forEach(device => {
      // Count protocols
      protocolCounts[device.protocol] = (protocolCounts[device.protocol] || 0) + 1

      // Count rooms
      roomCounts[device.room] = (roomCounts[device.room] || 0) + 1

      // Track Hue devices
      if (device.protocol === 'hue') {
        hueDevices.push(device)
      }
    })

    console.log('\n📡 Devices by Protocol:')
    Object.entries(protocolCounts).forEach(([protocol, count]) => {
      console.log(`   ${protocol}: ${count}`)
    })

    console.log('\n🏠 Devices by Room:')
    Object.entries(roomCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([room, count]) => {
        console.log(`   ${room}: ${count}`)
      })

    if (hueDevices.length > 0) {
      console.log(`\n💡 Hue Devices (${hueDevices.length}):`)
      console.log('─'.repeat(60))
      hueDevices.forEach(device => {
        const status = device.status === 'online' ? '🟢' : '🔴'
        const state = device.enabled ? '✅ ON' : '⚪ OFF'
        console.log(`${status} ${device.name}`)
        console.log(`   Room: ${device.room} | ${state} | ${device.value}%`)
        console.log()
      })
    } else {
      console.log('\n⚠️  No Hue devices found in KV store')
      console.log('   The import may not have completed successfully')
    }

    console.log('─'.repeat(60))
    console.log(`✅ Import status: ${hueDevices.length > 0 ? 'SUCCESS' : 'NOT IMPORTED YET'}`)
  } catch (error) {
    console.error('❌ Error checking devices:', error.message)
    console.error('\nMake sure the worker is running:')
    console.error('   npm run worker:dev')
  }
}

checkDevices()
