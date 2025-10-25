#!/usr/bin/env node
/**
 * Assign Devices to Rooms
 * Updates room objects with deviceIds arrays and ensures all devices reference valid rooms
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load data
const devicesPath = path.join(__dirname, '..', 'data', 'hue-devices.json')
const roomsPath = path.join(__dirname, '..', 'data', 'generated-rooms.json')

const devices = JSON.parse(fs.readFileSync(devicesPath, 'utf8'))
const rooms = JSON.parse(fs.readFileSync(roomsPath, 'utf8'))

console.log('📊 Starting device-to-room assignment...\n')

// Build device-to-room mapping
const devicesByRoomName = {}
devices.forEach(device => {
  if (!devicesByRoomName[device.room]) {
    devicesByRoomName[device.room] = []
  }
  devicesByRoomName[device.room].push(device.id)
})

console.log('Device distribution by room name:')
Object.entries(devicesByRoomName).forEach(([roomName, deviceIds]) => {
  console.log(`  ${roomName}: ${deviceIds.length} devices`)
})
console.log('')

// Update rooms with deviceIds
const updatedRooms = rooms.map(room => {
  const deviceIds = devicesByRoomName[room.name] || []
  return {
    ...room,
    deviceIds,
    deviceCount: deviceIds.length,
  }
})

// Check for mismatches
const roomNames = rooms.map(r => r.name)
const deviceRoomNames = Object.keys(devicesByRoomName)
const mismatched = deviceRoomNames.filter(dr => !roomNames.includes(dr))

if (mismatched.length > 0) {
  console.log('⚠️  Warning: Some devices reference rooms not in the room structure:')
  mismatched.forEach(roomName => {
    const count = devicesByRoomName[roomName].length
    console.log(`  - "${roomName}": ${count} device(s) - ${devicesByRoomName[roomName].join(', ')}`)
  })
  console.log('')
  console.log('💡 Suggestion: Create rooms for these or reassign devices to existing rooms\n')
}

// Save updated rooms
fs.writeFileSync(roomsPath, JSON.stringify(updatedRooms, null, 2))
console.log('✅ Updated rooms saved to:', roomsPath)

// Show final room structure
console.log('\n📁 Final Room Structure:\n')
updatedRooms.forEach(room => {
  const emoji = room.deviceIds.length > 0 ? '✅' : '⚠️ '
  console.log(`${emoji} ${room.name} (${room.id})`)
  console.log(`   Icon: ${room.icon}`)
  console.log(`   Devices: ${room.deviceIds.length}`)
  if (room.deviceIds.length > 0 && room.deviceIds.length <= 3) {
    console.log(`   Device IDs: ${room.deviceIds.join(', ')}`)
  }
  console.log('')
})

// Summary
const totalAssigned = updatedRooms.reduce((sum, room) => sum + room.deviceIds.length, 0)
console.log(`\n📊 Summary: ${totalAssigned}/${devices.length} devices assigned to rooms`)

if (mismatched.length > 0) {
  const unassigned = devices.length - totalAssigned
  console.log(`⚠️  ${unassigned} devices in unmatched rooms need attention`)
  console.log('\nRun this script again after fixing room names or creating missing rooms.')
}
