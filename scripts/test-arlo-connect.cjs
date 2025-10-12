// Test Script: Arlo Camera Connection
// Purpose: Discover your 5x Arlo cameras (1 doorbell + 2 Pro 4 + 2 Essential)
// Usage: node scripts/test-arlo-connect.js

const Arlo = require('node-arlo')
const fs = require('fs')
const path = require('path')

// IMPORTANT: Add to your .env file:
// ARLO_EMAIL=your-email@example.com
// ARLO_PASSWORD=your-password

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

async function testArloConnection() {
  console.log('🎥 Arlo Camera Connection Test')
  console.log('==============================\n')

  // Get credentials
  const email = process.env.ARLO_EMAIL
  const password = process.env.ARLO_PASSWORD

  if (!email || !password) {
    console.error('❌ ERROR: Arlo credentials not found!')
    console.log('\n📝 Please add to your .env file:')
    console.log('   ARLO_EMAIL=your-email@example.com')
    console.log('   ARLO_PASSWORD=your-password')
    console.log('\nOr set environment variables before running this script.')
    process.exit(1)
  }

  console.log('🔐 Connecting to Arlo Cloud...')
  console.log(`   Email: ${email}`)

  try {
    // Initialize Arlo client
    const arlo = new Arlo()

    // Login
    await arlo.login(email, password)
    console.log('✅ Connected successfully!\n')

    // Get all devices
    console.log('📡 Discovering devices...')
    const devices = await arlo.getDevices()
    console.log(`   Found ${devices.length} device(s)\n`)

    if (devices.length === 0) {
      console.log('⚠️  No devices found. Check your Arlo account.')
      process.exit(0)
    }

    // Filter and categorize cameras
    const cameras = devices.filter(d => 
      d.deviceType && (
        d.deviceType.includes('camera') || 
        d.deviceType === 'doorbell' ||
        d.deviceType.includes('arloq')
      )
    )

    if (cameras.length === 0) {
      console.log('⚠️  No cameras found. Other devices detected:')
      devices.forEach((d, i) => {
        console.log(`   ${i + 1}. ${d.deviceName} (${d.deviceType})`)
      })
      process.exit(0)
    }

    console.log(`🎥 Cameras Found (${cameras.length}):\n`)

    let arloCameras = []
    let camerasByType = {
      doorbell: [],
      pro4: [],
      essential: [],
      other: []
    }

    cameras.forEach((camera, index) => {
      const cameraInfo = {
        id: camera.deviceId,
        name: camera.deviceName,
        type: camera.deviceType,
        model: camera.modelId || 'Unknown',
        serial: camera.deviceId,
        online: camera.state === 'provisioned',
        battery: camera.properties?.batteryLevel || null,
        signalStrength: camera.properties?.signalStrength || null,
        firmware: camera.properties?.swVersion || 'Unknown',
        subscription: camera.properties?.planId || 'None',
      }

      // Categorize by type
      if (cameraInfo.type === 'doorbell' || cameraInfo.model.includes('AVD')) {
        camerasByType.doorbell.push(cameraInfo)
      } else if (cameraInfo.model.includes('VMC4041') || cameraInfo.model.includes('Pro 4')) {
        camerasByType.pro4.push(cameraInfo)
      } else if (cameraInfo.model.includes('VMC2040') || cameraInfo.model.includes('Essential')) {
        camerasByType.essential.push(cameraInfo)
      } else {
        camerasByType.other.push(cameraInfo)
      }

      arloCameras.push(cameraInfo)

      console.log(`${index + 1}. ${cameraInfo.name}`)
      console.log(`   Type: ${cameraInfo.type}`)
      console.log(`   Model: ${cameraInfo.model}`)
      console.log(`   ID: ${cameraInfo.id}`)
      console.log(`   Status: ${cameraInfo.online ? '🟢 Online' : '🔴 Offline'}`)
      
      if (cameraInfo.battery !== null) {
        const batteryEmoji = cameraInfo.battery > 80 ? '🔋' : 
                           cameraInfo.battery > 20 ? '🪫' : '⚠️'
        console.log(`   Battery: ${batteryEmoji} ${cameraInfo.battery}%`)
      } else {
        console.log(`   Power: 🔌 Wired`)
      }
      
      if (cameraInfo.signalStrength !== null) {
        console.log(`   Signal: ${cameraInfo.signalStrength}%`)
      }
      
      console.log(`   Firmware: ${cameraInfo.firmware}`)
      console.log(`   Subscription: ${cameraInfo.subscription}`)
      console.log()
    })

    console.log('=' .repeat(60))
    console.log('\n📊 Camera Summary:')
    console.log(`   Total: ${cameras.length}`)
    console.log(`   Doorbells: ${camerasByType.doorbell.length} (Expected: 1)`)
    console.log(`   Pro 4 Spotlight: ${camerasByType.pro4.length} (Expected: 2)`)
    console.log(`   Essential Indoor: ${camerasByType.essential.length} (Expected: 2)`)
    if (camerasByType.other.length > 0) {
      console.log(`   Other: ${camerasByType.other.length}`)
    }

    console.log('\n✨ Discovery Complete!')

    if (cameras.length !== 5) {
      console.log(`\n⚠️  Warning: Expected 5 cameras, found ${cameras.length}`)
      console.log('   Check your Arlo app to ensure all cameras are online.')
    }

    // Check subscription status
    const withSubscription = arloCameras.filter(c => c.subscription !== 'None').length
    if (withSubscription === 0) {
      console.log('\n⚠️  No active Arlo subscriptions detected')
      console.log('   Some features may require an Arlo Secure subscription')
    }

    // Save camera data
    const dataPath = path.join(__dirname, '..', 'data', 'arlo-cameras.json')
    fs.mkdirSync(path.dirname(dataPath), { recursive: true })
    fs.writeFileSync(dataPath, JSON.stringify(arloCameras, null, 2))
    console.log(`\n💾 Camera data saved to: ${dataPath}`)

    console.log('\n🎉 Next Steps:')
    console.log('   1. Run: node scripts/test-stream.js')
    console.log('   2. Start building the Eufy service (Week 1)')
    console.log('   3. Check docs/development/PHASE_5_DIRECT_INTEGRATION.md')

    // Test snapshot capability (optional)
    console.log('\n📸 Testing snapshot capability...')
    try {
      const firstCamera = cameras[0]
      console.log(`   Requesting snapshot from: ${firstCamera.deviceName}`)
      
      const snapshot = await arlo.getSnapshot(firstCamera)
      if (snapshot) {
        console.log('   ✅ Snapshot API works!')
        console.log(`   Snapshot URL received (${snapshot.url ? 'valid' : 'pending'})`)
      } else {
        console.log('   ⚠️  Snapshot request sent, may take 5-10 seconds')
      }
    } catch (snapError) {
      console.log('   ℹ️  Snapshot test skipped (requires active session)')
    }

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Connection failed!')
    console.error(`   Error: ${error.message}`)
    
    if (error.message.includes('authentication') || error.message.includes('login')) {
      console.log('\n💡 Tips:')
      console.log('   - Check your email/password')
      console.log('   - If you use 2FA, check for verification code')
      console.log('   - Try logging into my.arlo.com first')
      console.log('   - Arlo may require email verification for new devices')
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
testArloConnection()
