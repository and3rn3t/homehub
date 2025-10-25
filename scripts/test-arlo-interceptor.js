/**
 * Arlo HTTP Interceptor Test Script
 *
 * This script tests replicated authentication mechanisms extracted from
 * Arlo's web application HTTP interceptor.
 *
 * Usage:
 *   node scripts/test-arlo-interceptor.js
 *
 * Requirements:
 *   Node.js v18+ (native fetch support)
 */

import crypto from 'crypto'
import fs from 'fs'

// Load captured authentication data
function loadCapturedData() {
  try {
    // Try to load captured request headers
    const headersPath = './data/arlo-request-headers.json'
    if (fs.existsSync(headersPath)) {
      const headers = JSON.parse(fs.readFileSync(headersPath, 'utf-8'))
      console.log('✅ Loaded captured headers from', headersPath)
      return headers
    }
  } catch (error) {
    console.log('⚠️  No captured headers found, using defaults')
  }

  // Fallback to existing auth data
  try {
    const authPath = './data/arlo-real-auth.json'
    if (fs.existsSync(authPath)) {
      const auth = JSON.parse(fs.readFileSync(authPath, 'utf-8'))
      console.log('✅ Loaded auth data from', authPath)
      return auth
    }
  } catch (error) {
    console.log('❌ No auth data found')
  }

  return null
}

// Test 1: Exact Request Replication
async function testExactReplication(capturedHeaders) {
  console.log('\n📋 Test 1: Exact Request Replication')
  console.log('─'.repeat(60))

  if (!capturedHeaders) {
    console.log('⏭️  Skipped - No captured headers available')
    console.log('   Run Phase 1 of reverse engineering guide first')
    return
  }

  try {
    const url = capturedHeaders.url || 'https://myapi.arlo.com/hmsweb/users/devices'
    const headers = capturedHeaders.headers || capturedHeaders

    console.log('🔗 URL:', url)
    console.log('📤 Headers:', JSON.stringify(headers, null, 2))

    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    })

    console.log('📥 Status:', response.status, response.statusText)
    console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()))

    if (response.ok) {
      const data = await response.json()
      console.log('✅ SUCCESS! Response:', JSON.stringify(data, null, 2))
      return true
    } else {
      const text = await response.text()
      console.log('❌ FAILED:', text)
      return false
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    return false
  }
}

// Test 2: JWT Token Analysis
function analyzeJWTToken(token) {
  console.log('\n🔍 Test 2: JWT Token Analysis')
  console.log('─'.repeat(60))

  if (!token) {
    console.log('⏭️  Skipped - No token provided')
    return
  }

  // Check if it's JWT format (starts with eyJ)
  if (!token.startsWith('eyJ')) {
    console.log('⚠️  Token does not appear to be JWT format')
    console.log('   Token format:', token.substring(0, 50) + '...')
    console.log('   Length:', token.length, 'characters')
    return
  }

  console.log('✅ Token appears to be JWT format')

  try {
    // Decode JWT (without verification)
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.log('❌ Invalid JWT structure (expected 3 parts, got', parts.length + ')')
      return
    }

    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString())
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())

    console.log('\n📜 JWT Header:', JSON.stringify(header, null, 2))
    console.log('\n📦 JWT Payload:', JSON.stringify(payload, null, 2))

    // Check expiration
    if (payload.exp) {
      const expiresAt = new Date(payload.exp * 1000)
      const now = new Date()
      const isExpired = now > expiresAt

      console.log('\n⏰ Token Expiration:')
      console.log('   Expires:', expiresAt.toISOString())
      console.log('   Current:', now.toISOString())
      console.log('   Status:', isExpired ? '❌ EXPIRED' : '✅ Valid')

      if (!isExpired) {
        const timeLeft = Math.floor((expiresAt - now) / 1000 / 60)
        console.log('   Time left:', timeLeft, 'minutes')
      }
    }

    // Identify useful fields
    console.log('\n🔑 Key Fields:')
    if (payload.sub) console.log('   User ID:', payload.sub)
    if (payload.iss) console.log('   Issuer:', payload.iss)
    if (payload.aud) console.log('   Audience:', payload.aud)
    if (payload.userId) console.log('   Arlo User ID:', payload.userId)
    if (payload.deviceId) console.log('   Device ID:', payload.deviceId)
  } catch (error) {
    console.error('❌ Error decoding JWT:', error.message)
  }
}

// Test 3: Header Pattern Analysis
function analyzeHeaderPatterns(headers) {
  console.log('\n🔬 Test 3: Header Pattern Analysis')
  console.log('─'.repeat(60))

  if (!headers) {
    console.log('⏭️  Skipped - No headers to analyze')
    return
  }

  console.log('📊 Header Count:', Object.keys(headers).length)
  console.log('\n🔍 Critical Headers:')

  const criticalHeaders = [
    'authorization',
    'auth-version',
    'schemaversion',
    'source',
    'user-agent',
    'x-user-device-id',
    'x-user-device-type',
    'x-timestamp',
    'x-signature',
  ]

  criticalHeaders.forEach(name => {
    const value = headers[name] || headers[name.toLowerCase()]
    if (value) {
      console.log(`   ✅ ${name}: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`)
    } else {
      console.log(`   ⚠️  ${name}: NOT FOUND`)
    }
  })

  // Check for custom Arlo headers
  console.log('\n🏷️  Custom Headers (X-*, Arlo-*):')
  Object.keys(headers).forEach(name => {
    if (name.toLowerCase().startsWith('x-') || name.toLowerCase().startsWith('arlo-')) {
      console.log(`   ${name}: ${headers[name]}`)
    }
  })
}

// Test 4: Request Signature Generation
function testSignatureGeneration(method, path, timestamp, secret) {
  console.log('\n🔐 Test 4: Request Signature Generation')
  console.log('─'.repeat(60))

  if (!secret) {
    console.log('⏭️  Skipped - No secret key provided')
    console.log('   Secret key must be extracted from JavaScript bundle')
    return
  }

  console.log('📝 Method:', method)
  console.log('📝 Path:', path)
  console.log('📝 Timestamp:', timestamp)
  console.log('📝 Secret:', secret.substring(0, 20) + '...')

  // Test common signature algorithms
  console.log('\n🧪 Testing Signature Algorithms:')

  // Algorithm 1: Simple HMAC-SHA256
  const message1 = `${method}|${path}|${timestamp}`
  const hmac1 = crypto.createHmac('sha256', secret)
  hmac1.update(message1)
  const sig1 = hmac1.digest('base64')
  console.log('   HMAC-SHA256 (method|path|timestamp):', sig1)

  // Algorithm 2: HMAC with body hash
  const message2 = `${method.toUpperCase()}\n${path}\n${timestamp}`
  const hmac2 = crypto.createHmac('sha256', secret)
  hmac2.update(message2)
  const sig2 = hmac2.digest('hex')
  console.log('   HMAC-SHA256 (newline-separated, hex):', sig2)

  // Algorithm 3: HMAC with host
  const host = 'myapi.arlo.com'
  const message3 = `${method}|${host}|${path}|${timestamp}`
  const hmac3 = crypto.createHmac('sha256', secret)
  hmac3.update(message3)
  const sig3 = hmac3.digest('base64url')
  console.log('   HMAC-SHA256 (with host, base64url):', sig3)

  console.log('\n💡 Compare these signatures with captured X-Signature header')
}

// Test 5: Device Fingerprinting
function testDeviceFingerprint() {
  console.log('\n🖐️  Test 5: Device Fingerprint Generation')
  console.log('─'.repeat(60))

  // Generate various device ID formats
  const uuid = crypto.randomUUID()
  const hash = crypto.createHash('sha256').update('homehub-node').digest('hex')
  const timestamp = Date.now().toString(36)

  console.log('Device ID Options:')
  console.log('   UUID:', uuid)
  console.log('   SHA256 Hash:', hash)
  console.log('   Timestamp-based:', timestamp)
  console.log('   Combined:', `homehub-${timestamp}-${hash.substring(0, 8)}`)

  console.log('\n💡 Use consistent device ID across requests')
  console.log('   Save to config: X-User-Device-Id')
}

// Main execution
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗')
  console.log('║        Arlo HTTP Interceptor Reverse Engineering         ║')
  console.log('╚═══════════════════════════════════════════════════════════╝')

  const capturedData = loadCapturedData()

  // Extract token and headers
  let token = null
  let headers = null

  if (capturedData) {
    if (capturedData.headers) {
      headers = capturedData.headers
      token =
        headers.authorization?.replace('Bearer ', '') ||
        headers.Authorization?.replace('Bearer ', '')
    } else if (capturedData.localStorage?.time) {
      token = capturedData.localStorage.time
    }
  }

  // Run all tests
  await testExactReplication(capturedData)
  analyzeJWTToken(token)
  analyzeHeaderPatterns(headers)

  // Test signature generation (need secret key from reverse engineering)
  const timestamp = Date.now()
  testSignatureGeneration(
    'GET',
    '/hmsweb/users/devices',
    timestamp,
    'REPLACE_WITH_EXTRACTED_SECRET'
  )

  testDeviceFingerprint()

  console.log('\n' + '═'.repeat(60))
  console.log('✅ Analysis Complete!')
  console.log('\n📋 Next Steps:')
  console.log('   1. Capture real request with Chrome DevTools (see arlo-intercept-network.md)')
  console.log('   2. Save headers to data/arlo-request-headers.json')
  console.log('   3. Re-run this script to analyze captured data')
  console.log('   4. Find secret key in JavaScript bundle')
  console.log('   5. Implement token generation in ArloAdapter.ts')
  console.log('═'.repeat(60) + '\n')
}

main().catch(console.error)
