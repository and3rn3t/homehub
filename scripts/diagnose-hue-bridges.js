#!/usr/bin/env node

/**
 * Diagnose Hue Bridge Discovery Issues
 *
 * Investigates why we're seeing 3 bridges when only 1 exists.
 * Tests connectivity to each IP and validates if they're real devices.
 */

console.log('🔍 Diagnosing Hue Bridge Discovery...\n')

async function probeBridge(ip, index) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`Bridge ${index}: ${ip}`)
  console.log('='.repeat(60))

  const tests = {
    ping: false,
    config: false,
    description: false,
    lights: false,
  }

  let configData = null

  // Test 1: Basic connectivity (config endpoint - no auth required)
  console.log('\n1️⃣ Testing basic connectivity...')
  try {
    const response = await fetch(`http://${ip}/api/config`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    })

    tests.ping = response.ok

    if (response.ok) {
      configData = await response.json()
      tests.config = true
      console.log('   ✅ Bridge responds to /api/config')
      console.log(`   Bridge ID: ${configData.bridgeid}`)
      console.log(`   Name: ${configData.name}`)
      console.log(`   Model: ${configData.modelid}`)
      console.log(`   SW Version: ${configData.swversion}`)
      console.log(`   API Version: ${configData.apiversion}`)
      console.log(`   MAC: ${configData.mac}`)
    } else {
      console.log(`   ❌ HTTP ${response.status} - Bridge not responding`)
      return { ip, tests, reachable: false }
    }
  } catch (error) {
    console.log(`   ❌ Connection failed: ${error.message}`)
    return { ip, tests, reachable: false }
  }

  // Test 2: UPnP description
  console.log('\n2️⃣ Testing UPnP description.xml...')
  try {
    const response = await fetch(`http://${ip}/description.xml`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    })

    if (response.ok) {
      tests.description = true
      const xml = await response.text()
      console.log('   ✅ UPnP description available')

      // Extract friendly name from XML
      const nameMatch = xml.match(/<friendlyName>(.*?)<\/friendlyName>/)
      if (nameMatch) {
        console.log(`   Device Name: ${nameMatch[1]}`)
      }
    } else {
      console.log(`   ⚠️  No UPnP description (HTTP ${response.status})`)
    }
  } catch (error) {
    console.log(`   ⚠️  UPnP description failed: ${error.message}`)
  }

  // Test 3: Try to get lights (requires API key, will fail but tells us something)
  console.log('\n3️⃣ Testing light endpoint (auth required)...')
  try {
    const response = await fetch(`http://${ip}/api/noauth/lights`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    })

    if (response.ok) {
      const lights = await response.json()
      // This shouldn't work without auth, but let's check
      if (Array.isArray(lights) || typeof lights === 'object') {
        tests.lights = true
        const lightCount = Object.keys(lights).length
        console.log(`   ⚠️  Unexpected: Got ${lightCount} lights without auth!`)
      }
    } else if (response.status === 401 || response.status === 403) {
      console.log('   ✅ Auth required (expected) - bridge is secure')
    } else {
      const data = await response.json()
      if (data[0]?.error?.type === 1) {
        console.log('   ✅ Bridge responds (unauthorized user)')
      } else {
        console.log(`   ⚠️  Unexpected response: ${JSON.stringify(data)}`)
      }
    }
  } catch (error) {
    console.log(`   ⚠️  Light endpoint test failed: ${error.message}`)
  }

  // Network analysis
  console.log('\n4️⃣ Network Analysis...')
  const subnet = ip.split('.').slice(0, 3).join('.')
  console.log(`   Subnet: ${subnet}.x`)

  if (configData) {
    const isReservedIP = ip.endsWith('.1') || ip.endsWith('.254')
    console.log(`   Reserved IP: ${isReservedIP ? '⚠️  Yes (unusual)' : '✅ No'}`)

    // Check if zigbee channel is set
    if (configData.zigbeechannel) {
      console.log(`   Zigbee Channel: ${configData.zigbeechannel}`)
    }

    // Check if DHCP
    if (configData.dhcp !== undefined) {
      console.log(`   DHCP: ${configData.dhcp ? 'Yes' : 'No (static IP)'}`)
    }
  }

  return {
    ip,
    tests,
    reachable: true,
    config: configData,
    subnet,
  }
}

async function analyzeResults(results) {
  console.log('\n\n')
  console.log('═'.repeat(60))
  console.log('📊 ANALYSIS SUMMARY')
  console.log('═'.repeat(60))

  const reachable = results.filter(r => r.reachable)
  const unreachable = results.filter(r => !r.reachable)

  console.log(`\n✅ Reachable bridges: ${reachable.length}`)
  console.log(`❌ Unreachable bridges: ${unreachable.length}`)

  if (unreachable.length > 0) {
    console.log('\n⚠️  LIKELY ISSUE: Stale entries in Philips discovery service')
    console.log('   The following IPs are listed but not responding:')
    unreachable.forEach(r => console.log(`   - ${r.ip}`))
    console.log('\n   These could be:')
    console.log('   • Old IP addresses from before DHCP renewal')
    console.log('   • Bridges that were moved to different network')
    console.log('   • Test/development bridges that no longer exist')
    console.log('   • Philips discovery cache not clearing old entries')
  }

  if (reachable.length > 1) {
    console.log('\n⚠️  Multiple reachable bridges detected!')
    console.log("   Checking if they're actually different devices...\n")

    const bridgeIds = new Set(reachable.map(r => r.config?.bridgeid).filter(Boolean))
    console.log(`   Unique Bridge IDs: ${bridgeIds.size}`)

    if (bridgeIds.size < reachable.length) {
      console.log('   ⚠️  SAME DEVICE on multiple IPs (multi-homed or network issue)')
    } else {
      console.log('   ✅ These are genuinely different physical bridges')
    }

    // Check subnets
    const subnets = new Set(reachable.map(r => r.subnet))
    if (subnets.size > 1) {
      console.log(`\n   Multiple subnets detected: ${Array.from(subnets).join(', ')}`)
      console.log('   Possible causes:')
      console.log('   • Multiple WiFi networks')
      console.log('   • VLANs or network segmentation')
      console.log('   • VPN or virtual network interfaces')
    }
  }

  if (reachable.length === 1) {
    console.log('\n✅ Good news! Only 1 bridge is actually reachable')
    console.log(`   Your real hub: ${reachable[0].ip}`)
    console.log(`   Name: ${reachable[0].config?.name || 'Unknown'}`)
    console.log(`   Bridge ID: ${reachable[0].config?.bridgeid || 'Unknown'}`)
  }

  console.log('\n' + '═'.repeat(60))
  console.log('💡 RECOMMENDATION')
  console.log('═'.repeat(60))

  if (reachable.length === 1) {
    const bridge = reachable[0]
    console.log(`\nUse this IP for HomeHub configuration: ${bridge.ip}`)
    console.log(`Bridge Name: ${bridge.config?.name || 'Hue Bridge'}`)
    console.log('\nNext steps:')
    console.log('1. Press the button on your physical Hue bridge')
    console.log('2. Run the pairing script to get an API key')
    console.log('3. Add the bridge to HomeHub with the API key')
  } else if (reachable.length > 1) {
    console.log('\nYou have multiple reachable bridges:')
    reachable.forEach((r, i) => {
      console.log(`\nBridge ${i + 1}: ${r.ip}`)
      console.log(`  Name: ${r.config?.name || 'Unknown'}`)
      console.log(`  ID: ${r.config?.bridgeid || 'Unknown'}`)
    })
    console.log('\nChoose the bridge you want to use with HomeHub')
  } else {
    console.log('\n⚠️  No reachable bridges found')
    console.log('Check your network connection and bridge power')
  }
}

async function runDiagnostics() {
  console.log('Fetching bridge list from Philips discovery service...')

  try {
    const response = await fetch('https://discovery.meethue.com/', {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      console.error('❌ Philips discovery service unavailable')
      return
    }

    const bridges = await response.json()
    console.log(`Found ${bridges.length} bridge(s) in discovery service\n`)

    // Probe each bridge
    const results = []
    for (let i = 0; i < bridges.length; i++) {
      const bridge = bridges[i]
      const result = await probeBridge(bridge.internalipaddress, i + 1)
      results.push(result)
    }

    // Analyze results
    await analyzeResults(results)
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message)
  }
}

runDiagnostics().catch(console.error)
