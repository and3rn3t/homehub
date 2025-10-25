// Add protocol field to all MOCK_DEVICES
// Assigns 'http' to specific devices, 'mqtt' to all others

import { readFileSync, writeFileSync } from 'fs'

const filePath = 'src/constants/mock-data.ts'
const content = readFileSync(filePath, 'utf-8')

// Define which devices should be HTTP (rest will be MQTT)
const httpDevices = [
  'living-room-lamp', // Shelly
  'bedroom-lamp', // TPLink
  'bathroom-light', // Hue
  'smart-plug-tv', // Generic
]

// Split into lines for processing
const lines = content.split('\n')
const output = []
let inDevicesArray = false
let currentDeviceId = null
let insideConfig = false

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]

  // Track when we're inside MOCK_DEVICES array
  if (line.includes('export const MOCK_DEVICES:')) {
    inDevicesArray = true
  }

  // Track when we exit MOCK_DEVICES
  if (inDevicesArray && line.match(/^\s*\]\s*$/)) {
    inDevicesArray = false
  }

  // Track device ID
  const idMatch = line.match(/id:\s*'([^']+)'/)
  if (idMatch) {
    currentDeviceId = idMatch[1]
  }

  // Track config object
  if (line.trim() === 'config: {') {
    insideConfig = true
  }
  if (insideConfig && line.trim() === '},') {
    insideConfig = false
  }

  // Insert protocol field after "enabled:" line
  if (inDevicesArray && currentDeviceId && !insideConfig) {
    const enabledMatch = line.match(/^(\s+)enabled:\s*(true|false),\s*$/)
    if (enabledMatch) {
      const indent = enabledMatch[1]
      const protocol = httpDevices.includes(currentDeviceId) ? 'http' : 'mqtt'
      output.push(line) // Add the enabled line
      output.push(`${indent}protocol: '${protocol}',`) // Add protocol line
      continue // Skip adding line again below
    }
  }

  output.push(line)
}

writeFileSync(filePath, output.join('\n'), 'utf-8')
console.log('✅ Added protocol field to all devices')
console.log(`   - HTTP devices: ${httpDevices.length}`)
console.log(`   - MQTT devices: ${output.filter(l => l.includes("protocol: 'mqtt'")).length}`)
