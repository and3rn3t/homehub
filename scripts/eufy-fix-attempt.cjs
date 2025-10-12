#!/usr/bin/env node
/**
 * Eufy Fix Attempt - Owner Account Troubleshooting
 *
 * Since you OWN the cameras and they're visible in the app,
 * let's try different initialization sequences and clear cache.
 */

require('dotenv').config()
const { EufySecurity } = require('eufy-security-client')
const fs = require('fs')
const path = require('path')

console.log('🔧 Eufy Owner Account Fix Attempt\n')
console.log('Account:', process.env.EUFY_EMAIL)
console.log('Region: US (confirmed)\n')

// Step 1: Clear any persistent data cache
const dataDir = path.join(process.cwd(), 'data', 'eufy-data')
if (fs.existsSync(dataDir)) {
  console.log('🗑️  Deleting cached data:', dataDir)
  fs.rmSync(dataDir, { recursive: true, force: true })
  console.log('✓ Cache cleared\n')
} else {
  console.log('ℹ️  No cached data found (fresh start)\n')
}

async function tryConnection() {
  console.log('🔌 Attempting connection...\n')

  try {
    // Try with explicit US country code and persistence directory
    const client = await EufySecurity.initialize({
      username: process.env.EUFY_EMAIL,
      password: process.env.EUFY_PASSWORD,
      country: 'US', // Explicit US region
      language: 'en',
      persistentDir: dataDir,
      acceptInvitations: true, // Accept any invitations (shouldn't matter since you're owner)
      p2pConnectionSetup: 2, // Try different P2P setup method
      pollingIntervalMinutes: 10,
      eventDurationSeconds: 10,
    })

    console.log('✅ Client initialized\n')

    // Wait for initial sync with longer timeout
    console.log('⏳ Waiting 10 seconds for device sync...')
    await new Promise(resolve => setTimeout(resolve, 10000))

    // Try to get stations - it's async!
    const stations = await client.getStations()
    console.log(`📡 Stations object:`, stations)
    console.log(`📡 Stations type:`, typeof stations)

    // Convert to array if it's an object/Map
    let stationArray = []
    if (stations && typeof stations === 'object') {
      if (Array.isArray(stations)) {
        stationArray = stations
      } else if (stations instanceof Map) {
        stationArray = Array.from(stations.values())
      } else {
        stationArray = Object.values(stations)
      }
    }

    console.log(`📡 Stations found: ${stationArray.length}`)

    if (stationArray.length === 0) {
      console.log('\n❌ Still 0 stations after fixes\n')
      console.log('🔍 Library may not support your camera model (E30)')
      console.log('\n📋 Debug info:')
      console.log('   - Client created:', !!client)
      console.log('   - Client API:', !!client.api)
      console.log('   - Persistent dir created:', fs.existsSync(dataDir))

      // Try calling API methods directly
      console.log('\n🔬 Attempting direct API call...')
      try {
        const devices = await client.api.getDevices()
        console.log('   - Raw API response:', JSON.stringify(devices, null, 2))
      } catch (apiError) {
        console.log('   - API call failed:', apiError.message)
      }

      console.log('\n💡 Recommendation:')
      console.log('   The eufy-security-client library may not fully support')
      console.log('   the Eufy Indoor Cam E30 (T8414) model.')
      console.log('\n   → Proceed with MOCK-FIRST DEVELOPMENT')
      console.log('   → We can revisit Eufy integration later with:')
      console.log('      - Different library version')
      console.log('      - RTSP if you enable it in Eufy app')
      console.log('      - Homebridge plugin approach\n')
    } else {
      console.log('\n🎉 SUCCESS! Stations found!\n')

      stationArray.forEach((station, index) => {
        console.log(`Station ${index + 1}:`)
        console.log(`  - Serial: ${station.getSerial()}`)
        console.log(`  - Model: ${station.getModel()}`)
        console.log(`  - Name: ${station.getName()}`)

        const devices = station.getDevices()
        console.log(`  - Devices: ${devices.length}`)

        devices.forEach((device, devIndex) => {
          console.log(`    ${devIndex + 1}. ${device.getName()} (${device.getModel()})`)
          console.log(`       - Serial: ${device.getSerial()}`)
          console.log(`       - Battery: ${device.getBatteryValue()}%`)
        })
        console.log()
      })
    }

    client.close()
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    console.error('\nFull error:', error)
  }
}

tryConnection()
