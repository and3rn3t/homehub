// Simplified Arlo Test - Using node-arlo library
// Usage: node scripts/test-arlo-simple.cjs

require('dotenv').config()
const Arlo = require('node-arlo')

async function testArlo() {
  console.log('🎥 Arlo Camera Test (Simplified)\n')

  const email = process.env.ARLO_EMAIL
  const password = process.env.ARLO_PASSWORD

  if (!password) {
    console.log('❌ ARLO_PASSWORD not set in .env file')
    process.exit(1)
  }

  console.log(`Connecting as: ${email}`)
  console.log('Please wait...\n')

  try {
    const arlo = new Arlo()

    // Login
    await arlo.login(email, password)
    console.log('✅ Connected to Arlo!\n')

    // Get base stations
    const basestations = arlo.getDevices('basestation')
    console.log(`📡 Base stations: ${basestations ? basestations.length : 0}`)

    // Get cameras
    const cameras = arlo.getDevices('camera')
    console.log(`📡 Cameras: ${cameras ? cameras.length : 0}`)

    // Get doorbells
    const doorbells = arlo.getDevices('doorbell')
    console.log(`📡 Doorbells: ${doorbells ? doorbells.length : 0}\n`)

    if (cameras && cameras.length > 0) {
      console.log('🎥 Camera Details:\n')
      cameras.forEach((camera, index) => {
        console.log(`${index + 1}. ${camera.deviceName}`)
        console.log(`   Type: ${camera.deviceType}`)
        console.log(`   Model: ${camera.modelId || 'Unknown'}`)
        console.log(`   ID: ${camera.deviceId}`)
        console.log(`   State: ${camera.state}\n`)
      })
    }

    if (doorbells && doorbells.length > 0) {
      console.log('🔔 Doorbell Details:\n')
      doorbells.forEach((doorbell, index) => {
        console.log(`${index + 1}. ${doorbell.deviceName}`)
        console.log(`   Type: ${doorbell.deviceType}`)
        console.log(`   Model: ${doorbell.modelId || 'Unknown'}`)
        console.log(`   ID: ${doorbell.deviceId}`)
        console.log(`   State: ${doorbell.state}\n`)
      })
    }

    const totalDevices = (cameras ? cameras.length : 0) + (doorbells ? doorbells.length : 0)
    console.log(`✨ Total devices found: ${totalDevices}`)
    console.log('Expected: 5 (1 doorbell + 2 Pro 4 + 2 Essential)\n')

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    if (error.message.includes('401')) {
      console.log('\n💡 Authentication failed. Check your email/password.')
      console.log('   If you have 2FA enabled, check for verification code.')
    }
    console.error('\nFull error:', error)
    process.exit(1)
  }
}

testArlo()
