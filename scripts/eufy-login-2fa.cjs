// Interactive Eufy Login with 2FA Support
// Usage: node scripts/eufy-login-2fa.cjs

require('dotenv').config()
const { EufySecurity } = require('eufy-security-client')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, answer => {
      resolve(answer)
    })
  })
}

async function loginWithCaptcha() {
  console.log('🔐 Eufy Security - Interactive 2FA Login\n')

  const email = process.env.EUFY_EMAIL
  const password = process.env.EUFY_PASSWORD

  if (!email || !password) {
    console.log('❌ Set EUFY_EMAIL and EUFY_PASSWORD in .env file first')
    process.exit(1)
  }

  console.log(`Email: ${email}`)
  console.log('Initializing...\n')

  try {
    const eufy = await EufySecurity.initialize({
      username: email,
      password: password,
      country: 'US',
      persistentDir: path.join(__dirname, '..', 'data', 'eufy-data'),
      acceptInvitations: true,
    })

    // Handle captcha event
    eufy.on('captcha request', async (captchaId, captcha) => {
      console.log('\n🖼️  CAPTCHA Required!')
      console.log('A captcha image should be displayed or saved.')
      console.log(`Captcha ID: ${captchaId}`)

      if (captcha) {
        // Save captcha image
        const fs = require('fs')
        const captchaPath = path.join(__dirname, '..', 'data', 'captcha.png')
        fs.writeFileSync(captchaPath, Buffer.from(captcha, 'base64'))
        console.log(`\n📸 Captcha saved to: ${captchaPath}`)
        console.log('Open this image and enter the code you see.\n')
      }

      const captchaCode = await question('Enter captcha code: ')
      eufy.connect({ captcha: { captchaId, captchaCode } })
    })

    // Handle 2FA verification
    eufy.on('tfa request', async () => {
      console.log('\n🔢 Two-Factor Authentication Required!')
      console.log('Check your email or authenticator app for the verification code.\n')

      const tfaCode = await question('Enter 6-digit code: ')
      eufy.connect({ verifyCode: tfaCode })
    })

    // Connection events
    eufy.on('connect', () => {
      console.log('\n✅ Successfully connected to Eufy!')
      discoverDevices(eufy)
    })

    eufy.on('connection error', error => {
      console.log('\n❌ Connection error:', error.message)
      rl.close()
      process.exit(1)
    })

    // Start connection
    console.log('🔄 Attempting to connect...')
    await eufy.connect()
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    rl.close()
    process.exit(1)
  }
}

async function discoverDevices(eufy) {
  console.log('\n📡 Discovering devices...')

  // Wait for sync
  await new Promise(resolve => setTimeout(resolve, 3000))

  const stations = eufy.getStations()
  console.log(`\nStations found: ${Object.keys(stations).length}`)

  let totalCameras = 0
  for (const [, station] of Object.entries(stations)) {
    console.log(`\n📍 ${station.getName()}`)
    console.log(`   Serial: ${station.getSerial()}`)
    console.log(`   Model: ${station.getModel()}`)

    const devices = station.getDevices()
    for (const [, device] of Object.entries(devices)) {
      if (device.isCamera()) {
        totalCameras++
        console.log(`\n   🎥 ${device.getName()}`)
        console.log(`      Model: ${device.getModel()}`)
        console.log(`      Online: ${device.isOnline() ? '🟢' : '🔴'}`)
        console.log(
          `      Battery: ${device.hasBattery() ? device.getBatteryLevel() + '%' : 'Wired'}`
        )
      }
    }
  }

  console.log(`\n\n✨ Total cameras: ${totalCameras}/2 expected`)
  console.log('\n🎉 Success! Credentials are now cached.')
  console.log("Future runs won't need 2FA (until session expires).\n")

  rl.close()
  process.exit(0)
}

loginWithCaptcha()
