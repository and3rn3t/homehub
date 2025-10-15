/**
 * Debug URL Encoding for Arlo Proxy
 *
 * Tests if URL encoding/decoding preserves AWS signed URL parameters
 */

// Test URL from your curl example
const testUrl =
  'https://arlolastimage-z2.arlo.com/bd5438f548ec4730966aa68a65c99f24/E9BPXBNZ-336-53101298/AAE3177HA0A49/lastImage.jpg?AWSAccessKeyId=AKIA2BAHQO5QRYN27GG5&Expires=1760565744&Signature=a52wIJeccAJMEXzCSbpkuWT4kCs%3D'

console.log('Original URL:')
console.log(testUrl)
console.log('\n--- Encoding Test ---')

// Step 1: Encode (browser side)
const encoded = encodeURIComponent(testUrl)
console.log('\n1. encodeURIComponent():')
console.log(encoded.substring(0, 150) + '...')

// Step 2: Decode (worker side)
const decoded = decodeURIComponent(encoded)
console.log('\n2. decodeURIComponent():')
console.log(decoded)

// Step 3: Verify match
console.log('\n3. Match check:')
console.log(`Original === Decoded: ${testUrl === decoded}`)

// Step 4: Check query parameters
const originalUrl = new URL(testUrl)
const decodedUrl = new URL(decoded)

console.log('\n4. Query parameter comparison:')
console.log(
  `AWSAccessKeyId match: ${originalUrl.searchParams.get('AWSAccessKeyId') === decodedUrl.searchParams.get('AWSAccessKeyId')}`
)
console.log(
  `Expires match: ${originalUrl.searchParams.get('Expires') === decodedUrl.searchParams.get('Expires')}`
)
console.log(
  `Signature match: ${originalUrl.searchParams.get('Signature') === decodedUrl.searchParams.get('Signature')}`
)

console.log('\n5. Original query params:')
console.log(`  AWSAccessKeyId: ${originalUrl.searchParams.get('AWSAccessKeyId')}`)
console.log(`  Expires: ${originalUrl.searchParams.get('Expires')}`)
console.log(`  Signature: ${originalUrl.searchParams.get('Signature')}`)

console.log('\n6. Decoded query params:')
console.log(`  AWSAccessKeyId: ${decodedUrl.searchParams.get('AWSAccessKeyId')}`)
console.log(`  Expires: ${decodedUrl.searchParams.get('Expires')}`)
console.log(`  Signature: ${decodedUrl.searchParams.get('Signature')}`)

// Step 5: Simulate proxy URL
const proxyUrl = `http://localhost:8788/proxy/${encoded}`
console.log('\n7. Full proxy URL:')
console.log(proxyUrl.substring(0, 100) + '...')
