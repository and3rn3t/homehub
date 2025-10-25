#!/usr/bin/env node
/**
 * Test Arlo API with Real Browser Cookies
 *
 * This script tests making direct API calls to Arlo using the extracted cookies.
 * It bypasses @koush/arlo entirely and uses fetch with cookie headers.
 */

import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Test Arlo API with cookies
 */
async function testArloWithCookies() {
  try {
    console.log('======================================================================')
    console.log('🎭 Testing Arlo API with Real Browser Cookies')
    console.log('======================================================================\n')

    // Load cookies
    const cookiesPath = path.join(__dirname, '..', 'data', 'arlo-real-auth.json')
    console.log(`📁 Loading cookies from: ${cookiesPath}`)

    const authData = JSON.parse(await readFile(cookiesPath, 'utf-8'))
    console.log(`✅ Loaded ${authData.cookies?.length || 0} cookies`)
    console.log(`✅ Extracted at: ${authData.extractedAt}\n`)

    // Format cookies for HTTP header
    const cookieHeader = authData.cookies.map(c => `${c.name}=${c.value}`).join('; ')

    console.log('🔑 Cookie header prepared (truncated):')
    console.log(`   ${cookieHeader.substring(0, 100)}...\n`)

    // Check for token
    const token = authData.token
    if (token) {
      console.log('🔑 Auth token found!')
      console.log(`   Length: ${token.length} characters`)
      console.log(`   Preview: ${token.substring(0, 50)}...\n`)
    } else {
      console.log('⚠️  No auth token found in extracted data\n')
    }

    // Test 1: Get user profile
    console.log('📱 Test 1: Fetching user profile...')
    const profileResponse = await fetch('https://myapi.arlo.com/hmsweb/users/profile', {
      headers: {
        Cookie: cookieHeader,
        Authorization: token,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Auth-Version': '2',
        Referer: 'https://my.arlo.com/',
      },
    })

    console.log(`   Status: ${profileResponse.status} ${profileResponse.statusText}`)

    if (profileResponse.ok) {
      const profile = await profileResponse.json()
      console.log('   ✅ SUCCESS! Profile data:')
      console.log(`      User ID: ${profile.data?.userId || 'N/A'}`)
      console.log(`      Email: ${profile.data?.email || 'N/A'}`)
      console.log(`      First Name: ${profile.data?.firstName || 'N/A'}\n`)
    } else {
      const errorText = await profileResponse.text()
      console.log(`   ❌ FAILED: ${errorText.substring(0, 200)}\n`)
    }

    // Test 2: Get devices
    console.log('📱 Test 2: Fetching devices...')
    const devicesResponse = await fetch('https://myapi.arlo.com/hmsweb/users/devices', {
      headers: {
        Cookie: cookieHeader,
        Authorization: token,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Auth-Version': '2',
        Referer: 'https://my.arlo.com/',
      },
    })

    console.log(`   Status: ${devicesResponse.status} ${devicesResponse.statusText}`)

    if (devicesResponse.ok) {
      const devices = await devicesResponse.json()
      const deviceList = devices.data || []
      console.log(`   ✅ SUCCESS! Found ${deviceList.length} device(s):\n`)

      deviceList.forEach((device, index) => {
        console.log(`   Device ${index + 1}:`)
        console.log(`      Name: ${device.deviceName || 'N/A'}`)
        console.log(`      Type: ${device.deviceType || 'N/A'}`)
        console.log(`      Model: ${device.modelId || 'N/A'}`)
        console.log(`      ID: ${device.deviceId || 'N/A'}`)
        console.log(`      State: ${device.state || 'N/A'}`)
        if (device.properties) {
          console.log(`      Battery: ${device.properties.batteryLevel || 'N/A'}%`)
          console.log(`      Signal: ${device.properties.signalStrength || 'N/A'}%`)
        }
        console.log('')
      })
    } else {
      const errorText = await devicesResponse.text()
      console.log(`   ❌ FAILED: ${errorText.substring(0, 200)}\n`)
    }

    // Test 3: Get library (recent recordings)
    console.log('📱 Test 3: Fetching library (recent recordings)...')
    const libraryResponse = await fetch('https://myapi.arlo.com/hmsweb/users/library', {
      headers: {
        Cookie: cookieHeader,
        Authorization: token,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Auth-Version': '2',
        Referer: 'https://my.arlo.com/',
      },
    })

    console.log(`   Status: ${libraryResponse.status} ${libraryResponse.statusText}`)

    if (libraryResponse.ok) {
      const library = await libraryResponse.json()
      const recordings = library.data || []
      console.log(`   ✅ SUCCESS! Found ${recordings.length} recent recording(s)`)

      if (recordings.length > 0) {
        const recent = recordings[0]
        console.log(`\n   Most recent recording:`)
        console.log(`      Name: ${recent.name || 'N/A'}`)
        console.log(
          `      Date: ${recent.createdDate ? new Date(recent.createdDate).toLocaleString() : 'N/A'}`
        )
        console.log(`      Duration: ${recent.mediaDurationSecond || 0}s`)
        console.log(`      Thumbnail: ${recent.presignedThumbnailUrl ? 'Available' : 'None'}`)
      }
    } else {
      const errorText = await libraryResponse.text()
      console.log(`   ❌ FAILED: ${errorText.substring(0, 200)}`)
    }

    console.log('\n======================================================================')
    console.log('✅ Cookie test complete!')
    console.log('======================================================================\n')
  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

// Run test
testArloWithCookies()
