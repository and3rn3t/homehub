// Account Diagnostic Script
// This will show what the APIs can see

require('dotenv').config()
const { EufySecurity } = require('eufy-security-client')
const Arlo = require('node-arlo')
const path = require('path')

console.log('🔍 Camera Account Diagnostic\n')
console.log('='.repeat(60))

async function checkEufy() {
  console.log('\n📱 EUFY ACCOUNT CHECK')
  console.log('-'.repeat(60))

  const email = process.env.EUFY_EMAIL
  const password = process.env.EUFY_PASSWORD

  console.log(`Email: ${email}`)
  console.log(`Password: ${password ? '***' + password.slice(-4) : 'NOT SET'}`)

  try {
    const eufy = await EufySecurity.initialize({
      username: email,
      password: password,
      country: 'US',
      persistentDir: path.join(__dirname, '..', 'data', 'eufy-data'),
    })

    console.log('✅ Authentication: SUCCESS')

    // Wait for sync
    console.log('⏳ Waiting for device sync (5 seconds)...')
    await new Promise(resolve => setTimeout(resolve, 5000))

    const stations = eufy.getStations()
    console.log(`📡 Stations: ${Object.keys(stations).length}`)

    if (Object.keys(stations).length === 0) {
      console.log('\n⚠️  NO STATIONS FOUND')
      console.log('   Possible reasons:')
      console.log('   1. Cameras not set up in Eufy Security app')
      console.log('   2. Wrong email/password')
      console.log('   3. Cameras registered to different account')
      console.log('   4. HomeBase/station not connected to internet')
      console.log('\n   💡 Solution: Open Eufy Security app and verify:')
      console.log('   - Your cameras appear in the app')
      console.log("   - You're logged in with: " + email)
      console.log('   - HomeBase is online (blue light)')
    } else {
      for (const [sn, station] of Object.entries(stations)) {
        console.log(`\n   Station: ${station.getName()}`)
        console.log(`   Serial: ${sn}`)

        const devices = station.getDevices()
        console.log(`   Devices: ${Object.keys(devices).length}`)

        for (const [devSn, device] of Object.entries(devices)) {
          console.log(`      - ${device.getName()} (${device.getModel()})`)
        }
      }
    }
  } catch (error) {
    console.log('❌ Authentication: FAILED')
    console.log(`   Error: ${error.message}`)
  }
}

async function checkArlo() {
  console.log('\n\n📱 ARLO ACCOUNT CHECK')
  console.log('-'.repeat(60))

  const email = process.env.ARLO_EMAIL
  const password = process.env.ARLO_PASSWORD

  console.log(`Email: ${email}`)
  console.log(`Password: ${password ? '***' + password.slice(-4) : 'NOT SET'}`)

  try {
    const arlo = new Arlo()
    await arlo.login(email, password)

    console.log('✅ Authentication: SUCCESS')

    // Wait for device list
    console.log('⏳ Fetching device list...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    const allDevices = arlo.getDevices()
    console.log(`📡 Total Devices: ${allDevices ? allDevices.length : 0}`)

    if (!allDevices || allDevices.length === 0) {
      console.log('\n⚠️  NO DEVICES FOUND')
      console.log('   Possible reasons:')
      console.log('   1. Cameras not set up in Arlo app')
      console.log('   2. Wrong email/password')
      console.log('   3. Cameras registered to different account')
      console.log('   4. Account subscription expired')
      console.log('\n   💡 Solution: Open Arlo app and verify:')
      console.log('   - Your cameras appear in the app')
      console.log("   - You're logged in with: " + email)
      console.log('   - Cameras are online (not red/offline)')
    } else {
      console.log('\n📋 Device Breakdown:')
      const byType = {}

      allDevices.forEach(device => {
        const type = device.deviceType || 'unknown'
        if (!byType[type]) byType[type] = []
        byType[type].push(device)
      })

      for (const [type, devices] of Object.entries(byType)) {
        console.log(`\n   ${type} (${devices.length}):`)
        devices.forEach(d => {
          console.log(`      - ${d.deviceName} (${d.deviceId})`)
          console.log(`        Model: ${d.modelId || 'Unknown'}`)
          console.log(`        State: ${d.state}`)
        })
      }
    }
  } catch (error) {
    console.log('❌ Authentication: FAILED')
    console.log(`   Error: ${error.message}`)
    if (error.message.includes('401')) {
      console.log('   💡 Check: Email/password or 2FA required')
    }
  }
}

async function main() {
  await checkEufy()
  await checkArlo()

  console.log('\n\n' + '='.repeat(60))
  console.log('🏁 Diagnostic Complete')
  console.log('='.repeat(60))
  console.log('\nNext steps:')
  console.log('1. Verify cameras appear in their respective apps')
  console.log("2. Confirm you're using the correct email accounts")
  console.log('3. Check that cameras are online in the apps')
  console.log('4. If devices found: Move to Week 1 tasks!')
  console.log('\n')
}

main().catch(console.error)
