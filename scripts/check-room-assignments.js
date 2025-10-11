#!/usr/bin/env node
/**
 * Check Room Assignments
 * Verifies that devices are properly assigned to their rooms
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

console.log('=== Room Structure ===\n')
rooms.forEach(room => {
  console.log(`📁 ${room.name} (${room.id})`)
  console.log(`   Icon: ${room.icon}`)
  console.log(`   Device count: ${room.deviceIds.length}`)
  console.log('')
})

console.log('\n=== Device Distribution ===\n')
const devicesByRoom = {}
devices.forEach(d => {
  if (!devicesByRoom[d.room]) {
    devicesByRoom[d.room] = []
  }
  devicesByRoom[d.room].push(d)
})

Object.entries(devicesByRoom).forEach(([roomName, devs]) => {
  console.log(`${roomName}: ${devs.length} devices`)
  devs.forEach(d => {
    const status = d.reachable ? '✅' : '❌'
    console.log(`  ${status} ${d.name} (${d.id})`)
  })
  console.log('')
})

console.log('\n=== Room Matching Check ===\n')
const roomNames = rooms.map(r => r.name)
const deviceRoomNames = [...new Set(devices.map(d => d.room))]

console.log('Rooms in structure:', roomNames.join(', '))
console.log('Rooms in devices:', deviceRoomNames.join(', '))

const mismatched = deviceRoomNames.filter(dr => !roomNames.includes(dr))
if (mismatched.length > 0) {
  console.log('\n⚠️  Rooms in devices but not in room structure:', mismatched.join(', '))
} else {
  console.log('\n✅ All device rooms match room structure!')
}
