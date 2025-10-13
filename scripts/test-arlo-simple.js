#!/usr/bin/env node
/**
 * Simple Arlo API Test
 *
 * Direct HTTP test to Arlo Cloud API to verify credentials work
 */

import axios from 'axios'
import 'dotenv/config'

async function simpleArloTest() {
  console.log('🔍 Simple Arlo API Test')
  console.log('='.repeat(70))
  console.log()

  const email = process.env.ARLO_EMAIL
  const password = process.env.ARLO_PASSWORD

  if (!email || !password) {
    console.error('❌ ERROR: Arlo credentials not found in .env!')
    process.exit(1)
  }

  console.log('📧 Email:', email)
  console.log('🔐 Password:', '*'.repeat(password.length))
  console.log()

  try {
    console.log('🔌 Testing Arlo API connectivity...')

    // Try to reach Arlo's auth endpoint
    const authUrl = 'https://myapi.arlo.com/hmsweb/login/v2'

    console.log(`   POST ${authUrl}`)

    const response = await axios.post(
      authUrl,
      {
        email: email,
        password: password,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'arlo/HomeHub',
          Accept: 'application/json',
          'Auth-Version': '2',
        },
        timeout: 30000,
      }
    )

    console.log()
    console.log('✅ Response received!')
    console.log('   Status:', response.status)
    console.log('   Data keys:', Object.keys(response.data || {}))

    if (response.data?.success) {
      console.log()
      console.log('🎉 Authentication successful!')

      if (response.data.data?.token) {
        console.log('   Token received:', response.data.data.token.substring(0, 20) + '...')
      }

      if (response.data.data?.userId) {
        console.log('   User ID:', response.data.data.userId)
      }
    } else {
      console.log()
      console.log('⚠️  Authentication failed')
      console.log('   Response:', JSON.stringify(response.data, null, 2))
    }
  } catch (error) {
    console.log()
    console.error('❌ Request failed!')

    if (error.response) {
      console.error('   Status:', error.response.status)
      console.error('   Status Text:', error.response.statusText)
      console.error('   Data:', JSON.stringify(error.response.data, null, 2))

      if (error.response.status === 401) {
        console.log()
        console.log('💡 401 Unauthorized - Check your credentials:')
        console.log('   - Verify email and password are correct')
        console.log('   - Try logging into my.arlo.com manually')
        console.log('   - Check if account is locked')
      }
    } else if (error.request) {
      console.error('   No response received')
      console.error('   Error:', error.message)
      console.log()
      console.log('💡 Network issue detected:')
      console.log('   - Check internet connection')
      console.log('   - Verify firewall settings')
      console.log('   - Try: curl https://myapi.arlo.com/hmsweb/login/v2')
    } else {
      console.error('   Error:', error.message)
    }

    process.exit(1)
  }
}

simpleArloTest().catch(error => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
