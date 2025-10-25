/**
 * Test Arlo Device List Endpoint with Working Headers
 * Uses the same auth headers that worked for sipInfo endpoint
 * Tests if we can retrieve the full list of cameras
 */

async function testDeviceList() {
  // The device list endpoint (simpler URL, no query params)
  const url = 'https://myapi.arlo.com/hmsweb/users/devices'

  // Same headers that worked for sipInfo (Status 200 OK)
  const headers = {
    accept: 'application/json',
    'accept-language': 'en-US,en;q=0.9',
    'auth-version': '2',
    authorization:
      '2_oVQxGhmXyVsFJcZo3agKwxeW0SPkrsZMMIWShghKUwK8jh7pWobZdMtsqaLby55b5XLiokNTVztaPR0BRfnXjY9w8YEXgVOXJPKe4QG430Zr1ZuNzKRizjBs2G6VwS6K_CroERHLsGAoxfibH49SEcghzPb9PnxYIj8PG4OMGR3Akp73gjuUKqSFsOKekPxXV6RQRcRhzs5x6yTqMP9z4PzeDY2kCwSHXBm0KDcp7bFY52saSPiN29tndnYhez43nt4iRilc3OP9KfHK9D0Do9LgfhFqnsON0_yVoP33GajS3NmWYX4jVh4mnq3LJXFJkSq604WE_a_m7yrFS-pddpE',
    'content-type': 'application/json; charset=utf-8',
    origin: 'https://my.arlo.com',
    priority: 'u=1, i',
    referer: 'https://my.arlo.com/',
    'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    xcloudid: 'K5HYEUA3-2400-336-127845809',
  }

  try {
    console.log('🎯 Testing Device List Endpoint')
    console.log('🔗 URL:', url)
    console.log('📤 Method: GET')
    console.log('📋 Headers:', Object.keys(headers).length, 'headers')
    console.log('')
    console.log('⏳ Sending request...')
    console.log('')

    const response = await fetch(url, {
      method: 'GET',
      headers,
    })

    console.log('📥 Status:', response.status, response.statusText)
    console.log('')

    if (response.ok) {
      const data = await response.json()
      console.log('✅ SUCCESS! Device list retrieved')
      console.log('')

      // Parse the response
      if (data.success && data.data) {
        const devices = data.data
        console.log('📹 Total Devices:', devices.length)
        console.log('')

        // Show each device
        devices.forEach((device, index) => {
          console.log(`Device ${index + 1}:`)
          console.log('  ID:', device.deviceId || device.uniqueId)
          console.log('  Name:', device.deviceName)
          console.log('  Type:', device.deviceType)
          console.log('  Model:', device.modelId)
          console.log('  State:', device.state || 'N/A')
          console.log('  Connection:', device.connectionState || 'N/A')

          // Show camera-specific info if available
          if (device.properties) {
            console.log('  Battery:', device.properties.batteryLevel || 'N/A')
            console.log('  Signal:', device.properties.signalStrength || 'N/A')
          }
          console.log('')
        })

        // Summary
        console.log('═══════════════════════════════════════')
        console.log('✅ AUTHENTICATION WORKING!')
        console.log('═══════════════════════════════════════')
        console.log('')
        console.log('Next steps:')
        console.log('1. Save this response to data/arlo-device-list.json')
        console.log('2. Implement ArloAdapter.ts with these headers')
        console.log('3. Map device properties to HomeHub Device interface')
        console.log('')
      } else {
        console.log('⚠️  Unexpected response format:')
        console.log(JSON.stringify(data, null, 2))
      }
    } else {
      const errorText = await response.text()
      console.log('❌ FAILED. Response:')
      console.log(errorText)
      console.log('')

      if (response.status === 401) {
        console.log('🔑 Status 401: Token expired or invalid')
        console.log('   Solution: Capture fresh request from Chrome DevTools')
      } else if (response.status === 403) {
        console.log('🚫 Status 403: Additional verification needed')
        console.log('   May need to analyze JavaScript bundle for token generation')
      }
    }
  } catch (error) {
    console.error('💥 Error:', error.message)
    console.error('')
    console.error('Stack trace:')
    console.error(error.stack)
  }
}

// Run the test
testDeviceList()
