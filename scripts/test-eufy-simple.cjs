// Simplified Eufy Test - Discovery Only
// Usage: node scripts/test-eufy-simple.cjs

require('dotenv').config()
const { EufySecurity } = require('eufy-security-client')
const path = require('path')

async function testEufy() {
  console.log('🎥 Eufy Camera Test (Simplified)\n')

  const email = process.env.EUFY_EMAIL
  const password = process.env.EUFY_PASSWORD

  if (!password) {
    console.log('❌ EUFY_PASSWORD not set in .env file')
    process.exit(1)
  }

  console.log(`Connecting as: ${email}`)
  console.log('Please wait...\n')

  try {
    const eufy = await EufySecurity.initialize({
      username: email,
      password: password,
      country: 'US',
      persistentDir: path.join(__dirname, '..', 'data', 'eufy-data'),
    })

    console.log('✅ Connected to Eufy!\n')

    // Wait a moment for initial sync
    await new Promise(resolve => setTimeout(resolve, 3000))

    const stations = eufy.getStations()
    console.log(`📡 Stations found: ${Object.keys(stations).length}`)

    let totalCameras = 0
    for (const [stationSN, station] of Object.entries(stations)) {
      console.log(`\n📍 Station: ${station.getName()}`)
      console.log(`   Serial: ${station.getSerial()}`)

      const devices = station.getDevices()
      for (const [deviceSN, device] of Object.entries(devices)) {
        if (device.isCamera()) {
          totalCameras++
          console.log(`\n   🎥 Camera ${totalCameras}: ${device.getName()}`)
          console.log(`      Model: ${device.getModel()}`)
          console.log(`      Serial: ${device.getSerial()}`)
          console.log(`      Online: ${device.isOnline() ? '🟢' : '🔴'}`)
        }
      }
    }

    console.log(`\n\n✨ Total cameras found: ${totalCameras}`)
    console.log('Expected: 2 (Eufy Indoor Cam E30)\n')

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error(error)
    process.exit(1)
  }
}

testEufy()
