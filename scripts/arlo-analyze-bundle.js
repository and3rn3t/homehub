/**
 * Arlo JavaScript Bundle Analyzer
 *
 * Analyzes Arlo web app JavaScript bundles to find:
 * - Token generation logic
 * - HTTP interceptor code
 * - Secret keys
 * - Signature algorithms
 *
 * Usage (in Chrome DevTools Console):
 *   1. Copy this entire script
 *   2. Paste into Console tab on my.arlo.com (while logged in)
 *   3. Press Enter to run
 *   4. Copy output and save to: data/arlo-bundle-analysis.json
 */

;(function () {
  console.log('🔍 Arlo JavaScript Bundle Analyzer')
  console.log('═'.repeat(60))

  const results = {
    timestamp: new Date().toISOString(),
    findings: [],
    scripts: [],
    localStorage: {},
    sessionStorage: {},
    cookies: {},
    networkInterceptors: [],
  }

  // 1. Capture all localStorage
  console.log('\n📦 Analyzing localStorage...')
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    const value = localStorage.getItem(key)
    results.localStorage[key] = value
  }
  console.log(`   Found ${Object.keys(results.localStorage).length} items`)

  // 2. Capture all sessionStorage
  console.log('\n📦 Analyzing sessionStorage...')
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    const value = sessionStorage.getItem(key)
    results.sessionStorage[key] = value
  }
  console.log(`   Found ${Object.keys(results.sessionStorage).length} items`)

  // 3. Capture cookies
  console.log('\n🍪 Analyzing cookies...')
  document.cookie.split(';').forEach(cookie => {
    const [name, value] = cookie.split('=').map(s => s.trim())
    if (name) results.cookies[name] = value
  })
  console.log(`   Found ${Object.keys(results.cookies).length} cookies`)

  // 4. List all loaded scripts
  console.log('\n📜 Analyzing loaded scripts...')
  const scripts = Array.from(document.querySelectorAll('script[src]'))
  scripts.forEach(script => {
    results.scripts.push({
      src: script.src,
      async: script.async,
      defer: script.defer,
      type: script.type,
    })
  })
  console.log(`   Found ${results.scripts.length} external scripts`)

  // 5. Search for HTTP interceptors
  console.log('\n🔍 Searching for HTTP interceptors...')

  // Check for Axios
  if (window.axios) {
    console.log('   ✅ Found: axios')
    results.networkInterceptors.push({
      type: 'axios',
      interceptors: {
        request: window.axios.interceptors.request.handlers.length,
        response: window.axios.interceptors.response.handlers.length,
      },
    })

    // Try to extract interceptor logic
    if (window.axios.interceptors.request.handlers.length > 0) {
      console.log('   🎯 Axios request interceptors detected!')
      results.findings.push({
        type: 'interceptor',
        library: 'axios',
        location: 'window.axios.interceptors.request',
        note: 'Check handlers array for auth logic',
      })
    }
  }

  // Check for fetch wrapper
  if (window.fetch.toString().includes('native code') === false) {
    console.log('   ✅ Found: Custom fetch wrapper')
    results.networkInterceptors.push({
      type: 'fetch',
      note: 'fetch has been wrapped/modified',
    })
    results.findings.push({
      type: 'interceptor',
      library: 'fetch',
      location: 'window.fetch',
      note: 'fetch function has been overridden',
    })
  }

  // Check for XMLHttpRequest wrapper
  const xhrPrototype = XMLHttpRequest.prototype
  if (xhrPrototype.open.toString().includes('native code') === false) {
    console.log('   ✅ Found: Custom XMLHttpRequest wrapper')
    results.networkInterceptors.push({
      type: 'XMLHttpRequest',
      note: 'XHR.open has been wrapped/modified',
    })
    results.findings.push({
      type: 'interceptor',
      library: 'XMLHttpRequest',
      location: 'XMLHttpRequest.prototype.open',
      note: 'XHR has been intercepted',
    })
  }

  // 6. Search window object for auth-related properties
  console.log('\n🔍 Searching window object for auth properties...')
  const authKeywords = ['auth', 'token', 'jwt', 'session', 'user', 'arlo']
  const foundProperties = []

  for (const key in window) {
    const lowerKey = key.toLowerCase()
    if (authKeywords.some(keyword => lowerKey.includes(keyword))) {
      try {
        const value = window[key]
        if (value && typeof value === 'object' && value.constructor.name !== 'Window') {
          foundProperties.push({
            key: key,
            type: typeof value,
            constructor: value.constructor.name,
            hasToken: JSON.stringify(value).toLowerCase().includes('token'),
          })
        }
      } catch (e) {
        // Ignore inaccessible properties
      }
    }
  }

  console.log(`   Found ${foundProperties.length} auth-related properties`)
  results.findings.push({
    type: 'window_properties',
    properties: foundProperties,
  })

  // 7. Search for token in memory
  console.log('\n🔍 Searching for authorization tokens...')
  const tokens = []

  // Check localStorage for tokens
  Object.entries(results.localStorage).forEach(([key, value]) => {
    if (
      value &&
      value.length > 100 &&
      (key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('auth') ||
        value.startsWith('eyJ'))
    ) {
      tokens.push({
        source: 'localStorage',
        key: key,
        value: value.substring(0, 100) + '...',
        length: value.length,
        isJWT: value.startsWith('eyJ'),
      })
    }
  })

  // Check sessionStorage for tokens
  Object.entries(results.sessionStorage).forEach(([key, value]) => {
    if (
      value &&
      value.length > 100 &&
      (key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('auth') ||
        value.startsWith('eyJ'))
    ) {
      tokens.push({
        source: 'sessionStorage',
        key: key,
        value: value.substring(0, 100) + '...',
        length: value.length,
        isJWT: value.startsWith('eyJ'),
      })
    }
  })

  console.log(`   Found ${tokens.length} potential tokens`)
  results.findings.push({
    type: 'tokens',
    tokens: tokens,
  })

  // 8. Instructions for manual investigation
  console.log('\n' + '═'.repeat(60))
  console.log('📋 MANUAL INVESTIGATION INSTRUCTIONS')
  console.log('═'.repeat(60))

  console.log('\n1️⃣  Intercept next API request:')
  console.log('   const oldFetch = window.fetch;')
  console.log('   window.fetch = function(...args) {')
  console.log('     console.log("Fetch:", args);')
  console.log('     return oldFetch.apply(this, args);')
  console.log('   };')

  console.log('\n2️⃣  Find token generation:')
  console.log('   - Go to Sources tab')
  console.log('   - Press Ctrl+Shift+F (search all files)')
  console.log('   - Search for: "Authorization"')
  console.log('   - Search for: "Bearer "')
  console.log('   - Search for: "interceptor"')

  console.log('\n3️⃣  Set breakpoints:')
  console.log('   - Find line that sets Authorization header')
  console.log('   - Set breakpoint and reload page')
  console.log('   - Step through code to find token source')

  console.log('\n4️⃣  Extract secret key:')
  console.log('   - Look for: crypto.createHmac()')
  console.log('   - Look for: jwt.sign()')
  console.log('   - Look for: CryptoJS.HmacSHA256()')
  console.log('   - The secret key is the 2nd parameter')

  // 9. Output results
  console.log('\n' + '═'.repeat(60))
  console.log('✅ ANALYSIS COMPLETE')
  console.log('═'.repeat(60))
  console.log('\n📋 Copy the JSON below and save to: data/arlo-bundle-analysis.json')
  console.log('─'.repeat(60))

  const output = JSON.stringify(results, null, 2)
  console.log(output)

  console.log('─'.repeat(60))
  console.log('\n💡 Next steps:')
  console.log('   1. Save JSON output above')
  console.log('   2. Follow manual investigation instructions')
  console.log('   3. Use Network tab to capture real request')
  console.log('   4. Compare captured headers with localStorage tokens')
  console.log('   5. Find token generation in Sources tab\n')

  return results
})()
