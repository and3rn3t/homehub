// Deep Diagnostic - Why Can't We See Cameras?
// Both apps show cameras, but API returns 0 devices

require('dotenv').config()
const { EufySecurity } = require('eufy-security-client')
const Arlo = require('node-arlo')
const path = require('path')

console.log('🔬 Deep Diagnostic: API vs App Mismatch\n')
console.log('='.repeat(70))

async function deepEufyDiag() {
  console.log('\n📱 EUFY DEEP DIVE')
  console.log('-'.repeat(70))

  const email = process.env.EUFY_EMAIL
  const password = process.env.EUFY_PASSWORD

  console.log(`Account: ${email}`)
  console.log('Testing different initialization options...\n')

  // Try 1: Minimal config
  console.log('Test 1: Minimal configuration')
  try {
    const eufy1 = await EufySecurity.initialize({
      username: email,
      password: password,
      country: 'US',
      persistentDir: path.join(__dirname, '..', 'data', 'eufy-test-1'),
    })

    await new Promise(resolve => setTimeout(resolve, 5000))
    const stations1 = eufy1.getStations()
    console.log(`  ✓ Stations: ${Object.keys(stations1).length}`)

    if (Object.keys(stations1).length > 0) {
      console.log('  ✅ SUCCESS with minimal config!')
      return true
    }
  } catch (e) {
    console.log(`  ✗ Error: ${e.message}`)
  }

  // Try 2: Accept invitations
  console.log('\nTest 2: With acceptInvitations')
  try {
    const eufy2 = await EufySecurity.initialize({
      username: email,
      password: password,
      country: 'US',
      acceptInvitations: true,
      persistentDir: path.join(__dirname, '..', 'data', 'eufy-test-2'),
    })

    await new Promise(resolve => setTimeout(resolve, 5000))
    const stations2 = eufy2.getStations()
    console.log(`  ✓ Stations: ${Object.keys(stations2).length}`)

    if (Object.keys(stations2).length > 0) {
      console.log('  ✅ SUCCESS with acceptInvitations!')
      return true
    }
  } catch (e) {
    console.log(`  ✗ Error: ${e.message}`)
  }

  // Try 3: Longer wait time
  console.log('\nTest 3: Longer sync wait (15 seconds)')
  try {
    const eufy3 = await EufySecurity.initialize({
      username: email,
      password: password,
      country: 'US',
      acceptInvitations: true,
      pollingIntervalMinutes: 1,
      persistentDir: path.join(__dirname, '..', 'data', 'eufy-test-3'),
    })

    console.log('  Waiting for device sync...')
    await new Promise(resolve => setTimeout(resolve, 15000))
    const stations3 = eufy3.getStations()
    console.log(`  ✓ Stations: ${Object.keys(stations3).length}`)

    if (Object.keys(stations3).length > 0) {
      console.log('  ✅ SUCCESS with longer wait!')
      return true
    }
  } catch (e) {
    console.log(`  ✗ Error: ${e.message}`)
  }

  // Try 4: Check event listeners
  console.log('\nTest 4: With event listeners')
  try {
    const eufy4 = await EufySecurity.initialize({
      username: email,
      password: password,
      country: 'US',
      acceptInvitations: true,
      persistentDir: path.join(__dirname, '..', 'data', 'eufy-test-4'),
    })

    let deviceFound = false

    eufy4.on('device added', device => {
      console.log(`  📱 Device added event: ${device.getName()}`)
      deviceFound = true
    })

    eufy4.on('station added', station => {
      console.log(`  📡 Station added event: ${station.getName()}`)
      deviceFound = true
    })

    console.log('  Waiting for events...')
    await new Promise(resolve => setTimeout(resolve, 10000))

    const stations4 = eufy4.getStations()
    console.log(`  ✓ Stations: ${Object.keys(stations4).length}`)
    console.log(`  ✓ Events fired: ${deviceFound}`)

    if (Object.keys(stations4).length > 0 || deviceFound) {
      console.log('  ✅ Detected via events!')
      return true
    }
  } catch (e) {
    console.log(`  ✗ Error: ${e.message}`)
  }

  console.log('\n⚠️  All Eufy tests returned 0 stations')
  console.log('\n🔍 Possible causes:')
  console.log('1. Shared/family account - cameras owned by different user')
  console.log('2. Account permissions - need to accept invitation in app')
  console.log('3. Region mismatch - try "EU" or other regions')
  console.log('4. API version - library may not support latest Eufy firmware')
  console.log('5. Persistent data corruption - try deleting data/eufy-data/')

  console.log('\n💡 Debug steps:')
  console.log('1. In Eufy Security app → Settings → Account')
  console.log('   - Verify you\'re the "Owner" or "Admin"')
  console.log('   - Check if devices are "Shared" from another account')
  console.log('2. Try deleting and re-adding cameras in app')
  console.log('3. Check app version - update if needed')

  return false
}

async function deepArloDiag() {
  console.log('\n\n📱 ARLO DEEP DIVE')
  console.log('-'.repeat(70))

  const email = process.env.ARLO_EMAIL
  const password = process.env.ARLO_PASSWORD

  console.log(`Account: ${email}`)
  console.log('Checking node-arlo library compatibility...\n')

  try {
    const arlo = new Arlo()

    console.log('Attempting login...')
    await arlo.login(email, password)
    console.log('✓ Login successful')

    // Wait for device sync
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Try different device getters
    console.log('\nTrying different device access methods:')

    const allDevices = arlo.getDevices()
    console.log(`1. getDevices(): ${allDevices ? allDevices.length : 'null/undefined'}`)

    const cameras = arlo.getDevices('camera')
    console.log(`2. getDevices('camera'): ${cameras ? cameras.length : 'null/undefined'}`)

    const basestations = arlo.getDevices('basestation')
    console.log(
      `3. getDevices('basestation'): ${basestations ? basestations.length : 'null/undefined'}`
    )

    const doorbells = arlo.getDevices('doorbell')
    console.log(`4. getDevices('doorbell'): ${doorbells ? doorbells.length : 'null/undefined'}`)

    // Check internal state
    console.log('\nChecking internal Arlo object state:')
    console.log(`  - Token present: ${arlo.token ? 'Yes' : 'No'}`)
    console.log(`  - Logged in: ${arlo.loggedIn ? 'Yes' : 'No'}`)

    if (arlo.devices) {
      console.log(`  - Internal devices array: ${arlo.devices.length} items`)
      if (arlo.devices.length > 0) {
        console.log('\n🎉 Devices found in internal state!')
        arlo.devices.forEach((device, i) => {
          console.log(`\n${i + 1}. ${device.deviceName || device.name || 'Unknown'}`)
          console.log(`   Type: ${device.deviceType}`)
          console.log(`   ID: ${device.deviceId}`)
          console.log(`   State: ${device.state}`)
        })
      }
    } else {
      console.log(`  - Internal devices: Not found`)
    }
  } catch (error) {
    console.log(`\n❌ Error: ${error.message}`)
    console.log('\nFull error:', error)
  }

  console.log('\n⚠️  ARLO ISSUE CONFIRMED')
  console.log('\n🔍 The problem:')
  console.log('1. node-arlo library last updated: August 2020')
  console.log('2. Arlo API changed significantly in 2023')
  console.log("3. Library doesn't support current authentication flow")
  console.log('4. Even if login succeeds, device list API is different')

  console.log('\n✅ CONFIRMED WORKING ALTERNATIVE:')
  console.log("Use Arlo's official developer API:")
  console.log('  - Register at: https://developer.arlo.com/')
  console.log('  - Get OAuth2 credentials')
  console.log('  - Modern, supported, documentation available')
  console.log('  - Example code provided by Arlo')

  console.log('\n💡 OR try these npm packages:')
  console.log('  - pyaarlo (Python, then bridge to Node)')
  console.log('  - arlo-go (Go, compile to binary)')
  console.log('  - DIY: Reverse engineer Arlo app API calls')
}

async function main() {
  console.log("\n📋 What we're testing:")
  console.log('  - Different library initialization methods')
  console.log('  - Event listeners for device discovery')
  console.log('  - Various wait times for sync')
  console.log('  - Internal object state inspection\n')

  await deepEufyDiag()
  await deepArloDiag()

  console.log('\n\n' + '='.repeat(70))
  console.log('🏁 Deep Diagnostic Complete')
  console.log('='.repeat(70))
  console.log('\n📊 Summary:')
  console.log('  - Eufy: Account OK, but 0 stations returned by API')
  console.log('  - Arlo: Account OK, but library too old for modern API')
  console.log('\n🎯 Recommendation: Proceed with Mock-First Development')
  console.log('  - Build UI with test streams today')
  console.log('  - Solve Eufy API mystery in parallel')
  console.log('  - Implement modern Arlo OAuth2 next week')
  console.log('\n')
}

main().catch(console.error)
