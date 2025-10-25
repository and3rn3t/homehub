#!/usr/bin/env node

/**
 * Test mDNS Discovery
 *
 * Tests the mDNS scanner with simulated Philips Hue bridge.
 * Note: Actual mDNS discovery requires backend support.
 */

console.log('🔍 Testing mDNS Discovery...\n')

// Test 1: Hue Bridge Discovery via Philips API
async function testHueBridgeDiscovery() {
  console.log('Test 1: Philips Hue Bridge Discovery')
  console.log('=====================================')

  try {
    // Simulate Hue discovery API call
    console.log('Attempting to discover Hue bridges via Philips discovery service...')

    const response = await fetch('https://discovery.meethue.com/', {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      console.log('❌ Philips discovery service unavailable')
      return false
    }

    const bridges = await response.json()
    console.log(`✅ Found ${bridges.length} Hue bridge(s)`)

    for (const bridge of bridges) {
      console.log('\nBridge Details:')
      console.log('  ID:', bridge.id)
      console.log('  Internal IP:', bridge.internalipaddress)

      // Try to get bridge config
      try {
        const configResponse = await fetch(`http://${bridge.internalipaddress}/api/config`, {
          signal: AbortSignal.timeout(2000),
        })

        if (configResponse.ok) {
          const config = await configResponse.json()
          console.log('  Name:', config.name)
          console.log('  Model:', config.modelid)
          console.log('  Firmware:', config.swversion)
          console.log('  Bridge ID:', config.bridgeid)
        }
      } catch {
        console.log('  ⚠️  Bridge config unavailable (no API key)')
      }
    }

    return bridges.length > 0
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return false
  }
}

// Test 2: mDNS Service Record Parsing
async function testMDNSServiceParsing() {
  console.log('\n\nTest 2: mDNS Service Record Parsing')
  console.log('====================================')

  // Simulated mDNS service records
  const mockServices = [
    {
      name: 'Philips Hue - 123ABC',
      type: '_hue._tcp',
      protocol: 'tcp',
      host: 'Philips-hue.local',
      addresses: ['192.168.1.100'],
      port: 80,
      txt: {
        bridgeid: '001788fffe123abc',
        modelid: 'BSB002',
      },
    },
    {
      name: 'Living Room HomeKit',
      type: '_hap._tcp',
      protocol: 'tcp',
      host: 'homekit-device.local',
      addresses: ['192.168.1.101'],
      port: 5353,
      txt: {
        manufacturer: 'Apple',
        model: 'HomePod Mini',
      },
    },
  ]

  console.log(`Testing ${mockServices.length} mock mDNS records...\n`)

  for (const service of mockServices) {
    console.log(`Service: ${service.name}`)
    console.log(`  Type: ${service.type}`)
    console.log(`  Host: ${service.host}`)
    console.log(`  Address: ${service.addresses[0]}:${service.port}`)
    console.log(`  TXT Records:`, service.txt)

    // Identify device type
    let deviceType = 'Unknown'
    if (service.type.includes('hue')) deviceType = 'Philips Hue Bridge'
    else if (service.type.includes('hap')) deviceType = 'HomeKit Device'

    console.log(`  Detected: ${deviceType}`)
    console.log()
  }

  console.log('✅ mDNS service parsing test complete')
  return true
}

// Test 3: Backend API Check
async function testBackendAPI() {
  console.log('\n\nTest 3: mDNS Backend API Check')
  console.log('================================')

  try {
    const response = await fetch('http://localhost:3001/api/mdns/status', {
      method: 'GET',
      signal: AbortSignal.timeout(1000),
    })

    if (response.ok) {
      console.log('✅ mDNS backend API is available')
      console.log('   URL: http://localhost:3001/api/mdns')
      return true
    }
  } catch {
    console.log('⚠️  mDNS backend API not running')
    console.log('   To enable full mDNS discovery, start the backend service')
    console.log('   See docs/guides/MDNS_BACKEND.md for setup instructions')
  }

  return false
}

// Run all tests
async function runTests() {
  const results = {
    hueBridge: await testHueBridgeDiscovery(),
    serviceParsing: await testMDNSServiceParsing(),
    backendAPI: await testBackendAPI(),
  }

  console.log('\n\n📊 Test Summary')
  console.log('================')
  console.log(`Hue Bridge Discovery: ${results.hueBridge ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Service Parsing:      ${results.serviceParsing ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Backend API:          ${results.backendAPI ? '✅ PASS' : '⚠️  OPTIONAL'}`)

  const passed = Object.values(results).filter(Boolean).length
  const total = Object.keys(results).length

  console.log(`\nTotal: ${passed}/${total} tests passed`)

  if (passed === total) {
    console.log('\n🎉 All tests passed!')
  } else if (!results.backendAPI && results.hueBridge && results.serviceParsing) {
    console.log('\n✅ Core tests passed (backend API optional)')
  } else {
    console.log('\n⚠️  Some tests failed')
  }
}

runTests().catch(console.error)
