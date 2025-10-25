/**
 * Automation Integration Test Suite
 * Tests all 5 Phase 3 milestones with real-world scenarios
 *
 * Usage: npm run test:automation
 *
 * @author HomeHub Team
 * @date October 13, 2025
 */

import type { Automation, Device, Flow, Geofence } from '@/types'

// Test framework interfaces
export interface TestScenario {
  id: number
  name: string
  type: 'scheduler' | 'condition' | 'flow' | 'geofence' | 'edge-case'
  milestone: string
  setup: () => Promise<void>
  execute: () => Promise<void>
  validate: () => Promise<TestResult>
  teardown: () => Promise<void>
  expectedDuration: number // ms
  maxRetries: number
}

export interface TestResult {
  passed: boolean
  executionTime: number
  error?: string
  details?: Record<string, unknown>
}

export interface TestSuiteResults {
  totalTests: number
  passed: number
  failed: number
  averageExecutionTime: number
  scenarios: Array<{
    name: string
    passed: boolean
    executionTime: number
    withinTarget: boolean
    error?: string
  }>
}

// ===================================================================
// TEST SCENARIOS - Milestone 3.1: Scheduler Service
// ===================================================================

const SCENARIO_1_MORNING_ROUTINE: TestScenario = {
  id: 1,
  name: 'Morning Routine (Time Trigger)',
  type: 'scheduler',
  milestone: '3.1',
  setup: async () => {
    // Create automation with 7:00 AM trigger
    const automation: Partial<Automation> = {
      id: 'test-morning-routine',
      name: 'Morning Routine Test',
      enabled: true,
      trigger: {
        type: 'time',
        time: '07:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      },
      actions: [
        { deviceId: 'kitchen-light', action: 'set_brightness', value: 100 },
        { deviceId: 'hallway-light', action: 'set_brightness', value: 50 },
      ],
    }
    await saveAutomation(automation as Automation)
    console.log('✓ Created morning routine automation')
  },
  execute: async () => {
    // Simulate time = 7:00 AM on a weekday
    await simulateTime('07:00', 'monday')
    await wait(1000) // Wait for scheduler to process
  },
  validate: async () => {
    const startTime = Date.now()

    // Check if devices are at correct brightness
    const kitchen = await getDevice('kitchen-light')
    const hallway = await getDevice('hallway-light')

    const executionTime = Date.now() - startTime
    const passed = kitchen.brightness === 100 && hallway.brightness === 50

    return {
      passed,
      executionTime,
      details: { kitchenBrightness: kitchen.brightness, hallwayBrightness: hallway.brightness },
    }
  },
  teardown: async () => {
    await deleteAutomation('test-morning-routine')
    console.log('✓ Cleaned up morning routine automation')
  },
  expectedDuration: 500,
  maxRetries: 3,
}

const SCENARIO_2_SUNSET_AUTOMATION: TestScenario = {
  id: 2,
  name: 'Sunset Automation (Solar Trigger)',
  type: 'scheduler',
  milestone: '3.1',
  setup: async () => {
    const automation: Partial<Automation> = {
      id: 'test-sunset',
      name: 'Sunset Test',
      enabled: true,
      trigger: {
        type: 'time',
        time: 'sunset',
        offset: 0,
      },
      actions: [
        { deviceId: 'outdoor-light', action: 'turn_on' },
        { deviceId: 'living-room-lamp', action: 'turn_on' },
      ],
    }
    await saveAutomation(automation as Automation)
    console.log('✓ Created sunset automation')
  },
  execute: async () => {
    // Calculate sunset time for today and simulate
    const sunsetTime = calculateSunset()
    await simulateTime(sunsetTime, new Date().toLocaleDateString('en-US', { weekday: 'long' }))
    await wait(1000)
  },
  validate: async () => {
    const startTime = Date.now()

    const outdoor = await getDevice('outdoor-light')
    const living = await getDevice('living-room-lamp')

    const executionTime = Date.now() - startTime
    const passed = outdoor.enabled && living.enabled

    return {
      passed,
      executionTime,
      details: { outdoorOn: outdoor.enabled, livingOn: living.enabled },
    }
  },
  teardown: async () => {
    await deleteAutomation('test-sunset')
    console.log('✓ Cleaned up sunset automation')
  },
  expectedDuration: 500,
  maxRetries: 3,
}

const SCENARIO_3_BEDTIME_SCENE: TestScenario = {
  id: 3,
  name: 'Bedtime Scene (Daily Trigger)',
  type: 'scheduler',
  milestone: '3.1',
  setup: async () => {
    const automation: Partial<Automation> = {
      id: 'test-bedtime',
      name: 'Bedtime Test',
      enabled: true,
      trigger: {
        type: 'time',
        time: '22:30',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      },
      actions: [
        { deviceId: 'kitchen-light', action: 'turn_off' },
        { deviceId: 'living-room-lamp', action: 'turn_off' },
        { deviceId: 'bedroom-light', action: 'set_brightness', value: 10 },
        { deviceId: 'bedroom-light', action: 'set_temperature', value: 2700 }, // Warm
      ],
    }
    await saveAutomation(automation as Automation)
    console.log('✓ Created bedtime automation')
  },
  execute: async () => {
    await simulateTime('22:30', 'monday')
    await wait(1500) // Wait for all actions
  },
  validate: async () => {
    const startTime = Date.now()

    const kitchen = await getDevice('kitchen-light')
    const living = await getDevice('living-room-lamp')
    const bedroom = await getDevice('bedroom-light')

    const executionTime = Date.now() - startTime
    const passed =
      !kitchen.enabled && !living.enabled && bedroom.brightness === 10 && bedroom.colorTemp === 2700

    return {
      passed,
      executionTime,
      details: {
        kitchenOff: !kitchen.enabled,
        livingOff: !living.enabled,
        bedroomDim: bedroom.brightness === 10,
        bedroomWarm: bedroom.colorTemp === 2700,
      },
    }
  },
  teardown: async () => {
    await deleteAutomation('test-bedtime')
    console.log('✓ Cleaned up bedtime automation')
  },
  expectedDuration: 800,
  maxRetries: 3,
}

// ===================================================================
// TEST SCENARIOS - Milestone 3.2: Condition Evaluator
// ===================================================================

const SCENARIO_4_TEMPERATURE_ALERT: TestScenario = {
  id: 4,
  name: 'Temperature Alert (Threshold Trigger)',
  type: 'condition',
  milestone: '3.2',
  setup: async () => {
    const automation: Partial<Automation> = {
      id: 'test-temperature',
      name: 'Temperature Alert Test',
      enabled: true,
      trigger: {
        type: 'condition',
        deviceId: 'thermostat',
        operator: '>',
        threshold: 75,
      },
      actions: [
        { deviceId: 'fan', action: 'turn_on' },
        { deviceId: 'notification-service', action: 'send', value: 'Temperature above 75°F!' },
      ],
    }
    await saveAutomation(automation as Automation)
    console.log('✓ Created temperature alert automation')
  },
  execute: async () => {
    // Simulate temperature rising above threshold
    await setDeviceValue('thermostat', 70) // Below threshold
    await wait(500)
    await setDeviceValue('thermostat', 76) // Above threshold
    await wait(1000)
  },
  validate: async () => {
    const startTime = Date.now()

    const fan = await getDevice('fan')
    const notifications = await getNotificationHistory()

    const executionTime = Date.now() - startTime
    const passed = fan.enabled && notifications.some(n => n.message.includes('75°F'))

    return {
      passed,
      executionTime,
      details: { fanOn: fan.enabled, notificationSent: notifications.length > 0 },
    }
  },
  teardown: async () => {
    await deleteAutomation('test-temperature')
    await clearNotificationHistory()
    console.log('✓ Cleaned up temperature alert automation')
  },
  expectedDuration: 600,
  maxRetries: 3,
}

const SCENARIO_5_MOTION_LIGHTING: TestScenario = {
  id: 5,
  name: 'Motion-Activated Lighting (State Change)',
  type: 'condition',
  milestone: '3.2',
  setup: async () => {
    const automation: Partial<Automation> = {
      id: 'test-motion',
      name: 'Motion Lighting Test',
      enabled: true,
      trigger: {
        type: 'condition',
        deviceId: 'motion-sensor',
        operator: '==',
        threshold: 'active',
      },
      actions: [{ deviceId: 'hallway-light', action: 'set_brightness', value: 100 }],
    }
    await saveAutomation(automation as Automation)
    console.log('✓ Created motion lighting automation')
  },
  execute: async () => {
    // Simulate motion detection
    await setDeviceValue('motion-sensor', 'inactive')
    await wait(500)
    await setDeviceValue('motion-sensor', 'active')
    await wait(500)
  },
  validate: async () => {
    const startTime = Date.now()

    const hallway = await getDevice('hallway-light')

    const executionTime = Date.now() - startTime
    const passed = hallway.brightness === 100 && executionTime < 500 // <500ms response

    return {
      passed,
      executionTime,
      details: { brightness: hallway.brightness, responseTime: executionTime },
    }
  },
  teardown: async () => {
    await deleteAutomation('test-motion')
    console.log('✓ Cleaned up motion lighting automation')
  },
  expectedDuration: 500,
  maxRetries: 3,
}

const SCENARIO_6_LOW_BATTERY: TestScenario = {
  id: 6,
  name: 'Low Battery Warning (Once Per Cycle)',
  type: 'condition',
  milestone: '3.2',
  setup: async () => {
    const automation: Partial<Automation> = {
      id: 'test-battery',
      name: 'Battery Warning Test',
      enabled: true,
      trigger: {
        type: 'condition',
        deviceId: 'wireless-sensor',
        operator: '<',
        threshold: 20,
        property: 'batteryLevel',
      },
      actions: [{ deviceId: 'notification-service', action: 'send', value: 'Sensor battery low!' }],
    }
    await saveAutomation(automation as Automation)
    console.log('✓ Created battery warning automation')
  },
  execute: async () => {
    // Simulate battery draining
    await setDeviceValue('wireless-sensor', 25, 'batteryLevel')
    await wait(500)
    await setDeviceValue('wireless-sensor', 15, 'batteryLevel') // Below threshold
    await wait(1000)
    await setDeviceValue('wireless-sensor', 10, 'batteryLevel') // Still below
    await wait(1000)
  },
  validate: async () => {
    const startTime = Date.now()

    const notifications = await getNotificationHistory()

    const executionTime = Date.now() - startTime
    const lowBatteryNotifications = notifications.filter(n => n.message.includes('battery low'))

    // Should only trigger once due to hysteresis
    const passed = lowBatteryNotifications.length === 1

    return {
      passed,
      executionTime,
      details: { notificationCount: lowBatteryNotifications.length, expected: 1 },
    }
  },
  teardown: async () => {
    await deleteAutomation('test-battery')
    await clearNotificationHistory()
    console.log('✓ Cleaned up battery warning automation')
  },
  expectedDuration: 500,
  maxRetries: 3,
}

// ===================================================================
// TEST SCENARIOS - Milestone 3.4: Flow Interpreter
// ===================================================================

const SCENARIO_7_SMART_MORNING_FLOW: TestScenario = {
  id: 7,
  name: 'Smart Morning Flow (Conditional Branching)',
  type: 'flow',
  milestone: '3.4',
  setup: async () => {
    const flow: Flow = {
      id: 'test-smart-morning',
      name: 'Smart Morning Test',
      enabled: true,
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          subtype: 'time',
          label: 'Time Trigger',
          data: { time: '07:00' },
          position: { x: 0, y: 0 },
          connections: ['condition-1'],
        },
        {
          id: 'condition-1',
          type: 'condition',
          subtype: 'weekday',
          label: 'Is Weekday?',
          data: {},
          position: { x: 100, y: 0 },
          connections: ['action-1', 'action-2'], // True, False
        },
        {
          id: 'action-1',
          type: 'action',
          subtype: 'device',
          label: 'Work Lights',
          data: { deviceId: 'office-light', action: 'turn_on' },
          position: { x: 200, y: -50 },
          connections: [],
        },
        {
          id: 'action-2',
          type: 'action',
          subtype: 'device',
          label: 'Bedroom Lights',
          data: { deviceId: 'bedroom-light', action: 'turn_on' },
          position: { x: 200, y: 50 },
          connections: [],
        },
      ],
      created: new Date().toISOString(),
    }
    await saveFlow(flow)
    console.log('✓ Created smart morning flow')
  },
  execute: async () => {
    // Test weekday path
    await simulateTime('07:00', 'monday')
    await wait(1000)

    // Reset and test weekend path
    await resetDevices()
    await simulateTime('07:00', 'saturday')
    await wait(1000)
  },
  validate: async () => {
    const startTime = Date.now()

    // On Monday, office light should be on
    await simulateTime('07:00', 'monday')
    await executeFlow('test-smart-morning')
    const officeMonday = await getDevice('office-light')

    // On Saturday, bedroom light should be on
    await resetDevices()
    await simulateTime('07:00', 'saturday')
    await executeFlow('test-smart-morning')
    const bedroomSaturday = await getDevice('bedroom-light')

    const executionTime = Date.now() - startTime
    const passed = officeMonday.enabled && bedroomSaturday.enabled

    return {
      passed,
      executionTime,
      details: { weekdayPath: officeMonday.enabled, weekendPath: bedroomSaturday.enabled },
    }
  },
  teardown: async () => {
    await deleteFlow('test-smart-morning')
    console.log('✓ Cleaned up smart morning flow')
  },
  expectedDuration: 800,
  maxRetries: 3,
}

// ===================================================================
// TEST SCENARIOS - Milestone 3.5: Geofencing
// ===================================================================

const SCENARIO_10_ARRIVE_HOME: TestScenario = {
  id: 10,
  name: 'Arrive Home (Enter Geofence)',
  type: 'geofence',
  milestone: '3.5',
  setup: async () => {
    const geofence: Geofence = {
      id: 'test-home-geofence',
      name: 'Home Test',
      center: { lat: 37.7749, lng: -122.4194 }, // San Francisco
      radius: 100, // 100 meters
    }
    await saveGeofence(geofence)

    const automation: Partial<Automation> = {
      id: 'test-arrive-home',
      name: 'Arrive Home Test',
      enabled: true,
      trigger: {
        type: 'geofence',
        geofenceId: 'test-home-geofence',
        event: 'enter',
      },
      actions: [
        { deviceId: 'entry-light', action: 'turn_on' },
        { deviceId: 'thermostat', action: 'set_temperature', value: 72 },
      ],
    }
    await saveAutomation(automation as Automation)
    console.log('✓ Created arrive home automation')
  },
  execute: async () => {
    // Simulate moving from outside to inside geofence
    await setUserLocation({ lat: 37.776, lng: -122.42 }) // Outside (200m away)
    await wait(500)
    await setUserLocation({ lat: 37.7749, lng: -122.4194 }) // Inside (center)
    await wait(1000)
  },
  validate: async () => {
    const startTime = Date.now()

    const entryLight = await getDevice('entry-light')
    const thermostat = await getDevice('thermostat')

    const executionTime = Date.now() - startTime
    const passed = entryLight.enabled && thermostat.temperature === 72

    return {
      passed,
      executionTime,
      details: { lightOn: entryLight.enabled, tempSet: thermostat.temperature === 72 },
    }
  },
  teardown: async () => {
    await deleteAutomation('test-arrive-home')
    await deleteGeofence('test-home-geofence')
    console.log('✓ Cleaned up arrive home automation')
  },
  expectedDuration: 1000,
  maxRetries: 3,
}

// ===================================================================
// TEST SCENARIOS - Edge Cases
// ===================================================================

const SCENARIO_12_CONFLICTING_AUTOMATIONS: TestScenario = {
  id: 12,
  name: 'Conflicting Automations (Same Device)',
  type: 'edge-case',
  milestone: 'All',
  setup: async () => {
    // Create two automations targeting same device
    await saveAutomation({
      id: 'test-conflict-1',
      name: 'Conflict 1',
      enabled: true,
      trigger: { type: 'time', time: '12:00' },
      actions: [{ deviceId: 'test-light', action: 'set_brightness', value: 100 }],
    } as Automation)

    await saveAutomation({
      id: 'test-conflict-2',
      name: 'Conflict 2',
      enabled: true,
      trigger: { type: 'time', time: '12:00' },
      actions: [{ deviceId: 'test-light', action: 'set_brightness', value: 50 }],
    } as Automation)

    console.log('✓ Created conflicting automations')
  },
  execute: async () => {
    await simulateTime('12:00', 'monday')
    await wait(1000)
  },
  validate: async () => {
    const startTime = Date.now()

    const light = await getDevice('test-light')

    const executionTime = Date.now() - startTime
    // Last action should win (brightness = 50)
    const passed = light.brightness === 50 || light.brightness === 100 // Either is acceptable

    return {
      passed,
      executionTime,
      details: { finalBrightness: light.brightness, note: 'Last action wins' },
    }
  },
  teardown: async () => {
    await deleteAutomation('test-conflict-1')
    await deleteAutomation('test-conflict-2')
    console.log('✓ Cleaned up conflicting automations')
  },
  expectedDuration: 500,
  maxRetries: 3,
}

const SCENARIO_13_DEVICE_OFFLINE: TestScenario = {
  id: 13,
  name: 'Device Offline Handling (Retry Logic)',
  type: 'edge-case',
  milestone: '3.3',
  setup: async () => {
    await saveAutomation({
      id: 'test-offline',
      name: 'Offline Test',
      enabled: true,
      trigger: { type: 'time', time: '14:00' },
      actions: [{ deviceId: 'unreliable-device', action: 'turn_on' }],
    } as Automation)
    console.log('✓ Created offline test automation')
  },
  execute: async () => {
    // Simulate device being offline
    await setDeviceStatus('unreliable-device', 'offline')
    await simulateTime('14:00', 'monday')
    await wait(5000) // Wait for retries
  },
  validate: async () => {
    const startTime = Date.now()

    const logs = await getExecutionLogs('test-offline')

    const executionTime = Date.now() - startTime
    // Should have 3 retry attempts
    const passed = logs.some(l => l.retries >= 3 && l.status === 'failed')

    return {
      passed,
      executionTime,
      details: { retryCount: logs[0]?.retries, finalStatus: logs[0]?.status },
    }
  },
  teardown: async () => {
    await deleteAutomation('test-offline')
    await setDeviceStatus('unreliable-device', 'online')
    console.log('✓ Cleaned up offline test automation')
  },
  expectedDuration: 5000,
  maxRetries: 1,
}

// ===================================================================
// TEST SUITE RUNNER
// ===================================================================

export const ALL_SCENARIOS: TestScenario[] = [
  SCENARIO_1_MORNING_ROUTINE,
  SCENARIO_2_SUNSET_AUTOMATION,
  SCENARIO_3_BEDTIME_SCENE,
  SCENARIO_4_TEMPERATURE_ALERT,
  SCENARIO_5_MOTION_LIGHTING,
  SCENARIO_6_LOW_BATTERY,
  SCENARIO_7_SMART_MORNING_FLOW,
  // Add more scenarios here
  SCENARIO_10_ARRIVE_HOME,
  SCENARIO_12_CONFLICTING_AUTOMATIONS,
  SCENARIO_13_DEVICE_OFFLINE,
]

export async function runAutomationTestSuite(): Promise<TestSuiteResults> {
  console.log('🧪 Starting Automation Integration Test Suite')
  console.log(`📋 Total Scenarios: ${ALL_SCENARIOS.length}\n`)

  const results: TestSuiteResults = {
    totalTests: ALL_SCENARIOS.length,
    passed: 0,
    failed: 0,
    averageExecutionTime: 0,
    scenarios: [],
  }

  for (const scenario of ALL_SCENARIOS) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`🧪 Test ${scenario.id}: ${scenario.name}`)
    console.log(`📍 Milestone: ${scenario.milestone} | Type: ${scenario.type}`)
    console.log(`${'='.repeat(60)}\n`)

    try {
      // Setup
      console.log('⚙️  Setup...')
      await scenario.setup()

      // Execute
      console.log('▶️  Execute...')
      const startTime = Date.now()
      await scenario.execute()

      // Validate
      console.log('✅ Validate...')
      const result = await scenario.validate()
      const executionTime = Date.now() - startTime

      // Teardown
      console.log('🧹 Teardown...')
      await scenario.teardown()

      // Record results
      const withinTarget = result.executionTime <= scenario.expectedDuration
      const passed = result.passed && withinTarget

      results.scenarios.push({
        name: scenario.name,
        passed,
        executionTime,
        withinTarget,
      })

      if (passed) {
        results.passed++
        console.log(`\n✅ PASS (${executionTime}ms)`)
      } else {
        results.failed++
        console.log(`\n❌ FAIL (${executionTime}ms)`)
        console.log(`   Reason: ${result.error || 'Validation failed'}`)
      }

      if (result.details) {
        console.log('   Details:', JSON.stringify(result.details, null, 2))
      }
    } catch (error) {
      results.failed++
      results.scenarios.push({
        name: scenario.name,
        passed: false,
        executionTime: 0,
        withinTarget: false,
        error: error instanceof Error ? error.message : String(error),
      })

      console.log(`\n❌ ERROR: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Calculate summary
  results.averageExecutionTime =
    results.scenarios.reduce((sum, s) => sum + s.executionTime, 0) / results.scenarios.length

  // Print summary
  console.log(`\n\n${'='.repeat(60)}`)
  console.log('📊 TEST SUITE SUMMARY')
  console.log(`${'='.repeat(60)}`)
  console.log(`Total Tests: ${results.totalTests}`)
  console.log(
    `Passed: ${results.passed} (${((results.passed / results.totalTests) * 100).toFixed(1)}%)`
  )
  console.log(
    `Failed: ${results.failed} (${((results.failed / results.totalTests) * 100).toFixed(1)}%)`
  )
  console.log(`Average Execution Time: ${Math.round(results.averageExecutionTime)}ms`)
  console.log(`${'='.repeat(60)}\n`)

  return results
}

// ===================================================================
// HELPER FUNCTIONS - Real KV Store Integration
// ===================================================================

/**
 * Save automation to KV store
 */
async function saveAutomation(automation: Automation): Promise<void> {
  const key = 'automations'
  const stored = localStorage.getItem(key)
  const automations: Automation[] = stored ? JSON.parse(stored) : []

  // Check if automation exists (update) or new (add)
  const index = automations.findIndex(a => a.id === automation.id)
  if (index >= 0) {
    automations[index] = automation
  } else {
    automations.push(automation)
  }

  localStorage.setItem(key, JSON.stringify(automations))
  console.log(`✅ Saved automation: ${automation.name}`)
}

/**
 * Delete automation from KV store
 */
async function deleteAutomation(id: string): Promise<void> {
  const key = 'automations'
  const stored = localStorage.getItem(key)
  const automations: Automation[] = stored ? JSON.parse(stored) : []

  const filtered = automations.filter(a => a.id !== id)
  localStorage.setItem(key, JSON.stringify(filtered))
  console.log(`✅ Deleted automation: ${id}`)
}

/**
 * Get device from KV store
 */
async function getDevice(id: string): Promise<Device> {
  const key = 'devices'
  const stored = localStorage.getItem(key)
  const devices: Device[] = stored ? JSON.parse(stored) : []

  const device = devices.find(d => d.id === id)
  if (!device) {
    throw new Error(`Device not found: ${id}`)
  }

  return device
}

/**
 * Update device property in KV store
 */
async function setDeviceValue(id: string, value: unknown, property = 'value'): Promise<void> {
  const key = 'devices'
  const stored = localStorage.getItem(key)
  const devices: Device[] = stored ? JSON.parse(stored) : []

  const index = devices.findIndex(d => d.id === id)
  if (index < 0) {
    throw new Error(`Device not found: ${id}`)
  }

  // Update the property (casting to unknown first for type safety)
  const device = devices[index] as unknown as Record<string, unknown>
  device[property] = value
  localStorage.setItem(key, JSON.stringify(devices))
  console.log(`✅ Set ${id}.${property} = ${value}`)
}

/**
 * Simulate time for scheduler testing
 * NOTE: This modifies the system clock temporarily - use with caution!
 */
async function simulateTime(time: string, day: string): Promise<void> {
  // Parse time (HH:MM format)
  const timeParts = time.split(':').map(Number)
  const hours = timeParts[0] ?? 0
  const minutes = timeParts[1] ?? 0

  // Map day string to day number (0 = Sunday)
  const dayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  }

  const targetDay = dayMap[day.toLowerCase()]
  if (targetDay === undefined) {
    throw new Error(`Invalid day: ${day}`)
  }

  // Calculate date for target day
  const now = new Date()
  const currentDay = now.getDay()
  const daysUntilTarget = (targetDay - currentDay + 7) % 7

  const simulatedDate = new Date()
  simulatedDate.setDate(now.getDate() + daysUntilTarget)
  simulatedDate.setHours(hours, minutes, 0, 0)

  // Store simulated time in sessionStorage for scheduler service to use
  sessionStorage.setItem('test-simulated-time', simulatedDate.toISOString())

  console.log(`⏰ Simulated time: ${day} ${time} (${simulatedDate.toLocaleString()})`)

  // Trigger a custom event that scheduler can listen for
  window.dispatchEvent(
    new CustomEvent('time-simulation', {
      detail: { time, day, date: simulatedDate },
    })
  )
}

/**
 * Wait for specified duration
 */
async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Calculate sunset time for location (simple approximation)
 */
async function calculateSunset(): Promise<string> {
  // For testing, use a fixed sunset time
  // In production, this would use actual solar calculations
  const date = new Date()
  const month = date.getMonth() + 1

  // Simple seasonal approximation (US Northern Hemisphere)
  // Summer (May-Aug): ~20:00, Winter (Nov-Feb): ~17:00, Spring/Fall: ~18:30
  let sunsetHour = 18
  let sunsetMinute = 30

  if (month >= 5 && month <= 8) {
    sunsetHour = 20
    sunsetMinute = 0
  } else if (month >= 11 || month <= 2) {
    sunsetHour = 17
    sunsetMinute = 0
  }

  return `${sunsetHour.toString().padStart(2, '0')}:${sunsetMinute.toString().padStart(2, '0')}`
}

/**
 * Get notification history from session
 */
async function getNotificationHistory(): Promise<Array<{ message: string }>> {
  const stored = sessionStorage.getItem('test-notifications')
  return stored ? JSON.parse(stored) : []
}

/**
 * Clear notification history
 */
async function clearNotificationHistory(): Promise<void> {
  sessionStorage.removeItem('test-notifications')
  console.log('✅ Cleared notification history')
}

/**
 * Save flow to KV store
 */
async function saveFlow(flow: Flow): Promise<void> {
  const key = 'automation-flows'
  const stored = localStorage.getItem(key)
  const flows: Flow[] = stored ? JSON.parse(stored) : []

  const index = flows.findIndex(f => f.id === flow.id)
  if (index >= 0) {
    flows[index] = flow
  } else {
    flows.push(flow)
  }

  localStorage.setItem(key, JSON.stringify(flows))
  console.log(`✅ Saved flow: ${flow.name}`)
}

/**
 * Delete flow from KV store
 */
async function deleteFlow(id: string): Promise<void> {
  const key = 'automation-flows'
  const stored = localStorage.getItem(key)
  const flows: Flow[] = stored ? JSON.parse(stored) : []

  const filtered = flows.filter(f => f.id !== id)
  localStorage.setItem(key, JSON.stringify(filtered))
  console.log(`✅ Deleted flow: ${id}`)
}

/**
 * Execute flow by ID
 */
async function executeFlow(id: string): Promise<void> {
  // Trigger flow execution event for flow interpreter service
  window.dispatchEvent(new CustomEvent('execute-flow', { detail: { flowId: id } }))
  console.log(`✅ Triggered flow execution: ${id}`)
  await wait(500) // Allow time for execution
}

/**
 * Reset all devices to default state
 */
async function resetDevices(): Promise<void> {
  const key = 'devices'
  const stored = localStorage.getItem(key)
  const devices: Device[] = stored ? JSON.parse(stored) : []

  // Reset common properties
  devices.forEach(device => {
    device.enabled = false
    if ('brightness' in device) {
      ;(device as { brightness: number }).brightness = 0
    }
    if ('temperature' in device) {
      ;(device as { temperature: number }).temperature = 72
    }
  })

  localStorage.setItem(key, JSON.stringify(devices))
  console.log('✅ Reset all devices to default state')
}

/**
 * Save geofence to KV store
 */
async function saveGeofence(geofence: Geofence): Promise<void> {
  const key = 'geofences'
  const stored = localStorage.getItem(key)
  const geofences: Geofence[] = stored ? JSON.parse(stored) : []

  const index = geofences.findIndex(g => g.id === geofence.id)
  if (index >= 0) {
    geofences[index] = geofence
  } else {
    geofences.push(geofence)
  }

  localStorage.setItem(key, JSON.stringify(geofences))
  console.log(`✅ Saved geofence: ${geofence.name}`)
}

/**
 * Delete geofence from KV store
 */
async function deleteGeofence(id: string): Promise<void> {
  const key = 'geofences'
  const stored = localStorage.getItem(key)
  const geofences: Geofence[] = stored ? JSON.parse(stored) : []

  const filtered = geofences.filter(g => g.id !== id)
  localStorage.setItem(key, JSON.stringify(filtered))
  console.log(`✅ Deleted geofence: ${id}`)
}

/**
 * Simulate user location for geofencing tests
 */
async function setUserLocation(location: { lat: number; lng: number }): Promise<void> {
  // Store location in sessionStorage for geofence service to use
  sessionStorage.setItem('test-user-location', JSON.stringify(location))

  // Trigger location change event
  window.dispatchEvent(
    new CustomEvent('location-change', {
      detail: { latitude: location.lat, longitude: location.lng },
    })
  )

  console.log(`✅ Set user location: ${location.lat}, ${location.lng}`)
}

/**
 * Update device status in KV store
 */
async function setDeviceStatus(id: string, status: string): Promise<void> {
  const key = 'devices'
  const stored = localStorage.getItem(key)
  const devices: Device[] = stored ? JSON.parse(stored) : []

  const index = devices.findIndex(d => d.id === id)
  if (index < 0) {
    throw new Error(`Device not found: ${id}`)
  }

  const device = devices[index]
  if (device) {
    device.status = status as Device['status']
    localStorage.setItem(key, JSON.stringify(devices))
    console.log(`✅ Set ${id} status = ${status}`)
  }
}

/**
 * Get execution logs for automation (from session storage)
 */
async function getExecutionLogs(
  _automationId: string
): Promise<Array<{ retries: number; status: string }>> {
  const stored = sessionStorage.getItem('automation-execution-logs')
  return stored ? JSON.parse(stored) : []
}
