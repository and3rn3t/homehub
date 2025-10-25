#!/usr/bin/env node

/**
 * Auto-generate Rooms from Hue Devices
 *
 * Extracts unique room names from hue-devices.json and creates Room entities
 */

import fs from 'fs'

const DEVICES_FILE = './data/hue-devices.json'
const ROOMS_OUTPUT = './data/generated-rooms.json'

console.log('🏠 Auto-generating Rooms from Hue Devices\n')

try {
  // Read devices
  const devicesData = fs.readFileSync(DEVICES_FILE, 'utf-8')
  const devices = JSON.parse(devicesData)

  console.log(`📦 Loaded ${devices.length} devices`)

  // Extract unique room names
  const roomNames = new Set()
  devices.forEach(device => {
    if (device.room && device.room !== 'Unassigned') {
      roomNames.add(device.room)
    }
  })

  console.log(`\n🔍 Found ${roomNames.size} unique rooms:`)
  Array.from(roomNames)
    .sort()
    .forEach(room => {
      const count = devices.filter(d => d.room === room).length
      console.log(`   • ${room} (${count} device${count !== 1 ? 's' : ''})`)
    })

  // Icon mapping based on room type
  const iconMap = {
    'Living Room': 'Couch',
    Bedroom: 'Bed',
    Kitchen: 'CookingPot',
    Bathroom: 'Shower',
    Office: 'Desktop',
    Garage: 'Car',
    Outdoor: 'Tree',
    Garden: 'Plant',
    'Dining Room': 'ForkKnife',
    'Family Room': 'Users',
    'Game Room': 'GameController',
    'Sun Room': 'Sun',
    Entry: 'Door',
    Stairs: 'Stairs',
    Hallway: 'ArrowsOutCardinal',
    Other: 'House',
  }

  // Generate room objects
  const rooms = Array.from(roomNames)
    .sort()
    .map((roomName, index) => {
      const deviceCount = devices.filter(d => d.room === roomName).length
      const icon = iconMap[roomName] || 'House'

      return {
        id: `room-${index + 1}`,
        name: roomName,
        icon: icon,
        deviceCount: deviceCount,
        color: undefined, // Optional custom color
      }
    })

  // Write to file
  fs.writeFileSync(ROOMS_OUTPUT, JSON.stringify(rooms, null, 2))

  console.log(`\n✅ Generated ${rooms.length} rooms`)
  console.log(`📄 Saved to: ${ROOMS_OUTPUT}`)

  // Show generated rooms
  console.log('\n📋 Generated Rooms:\n')
  rooms.forEach(room => {
    console.log(`${room.id}: ${room.name}`)
    console.log(`   Icon: ${room.icon}`)
    console.log(`   Devices: ${room.deviceCount}`)
    console.log()
  })

  console.log('✅ Next steps:')
  console.log('   1. Review generated-rooms.json')
  console.log('   2. Import these rooms into your KV store')
  console.log('   3. The Rooms view will automatically show organized layout')
} catch (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}
