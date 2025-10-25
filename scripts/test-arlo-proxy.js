/**
 * Test Arlo Proxy - Diagnostic Script
 *
 * Tests the wildcard proxy with a real Arlo image URL to diagnose 403 errors
 */

// Example Arlo lastImage URL (replace with actual from your camera)
const exampleArloImageUrl =
  'https://arlolastimage-z2.arlo.com/bd5438f548ec4730966aa68a65c99f24/E9BPXBNZ-336-53101298/AAE3177HA0A49/lastImage.jpg?AWSAccessKeyId=AKIA2BAHQO5QRYN27GG5&Expires=1760565744&Signature=a52wIJeccAJMEXzCSbpkuWT4kCs%3D'

const proxyBaseUrl = 'http://localhost:8788'

async function testProxy() {
  console.log('🧪 Testing Arlo Proxy...\n')

  // Test 1: Direct request to Arlo (should fail with CORS)
  console.log('Test 1: Direct request to Arlo CDN (expecting CORS error)')
  console.log(`URL: ${exampleArloImageUrl}`)
  try {
    const response = await fetch(exampleArloImageUrl)
    console.log(`✅ Status: ${response.status} ${response.statusText}`)
    console.log(`   Headers:`, Object.fromEntries(response.headers))
  } catch (error) {
    console.log(`❌ Error: ${error.message}`)
  }
  console.log('\n---\n')

  // Test 2: Proxied request
  console.log('Test 2: Proxied request through localhost:8788')
  const encodedUrl = encodeURIComponent(exampleArloImageUrl)
  const proxyUrl = `${proxyBaseUrl}/proxy/${encodedUrl}`
  console.log(`Proxy URL: ${proxyUrl}`)
  console.log(`Encoded URL: ${encodedUrl.substring(0, 100)}...`)

  try {
    const response = await fetch(proxyUrl)
    console.log(`Status: ${response.status} ${response.statusText}`)
    console.log(`Headers:`, Object.fromEntries(response.headers))

    if (response.ok) {
      const contentType = response.headers.get('content-type')
      console.log(`✅ Success! Content-Type: ${contentType}`)

      if (contentType?.includes('image')) {
        const blob = await response.blob()
        console.log(`   Image size: ${blob.size} bytes`)
      } else {
        const text = await response.text()
        console.log(`   Response body: ${text.substring(0, 200)}`)
      }
    } else {
      const text = await response.text()
      console.log(`❌ Failed: ${text}`)
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`)
  }
  console.log('\n---\n')

  // Test 3: Check if proxy is running
  console.log('Test 3: Health check on proxy server')
  try {
    const response = await fetch(`${proxyBaseUrl}/health`)
    console.log(`Status: ${response.status}`)
    if (response.status === 404) {
      console.log('✅ Proxy is running (404 expected for /health endpoint)')
    }
  } catch (error) {
    console.log(`❌ Proxy not running or not accessible: ${error.message}`)
    console.log('   Run: npm run proxy:dev')
  }
  console.log('\n---\n')

  // Test 4: Decode test
  console.log('Test 4: URL encoding/decoding test')
  console.log(`Original URL: ${exampleArloImageUrl}`)
  const encoded = encodeURIComponent(exampleArloImageUrl)
  console.log(`Encoded: ${encoded.substring(0, 100)}...`)
  const decoded = decodeURIComponent(encoded)
  console.log(`Decoded: ${decoded.substring(0, 100)}...`)
  console.log(`Match: ${decoded === exampleArloImageUrl ? '✅' : '❌'}`)
}

testProxy()
  .then(() => {
    console.log('\n✅ Test complete')
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error)
  })
