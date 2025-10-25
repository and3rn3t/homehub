// Test Script: Eufy Camera Connection
// Purpose: Discover your 2x Eufy Indoor Cam E30 cameras
// Usage: node scripts/test-eufy-connect.js

const { EufySecurity } = require('eufy-security-client')
const fs = require('fs')
const path = require('path')

// IMPORTANT: Create a .env file in the root with your Eufy credentials:
// EUFY_EMAIL=your-email@example.com
// EUFY_PASSWORD=your-password

// Load environment variables if .env exists
const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
      process.env[key.trim()] = value.trim()
    }
  })
}

async function testEufyConnection() {
  console.log('🎥 Eufy Camera Connection Test')
  console.log('==============================\n')

  // Get credentials
  const email = process.env.EUFY_EMAIL
  const password = process.env.EUFY_PASSWORD

  if (!email || !password) {
    console.error('❌ ERROR: Eufy credentials not found!')
    console.log('\n📝 Please create a .env file in the project root with:')
    console.log('   EUFY_EMAIL=your-email@example.com')
    console.log('   EUFY_PASSWORD=your-password')
    console.log('\nOr set environment variables before running this script.')
    process.exit(1)
  }

  console.log('🔐 Connecting to Eufy Security...')
  console.log(`   Email: ${email}`)
  console.log(`   Creating persistent storage...`)

  try {
    // Initialize Eufy client
    const eufy = await EufySecurity.initialize({
      username: email,
      password: password,
      country: 'US',
      language: 'en',
      trustedDeviceName: 'HomeHub-Dev',
      persistentDir: path.join(__dirname, '..', 'data', 'eufy-data'),
      eventDurationSeconds: 10,
      p2pConnectionSetup: 2, // Quickest
      pollingIntervalMinutes: 10,
    })

    console.log('✅ Connected successfully!\n')

    // Get stations (HomeBase/bridges)
    console.log('📡 Discovering stations...')
    const stations = await eufy.getStations()
    console.log(`   Found ${stations.length} station(s)\n`)

    if (stations.length === 0) {
      console.log('⚠️  No stations found. Check your Eufy account.')
      process.exit(0)
    }

    // Discover cameras
    let totalCameras = 0
    let eufyCameras = []

    for (const station of stations) {
      console.log(`📍 Station: ${station.getName()}`)
      console.log(`   Serial: ${station.getSerial()}`)
      console.log(`   Model: ${station.getModel()}`)
      console.log(`   Firmware: ${station.getSoftwareVersion()}`)
      console.log(`   LAN IP: ${station.getLANIPAddress()}`)
      console.log()

      const devices = await station.getDevices()
      const cameras = devices.filter(d => d.isCamera())

      if (cameras.length === 0) {
        console.log('   No cameras found on this station.\n')
        continue
      }

      console.log(`   🎥 Cameras (${cameras.length}):`)
      for (const camera of cameras) {
        totalCameras++
        const cameraInfo = {
          id: camera.getSerial(),
          name: camera.getName(),
          model: camera.getModel(),
          serial: camera.getSerial(),
          online: camera.isOnline(),
          battery: camera.hasBattery() ? `${camera.getBatteryLevel()}%` : 'Wired',
          firmware: camera.getSoftwareVersion(),
          canStream: camera.hasProperty('rtspStream'),
          canPTZ: camera.hasCommand('panAndTilt'),
        }

        eufyCameras.push(cameraInfo)

        console.log(`\n      ${totalCameras}. ${cameraInfo.name}`)
        console.log(`         Model: ${cameraInfo.model}`)
        console.log(`         Serial: ${cameraInfo.serial}`)
        console.log(`         Status: ${cameraInfo.online ? '🟢 Online' : '🔴 Offline'}`)
        console.log(`         Power: ${cameraInfo.battery}`)
        console.log(`         Firmware: ${cameraInfo.firmware}`)
        console.log(`         Streaming: ${cameraInfo.canStream ? '✅ Yes' : '⚠️  Unknown'}`)
        console.log(`         PTZ Control: ${cameraInfo.canPTZ ? '✅ Yes' : '❌ No'}`)
      }
      console.log()
    }

    console.log('=' .repeat(60))
    console.log(`\n✨ Discovery Complete!`)
    console.log(`   Total Cameras Found: ${totalCameras}`)
    console.log(`   Expected: 2 (Eufy Indoor Cam E30)`)

    if (totalCameras !== 2) {
      console.log(`\n⚠️  Warning: Expected 2 cameras, found ${totalCameras}`)
      console.log('   Check your Eufy app to ensure all cameras are online.')
    }

    // Save camera data for next steps
    const dataPath = path.join(__dirname, '..', 'data', 'eufy-cameras.json')
    fs.mkdirSync(path.dirname(dataPath), { recursive: true })
    fs.writeFileSync(dataPath, JSON.stringify(eufyCameras, null, 2))
    console.log(`\n💾 Camera data saved to: ${dataPath}`)

    console.log('\n🎉 Next Steps:')
    console.log('   1. Run: node scripts/test-arlo-connect.js')
    console.log('   2. Run: node scripts/test-stream.js')
    console.log('   3. Check docs/development/PHASE_5_DIY_QUICKSTART.md')

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Connection failed!')
    console.error(`   Error: ${error.message}`)
    
    if (error.message.includes('authentication')) {
      console.log('\n💡 Tips:')
      console.log('   - Check your email/password')
      console.log('   - If you use 2FA, you may need an app password')
      console.log('   - Try logging into the Eufy Security app first')
    }

    console.error('\nFull error:')
    console.error(error)
    process.exit(1)
  }
}

// Handle termination
process.on('SIGINT', () => {
  console.log('\n\n👋 Test cancelled by user')
  process.exit(0)
})

// Run the test
testEufyConnection()
