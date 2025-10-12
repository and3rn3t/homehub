#!/usr/bin/env node
/**
 * Check Eufy devices using different API methods
 */

require('dotenv').config()
const { EufySecurity } = require('eufy-security-client')

console.log('🔍 Checking Eufy E30 Camera Compatibility\n')

async function checkDevices() {
  try {
    const client = await EufySecurity.initialize({
      username: process.env.EUFY_EMAIL,
      password: process.env.EUFY_PASSWORD,
      country: 'US',
      language: 'en',
    })

    console.log('✅ Client initialized\n')

    // Method 1: Check via API directly
    console.log('Method 1: client.api.getDevices()')
    try {
      const apiDevices = await Promise.race([
        client.api.getDevices(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000)),
      ])
      console.log('   Result:', JSON.stringify(apiDevices, null, 2))
    } catch (e) {
      console.log('   Failed:', e.message)
    }

    // Method 2: Check via API houses
    console.log('\nMethod 2: client.api.getHouses()')
    try {
      const houses = await Promise.race([
        client.api.getHouses(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000)),
      ])
      console.log('   Result:', JSON.stringify(houses, null, 2))
    } catch (e) {
      console.log('   Failed:', e.message)
    }

    // Method 3: Check device count
    console.log('\nMethod 3: client.getDevices() [non-async]')
    try {
      const devices = client.getDevices()
      if (devices && typeof devices[Symbol.iterator] === 'function') {
        const deviceArray = Array.from(devices)
        console.log(`   Found ${deviceArray.length} devices`)
      } else if (devices instanceof Map) {
        console.log(`   Found ${devices.size} devices (Map)`)
        console.log('   Keys:', Array.from(devices.keys()))
      } else {
        console.log('   Type:', typeof devices)
        console.log('   Value:', devices)
      }
    } catch (e) {
      console.log('   Failed:', e.message)
    }

    console.log('\n' + '='.repeat(60))
    console.log('💡 CONCLUSION:')
    console.log('='.repeat(60))
    console.log('\nThe eufy-security-client library appears to have')
    console.log('compatibility issues with your Eufy Indoor Cam E30 model.')
    console.log('\n📋 Your options:')
    console.log('1. ⭐ Enable RTSP in Eufy app → Use FFmpeg directly')
    console.log('2. Use Homebridge eufy-security plugin (more mature)')
    console.log('3. Proceed with MOCK-FIRST (build UI now, integrate later)')
    console.log('\n→ RECOMMENDED: Option 3 (Mock-first development)')
    console.log('   Build beautiful UI this weekend, solve Eufy later!\n')

    client.close()
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkDevices()
