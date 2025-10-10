/**
 * Real-Time Device Monitor
 *
 * Monitors the virtual HTTP device and displays live state changes
 * with color-coded output and power consumption tracking.
 *
 * Usage: node scripts/monitor-device.js
 */

const DEVICE_URL = 'http://localhost:8001'
const POLL_INTERVAL = 1000 // Check every 1 second
const DASHBOARD_URL = 'http://localhost:5173'

let previousState = null
let previousPower = null
let toggleCount = 0
let startTime = Date.now()

/**
 * Format timestamp for display
 */
function getTimestamp() {
  return new Date().toLocaleTimeString('en-US', {
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * Format duration since start
 */
function getDuration() {
  const elapsed = Math.floor((Date.now() - startTime) / 1000)
  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Get device status from virtual Shelly
 */
async function getDeviceStatus() {
  try {
    const response = await fetch(`${DEVICE_URL}/rpc/Switch.GetStatus?id=0`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    return { error: error.message }
  }
}

/**
 * Check if Dashboard is accessible
 */
async function checkDashboard() {
  try {
    const response = await fetch(DASHBOARD_URL)
    return response.ok
  } catch {
    return false
  }
}

/**
 * Display status with color coding
 */
function displayStatus(status) {
  const timestamp = getTimestamp()
  const duration = getDuration()

  if (status.error) {
    console.log(`[${timestamp}] ❌ Device Offline | ${status.error}`)
    return
  }

  const isOn = status.output
  const power = status.apower
  const voltage = status.voltage
  const current = status.current
  const temp = status.temperature?.tC

  // Detect state change
  const stateChanged = previousState !== null && previousState !== isOn
  const powerChanged = previousPower !== null && Math.abs(previousPower - power) > 0.1

  if (stateChanged) {
    toggleCount++
    console.log('')
    console.log('━'.repeat(80))
    console.log(`🔄 STATE CHANGE DETECTED! (Toggle #${toggleCount})`)
    console.log(`   ${previousState ? 'ON' : 'OFF'} → ${isOn ? 'ON' : 'OFF'}`)
    console.log(`   Power: ${previousPower}W → ${power}W`)
    console.log('━'.repeat(80))
    console.log('')
  }

  // Status line
  const statusIcon = isOn ? '🟢' : '⚪'
  const statusText = isOn ? 'ON ' : 'OFF'
  const powerBar = '█'.repeat(Math.floor(power / 3)) || '░'

  console.log(
    `[${timestamp}] ${statusIcon} ${statusText} | ` +
      `⚡ ${power.toFixed(1)}W ${powerBar} | ` +
      `🔌 ${voltage.toFixed(1)}V | ` +
      `⏱️ ${duration} | ` +
      `🔢 ${toggleCount} toggles`
  )

  previousState = isOn
  previousPower = power
}

/**
 * Display header
 */
async function displayHeader() {
  console.clear()
  console.log('╔' + '═'.repeat(78) + '╗')
  console.log('║' + ' '.repeat(20) + '🏠 HomeHub Device Monitor' + ' '.repeat(33) + '║')
  console.log('╚' + '═'.repeat(78) + '╝')
  console.log('')
  console.log('📡 Device URL:', DEVICE_URL)
  console.log('🌐 Dashboard:', DASHBOARD_URL)

  const dashboardOnline = await checkDashboard()
  console.log('📊 Dashboard Status:', dashboardOnline ? '✅ Online' : '❌ Offline')

  console.log('')
  console.log('💡 Living Room Lamp (Shelly Plus 1)')
  console.log('   Protocol: HTTP/REST')
  console.log('   Polling: Every 1 second')
  console.log('')
  console.log('🎯 Instructions:')
  console.log('   - Toggle the "Living Room Lamp" in the Dashboard UI')
  console.log('   - Watch for state changes below')
  console.log('   - Press Ctrl+C to stop monitoring')
  console.log('')
  console.log('─'.repeat(80))
  console.log('')
}

/**
 * Main monitoring loop
 */
async function monitor() {
  await displayHeader()

  console.log(`[${getTimestamp()}] 🚀 Monitoring started...`)
  console.log('')

  // Initial status
  const initialStatus = await getDeviceStatus()
  if (!initialStatus.error) {
    console.log(
      `Initial State: ${initialStatus.output ? '🟢 ON' : '⚪ OFF'} (${initialStatus.apower}W)`
    )
    console.log('')
    previousState = initialStatus.output
    previousPower = initialStatus.apower
  }

  // Poll loop
  const intervalId = setInterval(async () => {
    const status = await getDeviceStatus()
    displayStatus(status)
  }, POLL_INTERVAL)

  // Cleanup on exit
  process.on('SIGINT', () => {
    console.log('')
    console.log('')
    console.log('─'.repeat(80))
    console.log(`📊 Session Summary:`)
    console.log(`   Duration: ${getDuration()}`)
    console.log(`   Total Toggles: ${toggleCount}`)
    console.log(`   Final State: ${previousState ? '🟢 ON' : '⚪ OFF'}`)
    console.log('─'.repeat(80))
    console.log('')
    console.log('👋 Monitoring stopped')
    clearInterval(intervalId)
    process.exit(0)
  })
}

// Start monitoring
monitor().catch(error => {
  console.error('❌ Monitor failed:', error)
  process.exit(1)
})
