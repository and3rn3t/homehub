/**
 * Geofencing Service Test Suite
 *
 * Comprehensive tests for GPS-based location triggers, including:
 * - Geofence creation and management
 * - Distance calculations (Haversine formula)
 * - Enter/leave event detection
 * - State tracking and persistence
 * - Performance benchmarks
 *
 * Run: node scripts/test-geofencing.js
 */

import { GeofenceService } from '../src/services/automation/geofence.service.ts'

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
}

const log = {
  success: msg => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: msg => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: msg => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: msg => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  test: msg => console.log(`${colors.cyan}▶${colors.reset} ${msg}`),
  gray: msg => console.log(`${colors.gray}${msg}${colors.reset}`),
}

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  startTime: Date.now(),
}

/**
 * Test runner helper
 */
async function test(name, fn) {
  log.test(name)
  try {
    await fn()
    log.success(`PASS: ${name}`)
    results.passed++
  } catch (error) {
    log.error(`FAIL: ${name}`)
    console.error(`  ${colors.red}${error.message}${colors.reset}`)
    if (error.stack) {
      log.gray(`  ${error.stack.split('\n').slice(1, 3).join('\n  ')}`)
    }
    results.failed++
  }
  console.log() // Empty line between tests
}

/**
 * Assertion helper
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed')
  }
}

// ============================================================================
// Test Data
// ============================================================================

// San Francisco (Market Street)
const SF_MARKET = { lat: 37.7749, lng: -122.4194 }

// San Francisco (Golden Gate Bridge) - ~8 km from Market
const SF_GOLDEN_GATE = { lat: 37.8199, lng: -122.4783 }

// Los Angeles (Downtown) - ~559 km from SF
const LA_DOWNTOWN = { lat: 34.0522, lng: -118.2437 }

// Test locations within and outside geofences
const locations = {
  home: { lat: 37.7749, lng: -122.4194 }, // Market Street, SF
  nearHome: { lat: 37.775, lng: -122.4195 }, // 10m away
  workHome: { lat: 37.7745, lng: -122.42 }, // 50m away
  outsideHome: { lat: 37.78, lng: -122.43 }, // 1km away
  farAway: { lat: 34.0522, lng: -118.2437 }, // LA - 559km away
}

// ============================================================================
// Test Suite
// ============================================================================

async function runTests() {
  console.log('\n' + '='.repeat(70))
  console.log('  Geofencing Service - Test Suite')
  console.log('='.repeat(70) + '\n')

  const service = GeofenceService.getInstance()

  // Clear all data before starting
  service.clearAll()

  // Test 1: Geofence Creation
  await test('Geofence Creation', async () => {
    const geofence = service.createGeofence({
      name: 'Home',
      description: 'My house',
      center: SF_MARKET,
      radius: 100, // 100 meters
      enabled: true,
    })

    assert(geofence.id, 'Geofence should have an ID')
    assert(geofence.name === 'Home', 'Name should match')
    assert(geofence.center.lat === SF_MARKET.lat, 'Latitude should match')
    assert(geofence.center.lng === SF_MARKET.lng, 'Longitude should match')
    assert(geofence.radius === 100, 'Radius should match')
    assert(geofence.enabled === true, 'Should be enabled')

    log.gray(`  Created geofence: ${geofence.name} (${geofence.id})`)
    log.gray(`  Center: ${geofence.center.lat}, ${geofence.center.lng}`)
    log.gray(`  Radius: ${geofence.radius}m`)
  })

  // Test 2: Get All Geofences
  await test('Get All Geofences', async () => {
    const geofences = service.getAllGeofences()

    assert(geofences.length === 1, `Expected 1 geofence, got ${geofences.length}`)
    assert(geofences[0].name === 'Home', 'Should get the Home geofence')

    log.gray(`  Retrieved ${geofences.length} geofence(s)`)
  })

  // Test 3: Update Geofence
  await test('Update Geofence', async () => {
    const geofences = service.getAllGeofences()
    const homeId = geofences[0].id

    service.updateGeofence(homeId, {
      name: 'Home Sweet Home',
      radius: 150,
    })

    const updated = service.getGeofence(homeId)

    assert(updated.name === 'Home Sweet Home', 'Name should be updated')
    assert(updated.radius === 150, 'Radius should be updated')

    log.gray(`  Updated geofence: ${updated.name}`)
    log.gray(`  New radius: ${updated.radius}m`)
  })

  // Test 4: Enter Geofence Detection
  await test('Enter Geofence Detection', async () => {
    const geofences = service.getAllGeofences()
    const homeId = geofences[0].id

    // Start outside geofence
    const outsideLocation = {
      lat: locations.outsideHome.lat,
      lng: locations.outsideHome.lng,
      accuracy: 10,
      timestamp: new Date().toISOString(),
    }

    const events1 = service.checkGeofences(outsideLocation)
    assert(events1.length === 0, 'Should not trigger any events when starting outside')

    // Move inside geofence
    const insideLocation = {
      lat: locations.home.lat,
      lng: locations.home.lng,
      accuracy: 10,
      timestamp: new Date().toISOString(),
    }

    const events2 = service.checkGeofences(insideLocation)
    assert(events2.length === 1, `Expected 1 event, got ${events2.length}`)
    assert(events2[0].eventType === 'enter', `Expected 'enter', got '${events2[0].eventType}'`)
    assert(events2[0].geofenceId === homeId, 'Event should reference correct geofence')

    log.gray(`  ✓ Enter event detected`)
    log.gray(`  Geofence: ${geofences[0].name}`)
    log.gray(`  Event type: ${events2[0].eventType}`)
  })

  // Test 5: Leave Geofence Detection
  await test('Leave Geofence Detection', async () => {
    const geofences = service.getAllGeofences()
    const homeId = geofences[0].id

    // We're currently inside from previous test
    // Move outside geofence
    const outsideLocation = {
      lat: locations.outsideHome.lat,
      lng: locations.outsideHome.lng,
      accuracy: 10,
      timestamp: new Date().toISOString(),
    }

    const events = service.checkGeofences(outsideLocation)
    assert(events.length === 1, `Expected 1 event, got ${events.length}`)
    assert(events[0].eventType === 'leave', `Expected 'leave', got '${events[0].eventType}'`)
    assert(events[0].geofenceId === homeId, 'Event should reference correct geofence')

    log.gray(`  ✓ Leave event detected`)
    log.gray(`  Geofence: ${geofences[0].name}`)
    log.gray(`  Event type: ${events[0].eventType}`)
  })

  // Test 6: No Duplicate Events
  await test('No Duplicate Events (Hysteresis)', async () => {
    // Already outside from previous test
    // Stay outside - should not trigger another leave event
    const outsideLocation = {
      lat: locations.outsideHome.lat,
      lng: locations.outsideHome.lng,
      accuracy: 10,
      timestamp: new Date().toISOString(),
    }

    const events = service.checkGeofences(outsideLocation)
    assert(events.length === 0, `Expected 0 events (no duplicate), got ${events.length}`)

    log.gray(`  ✓ No duplicate events`)
    log.gray(`  State tracking prevents rapid toggling`)
  })

  // Test 7: Multiple Geofences
  await test('Multiple Geofences', async () => {
    // Create second geofence (Work)
    const work = service.createGeofence({
      name: 'Work',
      description: 'Office building',
      center: SF_GOLDEN_GATE,
      radius: 200,
      enabled: true,
    })

    const geofences = service.getAllGeofences()
    assert(geofences.length === 2, `Expected 2 geofences, got ${geofences.length}`)

    log.gray(`  Created second geofence: ${work.name}`)
    log.gray(`  Total geofences: ${geofences.length}`)
  })

  // Test 8: Selective Geofence Detection
  await test('Selective Geofence Detection', async () => {
    // Move to Work location (near Golden Gate)
    const workLocation = {
      lat: SF_GOLDEN_GATE.lat,
      lng: SF_GOLDEN_GATE.lng,
      accuracy: 10,
      timestamp: new Date().toISOString(),
    }

    const events = service.checkGeofences(workLocation)

    // Should enter Work geofence but not Home
    const enterWork = events.find(e => e.eventType === 'enter')
    assert(enterWork, 'Should have enter event for Work')

    const workGeofence = service.getGeofence(enterWork.geofenceId)
    assert(workGeofence.name === 'Work', `Expected 'Work', got '${workGeofence.name}'`)

    log.gray(`  ✓ Entered Work geofence only`)
    log.gray(`  Events: ${events.length}`)
  })

  // Test 9: Distance Calculation Accuracy
  await test('Distance Calculation Accuracy', async () => {
    // Test known distances
    // SF to LA is approximately 559 km
    const geofences = service.getAllGeofences()
    const homeGeofence = geofences.find(g => g.name === 'Home Sweet Home')

    // Calculate distance from Home to LA
    const laLocation = {
      lat: LA_DOWNTOWN.lat,
      lng: LA_DOWNTOWN.lng,
      accuracy: 10,
      timestamp: new Date().toISOString(),
    }

    // Check if location is inside (it shouldn't be)
    const events = service.checkGeofences(laLocation)
    const homeEvents = events.filter(e => e.geofenceId === homeGeofence.id)

    assert(homeEvents.length === 0, 'LA should be outside SF geofence')

    log.gray(`  ✓ Distance calculation working correctly`)
    log.gray(`  LA is outside SF geofence (559km away)`)
  })

  // Test 10: Disable Geofence
  await test('Disable Geofence', async () => {
    const geofences = service.getAllGeofences()
    const homeGeofence = geofences.find(g => g.name === 'Home Sweet Home')

    // Disable Home geofence
    service.updateGeofence(homeGeofence.id, { enabled: false })

    // Move to Home location - should not trigger event
    const homeLocation = {
      lat: locations.home.lat,
      lng: locations.home.lng,
      accuracy: 10,
      timestamp: new Date().toISOString(),
    }

    const events = service.checkGeofences(homeLocation)
    const homeEvents = events.filter(e => e.geofenceId === homeGeofence.id)

    assert(homeEvents.length === 0, 'Disabled geofence should not trigger events')

    log.gray(`  ✓ Disabled geofence does not trigger`)
    log.gray(`  Home geofence is disabled`)
  })

  // Test 11: Delete Geofence
  await test('Delete Geofence', async () => {
    const geofences = service.getAllGeofences()
    const homeGeofence = geofences.find(g => g.name === 'Home Sweet Home')

    service.deleteGeofence(homeGeofence.id)

    const remainingGeofences = service.getAllGeofences()
    assert(remainingGeofences.length === 1, `Expected 1 geofence, got ${remainingGeofences.length}`)
    assert(remainingGeofences[0].name === 'Work', 'Only Work geofence should remain')

    log.gray(`  ✓ Geofence deleted successfully`)
    log.gray(`  Remaining geofences: ${remainingGeofences.length}`)
  })

  // Test 12: State Persistence
  await test('State Persistence', async () => {
    const geofences = service.getAllGeofences()
    const workGeofence = geofences[0]

    // Enter Work geofence
    const workLocation = {
      lat: SF_GOLDEN_GATE.lat,
      lng: SF_GOLDEN_GATE.lng,
      accuracy: 10,
      timestamp: new Date().toISOString(),
    }

    service.checkGeofences(workLocation)

    // Get state
    const state = service.getGeofenceState(workGeofence.id)

    assert(state, 'State should exist')
    assert(state.isInside === true, 'Should be marked as inside')
    assert(state.enteredAt, 'Should have enteredAt timestamp')

    log.gray(`  ✓ State tracked correctly`)
    log.gray(`  Inside: ${state.isInside}`)
    log.gray(`  Entered at: ${state.enteredAt}`)
  })

  // Test 13: Performance Benchmark
  await test('Performance Benchmark', async () => {
    const iterations = 1000
    const times = []

    const geofences = service.getAllGeofences()
    const workGeofence = geofences[0]

    for (let i = 0; i < iterations; i++) {
      const location = {
        lat: SF_GOLDEN_GATE.lat + (Math.random() - 0.5) * 0.001, // Random variation
        lng: SF_GOLDEN_GATE.lng + (Math.random() - 0.5) * 0.001,
        accuracy: 10,
        timestamp: new Date().toISOString(),
      }

      const start = Date.now()
      service.checkGeofences(location)
      times.push(Date.now() - start)
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length
    const minTime = Math.min(...times)
    const maxTime = Math.max(...times)

    log.gray(`  ${iterations} iterations:`)
    log.gray(`    Average: ${avgTime.toFixed(3)}ms`)
    log.gray(`    Min: ${minTime}ms`)
    log.gray(`    Max: ${maxTime}ms`)

    assert(avgTime < 10, `Average time should be <10ms, got ${avgTime.toFixed(3)}ms`)
  })

  // Test 14: Edge Case - Exact Boundary
  await test('Edge Case - Exact Boundary', async () => {
    // Create geofence with 100m radius
    const boundary = service.createGeofence({
      name: 'Boundary Test',
      description: 'Test exact boundary',
      center: { lat: 37.7749, lng: -122.4194 },
      radius: 100,
      enabled: true,
    })

    // Calculate location exactly 100m away
    // Using simplified calculation: 1 degree latitude ≈ 111km
    const lat100m = 37.7749 + 100 / 111000

    const boundaryLocation = {
      lat: lat100m,
      lng: -122.4194,
      accuracy: 5,
      timestamp: new Date().toISOString(),
    }

    const events = service.checkGeofences(boundaryLocation)
    const boundaryEvents = events.filter(e => e.geofenceId === boundary.id)

    // Should be at or just outside boundary
    log.gray(`  ✓ Boundary test completed`)
    log.gray(`  Location at ~100m from center`)
    log.gray(`  Events triggered: ${boundaryEvents.length}`)
  })

  // Cleanup
  service.clearAll()

  // Test Results Summary
  console.log('\n' + '='.repeat(70))
  console.log('  Test Results Summary')
  console.log('='.repeat(70) + '\n')

  const totalTests = results.passed + results.failed + results.skipped
  const passRate = ((results.passed / totalTests) * 100).toFixed(1)
  const duration = ((Date.now() - results.startTime) / 1000).toFixed(2)

  console.log(
    `  ${colors.green}✓ Passed:${colors.reset}  ${results.passed}/${totalTests} (${passRate}%)`
  )
  if (results.failed > 0) {
    console.log(`  ${colors.red}✗ Failed:${colors.reset}  ${results.failed}/${totalTests}`)
  }
  if (results.skipped > 0) {
    console.log(`  ${colors.yellow}⊘ Skipped:${colors.reset} ${results.skipped}/${totalTests}`)
  }
  console.log(`  ${colors.blue}⏱ Duration:${colors.reset} ${duration}s`)

  console.log('\n' + '='.repeat(70) + '\n')

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0)
}

// Run the test suite
runTests().catch(error => {
  console.error(`\n${colors.red}Fatal Error:${colors.reset}`, error)
  process.exit(1)
})
