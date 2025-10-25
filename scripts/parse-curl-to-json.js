/**
 * Parse cURL Command to JSON
 *
 * Converts a cURL command (from Chrome DevTools "Copy as cURL")
 * into a structured JSON format for analysis.
 *
 * Usage:
 *   1. Copy request as cURL from Chrome DevTools
 *   2. Save to: scripts/arlo-captured-request.txt
 *   3. Run: node scripts/parse-curl-to-json.js
 */

import fs from 'fs'

function parseCurlCommand(curlString) {
  console.log('🔍 Parsing cURL command...\n')

  const result = {
    url: '',
    method: 'GET',
    headers: {},
    data: null,
    cookies: {},
  }

  // Extract URL (try multiple quote styles)
  let urlMatch = curlString.match(/curl\s+'([^']+)'/) // Single quotes
  if (!urlMatch) {
    urlMatch = curlString.match(/curl\s+"([^"]+)"/) // Double quotes
  }
  if (!urlMatch) {
    urlMatch = curlString.match(/curl\s+\$'([^']+)'/) // ANSI-C quoting ($'...')
  }
  if (!urlMatch) {
    // Try without quotes (Windows style)
    urlMatch = curlString.match(/curl\s+(https?:\/\/[^\s\\]+)/)
  }

  if (urlMatch) {
    result.url = urlMatch[1]
    console.log('✅ URL:', result.url)
  } else {
    console.error('❌ Could not extract URL from cURL command')
    console.error(
      "Expected format: curl 'https://...' or curl \"https://...\" or curl $'https://...'"
    )
    console.error('First 200 chars:', curlString.substring(0, 200))
  }

  // Extract method
  const methodMatch = curlString.match(/-X\s+(\w+)/)
  if (methodMatch) {
    result.method = methodMatch[1]
    console.log('✅ Method:', result.method)
  }

  // Extract headers (try both single and double quotes)
  let headerRegex = /-H\s+'([^:]+):\s*([^']+)'/g
  let headerMatch
  let headerCount = 0

  // First try single quotes
  while ((headerMatch = headerRegex.exec(curlString)) !== null) {
    const headerName = headerMatch[1]
    const headerValue = headerMatch[2]

    // Separate cookies from other headers
    if (headerName.toLowerCase() === 'cookie') {
      // Parse cookies
      const cookiePairs = headerValue.split('; ')
      cookiePairs.forEach(pair => {
        const [name, value] = pair.split('=')
        if (name && value) {
          result.cookies[name.trim()] = value.trim()
        }
      })
    } else {
      result.headers[headerName] = headerValue
      headerCount++
    }
  }

  // If no headers found with single quotes, try double quotes
  if (headerCount === 0) {
    headerRegex = /-H\s+"([^:]+):\s*([^"]+)"/g
    while ((headerMatch = headerRegex.exec(curlString)) !== null) {
      const headerName = headerMatch[1]
      const headerValue = headerMatch[2]

      if (headerName.toLowerCase() === 'cookie') {
        const cookiePairs = headerValue.split('; ')
        cookiePairs.forEach(pair => {
          const [name, value] = pair.split('=')
          if (name && value) {
            result.cookies[name.trim()] = value.trim()
          }
        })
      } else {
        result.headers[headerName] = headerValue
        headerCount++
      }
    }
  }

  console.log('✅ Headers:', headerCount, 'found')
  console.log('✅ Cookies:', Object.keys(result.cookies).length, 'found')

  // Extract data/body
  const dataMatch = curlString.match(/--data-raw '([^']+)'/)
  if (dataMatch) {
    try {
      result.data = JSON.parse(dataMatch[1])
      console.log('✅ Request Body: JSON parsed')
    } catch {
      result.data = dataMatch[1]
      console.log('✅ Request Body: Raw string')
    }
  }

  return result
}

function analyzeRequest(parsed) {
  console.log('\n' + '═'.repeat(60))
  console.log('📊 REQUEST ANALYSIS')
  console.log('═'.repeat(60))

  // Analyze URL
  console.log('\n🔗 URL Analysis:')
  console.log('   Full URL:', parsed.url)
  try {
    const url = new URL(parsed.url)
    console.log('   Protocol:', url.protocol)
    console.log('   Host:', url.hostname)
    console.log('   Path:', url.pathname)
    if (url.search) console.log('   Query:', url.search)
  } catch (error) {
    console.log('   ⚠️  Unable to parse URL')
  }

  // Analyze critical headers
  console.log('\n🔑 Critical Authentication Headers:')
  const authHeaders = [
    'authorization',
    'auth-version',
    'schemaversion',
    'x-user-device-id',
    'x-user-device-type',
    'x-timestamp',
    'x-signature',
  ]

  authHeaders.forEach(name => {
    const value =
      parsed.headers[name] ||
      parsed.headers[name.toLowerCase()] ||
      parsed.headers[Object.keys(parsed.headers).find(k => k.toLowerCase() === name)]

    if (value) {
      console.log(`   ✅ ${name}:`, value.substring(0, 80) + (value.length > 80 ? '...' : ''))

      // Special analysis for Authorization header
      if (name === 'authorization' && value.startsWith('Bearer eyJ')) {
        console.log('      → JWT token detected (starts with eyJ)')
        try {
          const token = value.replace('Bearer ', '')
          const parts = token.split('.')
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())

          if (payload.exp) {
            const expDate = new Date(payload.exp * 1000)
            const isExpired = Date.now() > payload.exp * 1000
            console.log(
              `      → Expires: ${expDate.toISOString()} (${isExpired ? 'EXPIRED' : 'Valid'})`
            )
          }

          if (payload.userId || payload.sub) {
            console.log(`      → User ID: ${payload.userId || payload.sub}`)
          }
        } catch (e) {
          console.log('      → Unable to decode JWT')
        }
      }
    } else {
      console.log(`   ⚠️  ${name}: NOT FOUND`)
    }
  })

  // Analyze all headers
  console.log('\n📋 All Headers (' + Object.keys(parsed.headers).length + '):')
  Object.entries(parsed.headers).forEach(([name, value]) => {
    console.log(`   ${name}: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`)
  })

  // Analyze cookies
  if (Object.keys(parsed.cookies).length > 0) {
    console.log('\n🍪 Cookies (' + Object.keys(parsed.cookies).length + '):')
    Object.entries(parsed.cookies).forEach(([name, value]) => {
      console.log(`   ${name}: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`)
    })
  }

  // Analyze body
  if (parsed.data) {
    console.log('\n📦 Request Body:')
    console.log(JSON.stringify(parsed.data, null, 2))
  }
}

function generateFetchCode(parsed) {
  console.log('\n' + '═'.repeat(60))
  console.log('🚀 GENERATED FETCH CODE')
  console.log('═'.repeat(60))
  console.log()

  const code = `
/**
 * Test Arlo API Request with Captured Headers
 * Auto-generated by parse-curl-to-json.js
 * Node.js v18+ with native fetch support
 */

async function testArloRequest() {
  const url = '${parsed.url}';

  const headers = ${JSON.stringify(parsed.headers, null, 4)};

  ${
    Object.keys(parsed.cookies).length > 0
      ? `
  // Add cookies to request
  const cookies = ${JSON.stringify(parsed.cookies, null, 4)};
  headers['cookie'] = Object.entries(cookies)
    .map(([name, value]) => \`\${name}=\${value}\`)
    .join('; ');
  `
      : ''
  }

  try {
    console.log('🔗 Testing request to:', url);
    console.log('📤 Method:', '${parsed.method}');
    console.log('📋 Headers:', Object.keys(headers).length, 'headers');
    console.log('');

    const response = await fetch(url, {
      method: '${parsed.method}',
      headers,
      ${parsed.data ? `body: ${typeof parsed.data === 'string' ? `'${parsed.data}'` : JSON.stringify(parsed.data, null, 4)}` : ''}
    });

    console.log('📥 Status:', response.status, response.statusText);
    console.log('');

    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! Response:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('❌ FAILED. Response:');
      console.log(text);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testArloRequest().catch(console.error);
`

  console.log(code)

  // Save to file
  const outputPath = './scripts/test-arlo-exact-request.js'
  fs.writeFileSync(outputPath, code)
  console.log('✅ Generated code saved to:', outputPath)
}

function saveToJSON(parsed) {
  const outputPath = './data/arlo-request-headers.json'
  const data = {
    url: parsed.url,
    method: parsed.method,
    headers: parsed.headers,
    cookies: parsed.cookies,
    data: parsed.data,
    captured_at: new Date().toISOString(),
  }

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2))
  console.log('\n✅ Saved parsed request to:', outputPath)
}

// Main execution
function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗')
  console.log('║            cURL to JSON Parser for Arlo API              ║')
  console.log('╚═══════════════════════════════════════════════════════════╝')
  console.log()

  const inputPath = './scripts/arlo-captured-request.txt'

  if (!fs.existsSync(inputPath)) {
    console.error('❌ Error: Input file not found:', inputPath)
    console.log('\n📋 Instructions:')
    console.log('   1. Login to https://my.arlo.com/ in Chrome')
    console.log('   2. Open DevTools (F12) → Network tab')
    console.log('   3. Click on a camera to trigger API request')
    console.log('   4. Find request to myapi.arlo.com')
    console.log('   5. Right-click → Copy → Copy as cURL (bash)')
    console.log('   6. Paste into: scripts/arlo-captured-request.txt')
    console.log('   7. Run this script again\n')
    process.exit(1)
  }

  const curlCommand = fs.readFileSync(inputPath, 'utf-8')

  if (curlCommand.trim().length < 20) {
    console.error('❌ Error: Input file appears empty or invalid')
    console.log('   File path:', inputPath)
    console.log('   Content length:', curlCommand.length, 'bytes')
    process.exit(1)
  }

  console.log('✅ Loaded cURL command from:', inputPath)
  console.log('   Length:', curlCommand.length, 'bytes\n')

  const parsed = parseCurlCommand(curlCommand)

  // Validate that we got a URL
  if (!parsed.url) {
    console.error('\n❌ Error: Failed to parse URL from cURL command')
    console.error('\n📋 Common Issues:')
    console.error('   1. Make sure you copied "Copy as cURL (bash)" not "Copy as PowerShell"')
    console.error("   2. The file should start with: curl 'https://myapi.arlo.com/...")
    console.error('   3. Or on Windows: curl "https://myapi.arlo.com/...')
    console.error('\n📝 Your file contains:')
    console.error('   First 300 characters:')
    console.error('   ' + curlCommand.substring(0, 300))
    console.error('\n💡 Try these steps:')
    console.error('   1. In Chrome DevTools Network tab')
    console.error('   2. Right-click the request to myapi.arlo.com')
    console.error('   3. Select: Copy → Copy as cURL (bash)  [NOT PowerShell!]')
    console.error('   4. Paste into scripts/arlo-captured-request.txt')
    console.error('   5. Save and run this script again\n')
    process.exit(1)
  }

  // Warn if this is an OPTIONS request (CORS preflight)
  if (parsed.method === 'OPTIONS') {
    console.warn('\n⚠️  WARNING: This is an OPTIONS request (CORS preflight)')
    console.warn("   This won't contain the actual API data!")
    console.warn('\n💡 Correct steps:')
    console.warn('   1. In Network tab, look for the POST or GET request')
    console.warn('   2. The URL should end with: /hmsweb/users/devices')
    console.warn('   3. NOT: /notify/ or OPTIONS method')
    console.warn('   4. Copy that request instead\n')
    console.warn('Continuing anyway for analysis purposes...\n')
  }

  analyzeRequest(parsed)
  generateFetchCode(parsed)
  saveToJSON(parsed)

  console.log('\n' + '═'.repeat(60))
  console.log('✅ Parsing Complete!')
  console.log('\n📋 Next Steps:')
  console.log('   1. Review generated code: scripts/test-arlo-exact-request.js')
  console.log('   2. Run: node scripts/test-arlo-exact-request.js')
  console.log('   3. If it works (200 status), analyze what makes it work')
  console.log('   4. If it fails (401/403), compare with browser request')
  console.log('   5. Run: node scripts/test-arlo-interceptor.js')
  console.log('═'.repeat(60) + '\n')
}

main()
