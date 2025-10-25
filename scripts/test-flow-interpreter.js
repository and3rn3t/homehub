/**
 * Flow Interpreter Service Test Suite
 *
 * Comprehensive tests for visual flow execution, including:
 * - Simple linear flows
 * - Conditional branching (if/else)
 * - Complex nested conditions
 * - Error handling and recovery
 * - Performance benchmarks
 *
 * Run: node scripts/test-flow-interpreter.js
 */

import { FlowInterpreterService } from '../src/services/automation/flow-interpreter.service.ts'

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
// Test Flows
// ============================================================================

/**
 * Test 1: Simple Linear Flow
 * Trigger → Action → Delay → Action
 */
const simpleLinearFlow = {
  id: 'test-linear-flow',
  name: 'Test Linear Flow',
  description: 'Simple linear execution test',
  enabled: true,
  created: new Date().toISOString(),
  nodes: [
    {
      id: 'trigger-1',
      type: 'trigger',
      subtype: 'manual',
      label: 'Manual Trigger',
      icon: 'play',
      position: { x: 100, y: 100 },
      data: { manual: true },
      connections: ['action-1'],
    },
    {
      id: 'action-1',
      type: 'action',
      subtype: 'light',
      label: 'Turn On Light',
      icon: 'lightbulb',
      position: { x: 300, y: 100 },
      data: {
        action: 'turn_on',
        deviceId: 'test-light-1',
      },
      connections: ['delay-1'],
    },
    {
      id: 'delay-1',
      type: 'delay',
      subtype: 'wait',
      label: 'Wait 1s',
      icon: 'clock',
      position: { x: 500, y: 100 },
      data: { delay: 1000 },
      connections: ['action-2'],
    },
    {
      id: 'action-2',
      type: 'action',
      subtype: 'light',
      label: 'Turn Off Light',
      icon: 'lightbulb',
      position: { x: 700, y: 100 },
      data: {
        action: 'turn_off',
        deviceId: 'test-light-1',
      },
      connections: [],
    },
  ],
}

/**
 * Test 2: Conditional Branching Flow
 * Trigger → Condition → (True: Action A) / (False: Action B)
 */
const conditionalFlow = {
  id: 'test-conditional-flow',
  name: 'Test Conditional Flow',
  description: 'If/else branching test',
  enabled: true,
  created: new Date().toISOString(),
  nodes: [
    {
      id: 'trigger-1',
      type: 'trigger',
      subtype: 'manual',
      label: 'Manual Trigger',
      icon: 'play',
      position: { x: 100, y: 150 },
      data: { manual: true, temperature: 80 },
      connections: ['condition-1'],
    },
    {
      id: 'condition-1',
      type: 'condition',
      subtype: 'temperature',
      label: 'Temp > 75°F?',
      icon: 'thermometer',
      position: { x: 300, y: 150 },
      data: {
        deviceId: 'test-sensor-1',
        operator: '>',
        threshold: 75,
      },
      connections: ['action-true', 'action-false'],
    },
    {
      id: 'action-true',
      type: 'action',
      subtype: 'light',
      label: 'Turn On Fan (Hot)',
      icon: 'fan',
      position: { x: 500, y: 50 },
      data: {
        action: 'turn_on',
        deviceId: 'test-fan-1',
      },
      connections: [],
    },
    {
      id: 'action-false',
      type: 'action',
      subtype: 'light',
      label: 'Turn Off Fan (Cool)',
      icon: 'fan',
      position: { x: 500, y: 250 },
      data: {
        action: 'turn_off',
        deviceId: 'test-fan-1',
      },
      connections: [],
    },
  ],
}

/**
 * Test 3: Complex Multi-Branch Flow
 * Trigger → Condition A → Condition B → Multiple actions
 */
const complexFlow = {
  id: 'test-complex-flow',
  name: 'Test Complex Flow',
  description: 'Nested conditions with multiple branches',
  enabled: true,
  created: new Date().toISOString(),
  nodes: [
    {
      id: 'trigger-1',
      type: 'trigger',
      subtype: 'time',
      label: 'Time Trigger',
      icon: 'clock',
      position: { x: 50, y: 200 },
      data: { time: '18:00' },
      connections: ['condition-1'],
    },
    {
      id: 'condition-1',
      type: 'condition',
      subtype: 'time_range',
      label: 'Is Evening?',
      icon: 'sun',
      position: { x: 250, y: 200 },
      data: {
        startTime: '17:00',
        endTime: '22:00',
      },
      connections: ['condition-2', 'action-no-evening'],
    },
    {
      id: 'condition-2',
      type: 'condition',
      subtype: 'presence',
      label: 'Anyone Home?',
      icon: 'home',
      position: { x: 450, y: 100 },
      data: {
        presenceRequired: true,
      },
      connections: ['action-home', 'action-away'],
    },
    {
      id: 'action-home',
      type: 'action',
      subtype: 'scene',
      label: 'Activate Evening Scene',
      icon: 'sparkles',
      position: { x: 650, y: 50 },
      data: {
        action: 'activate_scene',
        sceneId: 'evening-scene',
      },
      connections: [],
    },
    {
      id: 'action-away',
      type: 'action',
      subtype: 'light',
      label: 'Security Lights On',
      icon: 'shield',
      position: { x: 650, y: 150 },
      data: {
        action: 'turn_on',
        deviceId: 'security-lights',
      },
      connections: [],
    },
    {
      id: 'action-no-evening',
      type: 'action',
      subtype: 'light',
      label: 'All Lights Off',
      icon: 'power',
      position: { x: 450, y: 300 },
      data: {
        action: 'turn_off',
        deviceId: 'all-lights',
      },
      connections: [],
    },
  ],
}

/**
 * Test 4: Invalid Flow (No Root Nodes)
 */
const invalidFlow = {
  id: 'test-invalid-flow',
  name: 'Test Invalid Flow',
  description: 'Should fail validation',
  enabled: true,
  created: new Date().toISOString(),
  nodes: [
    {
      id: 'action-1',
      type: 'action',
      subtype: 'light',
      label: 'Orphaned Action',
      icon: 'lightbulb',
      position: { x: 100, y: 100 },
      data: { action: 'turn_on', deviceId: 'light-1' },
      connections: ['action-2'],
    },
    {
      id: 'action-2',
      type: 'action',
      subtype: 'light',
      label: 'Another Orphaned Action',
      icon: 'lightbulb',
      position: { x: 300, y: 100 },
      data: { action: 'turn_off', deviceId: 'light-1' },
      connections: ['action-1'], // Circular!
    },
  ],
}

// ============================================================================
// Test Suite
// ============================================================================

async function runTests() {
  console.log('\n' + '='.repeat(70))
  console.log('  Flow Interpreter Service - Test Suite')
  console.log('='.repeat(70) + '\n')

  const interpreter = FlowInterpreterService.getInstance()

  // Test 1: Simple Linear Flow
  await test('Simple Linear Flow Execution', async () => {
    const context = {
      flowId: simpleLinearFlow.id,
      executionId: 'test-exec-1',
      timestamp: new Date().toISOString(),
      variables: {},
      currentNodeId: null,
      visitedNodes: new Set(),
      executionStack: [],
      branchConditions: {},
      loopCounters: {},
      loopMaxIterations: {},
      debugMode: false,
      breakpoints: new Set(),
      stepMode: false,
      nodeExecutionTimes: {},
      totalExecutionTime: 0,
    }

    const result = await interpreter.executeFlow(simpleLinearFlow, context)

    assert(result.success, 'Flow should execute successfully')
    assert(
      result.executedNodes.length === 4,
      `Expected 4 nodes, got ${result.executedNodes.length}`
    )
    assert(
      result.failedNodes.length === 0,
      `Expected 0 failed nodes, got ${result.failedNodes.length}`
    )
    assert(
      result.executionTime > 1000,
      `Expected >1000ms (includes delay), got ${result.executionTime}ms`
    )

    log.gray(`  Executed ${result.executedNodes.length} nodes in ${result.executionTime}ms`)
  })

  // Test 2: Validation - Invalid Flow
  await test('Flow Validation - Circular Dependencies', async () => {
    const validation = interpreter.validateFlow(invalidFlow)

    assert(!validation.valid, 'Invalid flow should fail validation')
    assert(validation.errors.length > 0, 'Should have validation errors')

    log.gray(`  Validation errors: ${validation.errors.length}`)
    validation.errors.forEach(err => log.gray(`    - ${err}`))
  })

  // Test 3: Conditional Branching - True Path
  await test('Conditional Branching - True Path', async () => {
    const context = {
      flowId: conditionalFlow.id,
      executionId: 'test-exec-2',
      timestamp: new Date().toISOString(),
      variables: { temperature: 80 }, // Above threshold
      currentNodeId: null,
      visitedNodes: new Set(),
      executionStack: [],
      branchConditions: {},
      loopCounters: {},
      loopMaxIterations: {},
      debugMode: false,
      breakpoints: new Set(),
      stepMode: false,
      nodeExecutionTimes: {},
      totalExecutionTime: 0,
    }

    const result = await interpreter.executeFlow(conditionalFlow, context)

    assert(result.success, 'Flow should execute successfully')
    assert(result.executedNodes.includes('action-true'), 'Should execute true branch')
    assert(!result.executedNodes.includes('action-false'), 'Should NOT execute false branch')

    log.gray(`  Executed nodes: ${result.executedNodes.join(', ')}`)
    log.gray(`  Condition result: TRUE (temperature > 75)`)
  })

  // Test 4: Conditional Branching - False Path
  await test('Conditional Branching - False Path', async () => {
    const context = {
      flowId: conditionalFlow.id,
      executionId: 'test-exec-3',
      timestamp: new Date().toISOString(),
      variables: { temperature: 70 }, // Below threshold
      currentNodeId: null,
      visitedNodes: new Set(),
      executionStack: [],
      branchConditions: {},
      loopCounters: {},
      loopMaxIterations: {},
      debugMode: false,
      breakpoints: new Set(),
      stepMode: false,
      nodeExecutionTimes: {},
      totalExecutionTime: 0,
    }

    const result = await interpreter.executeFlow(conditionalFlow, context)

    assert(result.success, 'Flow should execute successfully')
    assert(!result.executedNodes.includes('action-true'), 'Should NOT execute true branch')
    assert(result.executedNodes.includes('action-false'), 'Should execute false branch')

    log.gray(`  Executed nodes: ${result.executedNodes.join(', ')}`)
    log.gray(`  Condition result: FALSE (temperature <= 75)`)
  })

  // Test 5: Complex Multi-Branch Flow
  await test('Complex Multi-Branch Flow', async () => {
    const context = {
      flowId: complexFlow.id,
      executionId: 'test-exec-4',
      timestamp: new Date().toISOString(),
      variables: {
        time: '19:30', // Evening
        presence: true, // Someone home
      },
      currentNodeId: null,
      visitedNodes: new Set(),
      executionStack: [],
      branchConditions: {},
      loopCounters: {},
      loopMaxIterations: {},
      debugMode: false,
      breakpoints: new Set(),
      stepMode: false,
      nodeExecutionTimes: {},
      totalExecutionTime: 0,
    }

    const result = await interpreter.executeFlow(complexFlow, context)

    assert(result.success, 'Flow should execute successfully')
    assert(result.executedNodes.includes('action-home'), 'Should execute home action')
    assert(!result.executedNodes.includes('action-away'), 'Should NOT execute away action')
    assert(
      !result.executedNodes.includes('action-no-evening'),
      'Should NOT execute no-evening action'
    )

    log.gray(`  Executed ${result.executedNodes.length} nodes`)
    log.gray(`  Final action: Evening Scene (home + evening)`)
  })

  // Test 6: Performance Benchmark
  await test('Performance Benchmark', async () => {
    const iterations = 100
    const times = []

    for (let i = 0; i < iterations; i++) {
      const context = {
        flowId: simpleLinearFlow.id,
        executionId: `bench-${i}`,
        timestamp: new Date().toISOString(),
        variables: {},
        currentNodeId: null,
        visitedNodes: new Set(),
        executionStack: [],
        branchConditions: {},
        loopCounters: {},
        loopMaxIterations: {},
        debugMode: false,
        breakpoints: new Set(),
        stepMode: false,
        nodeExecutionTimes: {},
        totalExecutionTime: 0,
      }

      const start = Date.now()
      await interpreter.executeFlow(simpleLinearFlow, context)
      times.push(Date.now() - start)
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length
    const minTime = Math.min(...times)
    const maxTime = Math.max(...times)

    log.gray(`  ${iterations} iterations:`)
    log.gray(`    Average: ${avgTime.toFixed(2)}ms`)
    log.gray(`    Min: ${minTime}ms`)
    log.gray(`    Max: ${maxTime}ms`)

    assert(avgTime < 2000, `Average time should be <2000ms, got ${avgTime.toFixed(2)}ms`)
  })

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
