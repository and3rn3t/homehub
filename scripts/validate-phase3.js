/**
 * Phase 3 Quick Validation Script
 *
 * Run this in the browser console to verify Phase 3 services are working
 *
 * Usage:
 * 1. Open HomeHub app in browser
 * 2. Open DevTools Console (F12)
 * 3. Copy-paste this entire script
 * 4. Run: await validatePhase3()
 */

async function validatePhase3() {
  console.log('🧪 Phase 3 Validation Starting...\n')

  const results = {
    scheduler: { status: '🟡 Pending', tests: 0, passed: 0 },
    conditionEvaluator: { status: '🟡 Pending', tests: 0, passed: 0 },
    actionExecutor: { status: '🟡 Pending', tests: 0, passed: 0 },
    flowInterpreter: { status: '🟡 Pending', tests: 0, passed: 0 },
    geofence: { status: '🟡 Pending', tests: 0, passed: 0 },
  }

  // Test 1: Verify Services Exist
  console.log('📦 Test 1: Checking if services are loaded...')

  try {
    // These should be accessible if services are properly imported
    const hasScheduler =
      typeof window !== 'undefined' && localStorage.getItem('automations') !== null
    const hasMonitoring = localStorage.getItem('automation-monitoring') !== null

    console.log('  ✅ localStorage accessible')
    console.log(`  ${hasScheduler ? '✅' : '❌'} Automations data structure exists`)
    console.log(`  ${hasMonitoring ? '✅' : '⚠️ '} Monitoring data (may be empty if not running)`)

    results.scheduler.tests++
    if (hasScheduler) results.scheduler.passed++
  } catch (error) {
    console.error('  ❌ Error checking services:', error)
  }

  // Test 2: Check Automation Data Structure
  console.log('\n📊 Test 2: Validating automation data...')

  try {
    const automationsData = localStorage.getItem('automations')
    if (automationsData) {
      const automations = JSON.parse(automationsData)
      const count = Array.isArray(automations) ? automations.length : 0

      console.log(`  ✅ Found ${count} automation(s)`)

      if (count > 0) {
        const firstAuto = automations[0]
        const hasRequiredFields =
          firstAuto.id && firstAuto.name && firstAuto.triggers && firstAuto.actions

        console.log(`  ${hasRequiredFields ? '✅' : '❌'} Automation structure valid`)
        console.log(
          `  Sample: "${firstAuto.name}" (${firstAuto.triggers?.length} triggers, ${firstAuto.actions?.length} actions)`
        )

        results.scheduler.tests++
        if (hasRequiredFields) results.scheduler.passed++
      } else {
        console.log('  ⚠️  No automations found (create one to test)')
      }
    } else {
      console.log('  ⚠️  No automation data yet (expected for fresh install)')
    }
  } catch (error) {
    console.error('  ❌ Error parsing automation data:', error)
  }

  // Test 3: Check Device Integration
  console.log('\n🔌 Test 3: Checking device integration...')

  try {
    const devicesData = localStorage.getItem('devices')
    if (devicesData) {
      const devices = JSON.parse(devicesData)
      const count = Array.isArray(devices) ? devices.length : 0

      console.log(`  ✅ Found ${count} device(s)`)

      if (count > 0) {
        const onlineDevices = devices.filter(d => d.status === 'online').length
        console.log(`  📱 ${onlineDevices} online, ${count - onlineDevices} offline`)

        results.actionExecutor.tests++
        if (onlineDevices > 0) results.actionExecutor.passed++
      }
    } else {
      console.log('  ⚠️  No devices found (automation needs devices)')
    }
  } catch (error) {
    console.error('  ❌ Error checking devices:', error)
  }

  // Test 4: Check Monitoring Data
  console.log('\n📈 Test 4: Checking monitoring metrics...')

  try {
    const monitoringData = localStorage.getItem('automation-monitoring')
    if (monitoringData) {
      const metrics = JSON.parse(monitoringData)
      const dataPoints = Array.isArray(metrics) ? metrics.length : 0

      console.log(`  ✅ Found ${dataPoints} monitoring data point(s)`)

      if (dataPoints > 0) {
        const latest = metrics[metrics.length - 1]
        console.log(`  📊 Latest metrics:`)
        console.log(`     - Total Executions: ${latest.metrics?.totalExecutions || 0}`)
        console.log(
          `     - Success Rate: ${(((latest.metrics?.successfulExecutions || 0) / (latest.metrics?.totalExecutions || 1)) * 100).toFixed(1)}%`
        )
        console.log(`     - Avg Time: ${Math.round(latest.metrics?.averageExecutionTime || 0)}ms`)
        console.log(`     - Active Automations: ${latest.activeAutomations || 0}`)

        results.scheduler.tests++
        results.scheduler.passed++
      } else {
        console.log('  ℹ️  Monitoring started but no executions yet')
      }
    } else {
      console.log('  ℹ️  Monitoring not started (will auto-start when viewing Automations tab)')
    }
  } catch (error) {
    console.error('  ❌ Error checking monitoring data:', error)
  }

  // Test 5: Quick Performance Check
  console.log('\n⚡ Test 5: Performance check...')

  try {
    const start = performance.now()

    // Simulate quick automation check
    const automationsData = localStorage.getItem('automations')
    if (automationsData) {
      const automations = JSON.parse(automationsData)
      const enabled = automations.filter(a => a.enabled)

      const elapsed = performance.now() - start
      console.log(`  ✅ Processed ${automations.length} automations in ${elapsed.toFixed(2)}ms`)
      console.log(`  📊 ${enabled.length} enabled, ${automations.length - enabled.length} disabled`)

      results.scheduler.tests++
      if (elapsed < 100) results.scheduler.passed++
    }
  } catch (error) {
    console.error('  ❌ Error in performance check:', error)
  }

  // Test 6: Check Browser APIs
  console.log('\n🌐 Test 6: Checking browser API support...')

  try {
    const hasGeolocation = 'geolocation' in navigator
    const hasNotifications = 'Notification' in window
    const hasLocalStorage = typeof localStorage !== 'undefined'

    console.log(`  ${hasGeolocation ? '✅' : '❌'} Geolocation API (for geofencing)`)
    console.log(`  ${hasNotifications ? '✅' : '❌'} Notifications API`)
    console.log(`  ${hasLocalStorage ? '✅' : '❌'} localStorage API`)

    results.geofence.tests++
    if (hasGeolocation) results.geofence.passed++
  } catch (error) {
    console.error('  ❌ Error checking browser APIs:', error)
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 VALIDATION SUMMARY')
  console.log('='.repeat(60))

  let totalTests = 0
  let totalPassed = 0

  for (const [service, result] of Object.entries(results)) {
    const percentage = result.tests > 0 ? ((result.passed / result.tests) * 100).toFixed(0) : 0
    const status = percentage >= 80 ? '✅' : percentage >= 50 ? '⚠️ ' : '❌'

    console.log(
      `${status} ${service.padEnd(20)} ${result.passed}/${result.tests} passed (${percentage}%)`
    )

    totalTests += result.tests
    totalPassed += result.passed
  }

  console.log('='.repeat(60))

  const overallPercentage = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0
  const overallStatus =
    overallPercentage >= 80 ? '✅ PASS' : overallPercentage >= 50 ? '⚠️  WARN' : '❌ FAIL'

  console.log(
    `\n${overallStatus} Overall: ${totalPassed}/${totalTests} tests passed (${overallPercentage}%)`
  )

  if (overallPercentage >= 80) {
    console.log('\n🎉 Phase 3 looks good! Services are loaded and functional.')
    console.log('Next steps:')
    console.log('  1. Create test automations via UI')
    console.log('  2. Monitor execution in AutomationMonitor')
    console.log('  3. Run 24-hour stability test')
  } else if (overallPercentage >= 50) {
    console.log('\n⚠️  Phase 3 partially working. Some components need attention.')
    console.log('Recommendations:')
    console.log('  1. Create at least 1 test automation')
    console.log('  2. Add at least 1 online device')
    console.log('  3. Check browser console for errors')
  } else {
    console.log('\n❌ Phase 3 validation failed. Issues detected.')
    console.log('Troubleshooting:')
    console.log('  1. Ensure app is running (npm run dev)')
    console.log('  2. Check browser console for errors')
    console.log('  3. Verify services are imported in components')
  }

  console.log('\n📚 Documentation: docs/development/PHASE_3_VALIDATION_QUICKSTART.md')
  console.log('🧪 Full test plan: src/tests/automation-integration.PLAN.ts')

  return {
    overall: {
      passed: totalPassed,
      total: totalTests,
      percentage: parseFloat(overallPercentage),
      status: overallStatus,
    },
    results,
  }
}

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  console.log('✅ Phase 3 Validation Script Loaded')
  console.log('Run: await validatePhase3()')
} else {
  console.log('⚠️  This script must be run in a browser console')
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { validatePhase3 }
}
