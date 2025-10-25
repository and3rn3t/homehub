/**
 * Test Proxy DASH Manifest Retrieval
 *
 * This script tests if the Arlo proxy can successfully fetch a DASH manifest (.mpd)
 *
 * Usage: node scripts/test-dash-proxy.js <mpd-url>
 * Example: node scripts/test-dash-proxy.js "https://arlostreaming20659-z2-prod.wowza.arlo.com:80/stream/AAE3177HA0A49_1760480974747.mpd?egressToken=..."
 */

const mpdUrl = process.argv[2]

if (!mpdUrl) {
  console.error('❌ Error: Please provide a DASH manifest URL as argument')
  console.error('Usage: node scripts/test-dash-proxy.js <mpd-url>')
  process.exit(1)
}

console.log('🎬 Testing DASH Manifest Proxy')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('Original URL:', mpdUrl)
console.log('')

// Build proxied URL
const proxyBaseUrl = 'http://localhost:8787'
const encodedUrl = encodeURIComponent(mpdUrl)
const proxiedUrl = `${proxyBaseUrl}/proxy/${encodedUrl}`

console.log('Proxied URL:', proxiedUrl)
console.log('URL Length:', proxiedUrl.length)
console.log('')

async function testProxy() {
  try {
    console.log('📡 Sending request to proxy...')
    const startTime = Date.now()

    const response = await fetch(proxiedUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/dash+xml,*/*;q=0.8',
      },
    })

    const duration = Date.now() - startTime

    console.log('')
    console.log('📊 Response Details:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Status:', response.status, response.statusText)
    console.log('Duration:', duration, 'ms')
    console.log('')

    console.log('Response Headers:')
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`)
    })
    console.log('')

    if (response.ok) {
      const contentType = response.headers.get('content-type')
      const text = await response.text()

      console.log('✅ SUCCESS - Manifest retrieved')
      console.log('Content-Type:', contentType)
      console.log('Content Length:', text.length, 'bytes')
      console.log('')
      console.log('First 500 characters:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(text.substring(0, 500))

      if (text.includes('<?xml')) {
        console.log('')
        console.log('✅ Valid XML manifest detected')
      }

      if (text.includes('<MPD')) {
        console.log('✅ Valid MPEG-DASH manifest detected')
      }
    } else {
      console.log('❌ FAILED - Non-OK response')
      const errorText = await response.text()
      console.log('Error body:', errorText)
    }
  } catch (error) {
    console.error('')
    console.error('❌ ERROR:', error.message)
    console.error('')
    console.error('Stack:', error.stack)
  }
}

// Test direct request too (should fail with CORS)
async function testDirect() {
  console.log('')
  console.log('🔄 Testing direct request (should fail with CORS)...')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  try {
    const response = await fetch(mpdUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/dash+xml,*/*;q=0.8',
      },
    })

    console.log('⚠️ Direct request succeeded:', response.status)
    console.log('(Unexpected - should have CORS error)')
  } catch (error) {
    if (error.message.includes('fetch')) {
      console.log('✅ Expected - Direct request blocked by CORS or network')
    } else {
      console.error('❌ Unexpected error:', error.message)
    }
  }
}

// Run tests
;(async () => {
  await testProxy()
  await testDirect()

  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Test complete!')
})()
