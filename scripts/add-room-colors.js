/**
 * Add Color Tinting to Rooms
 *
 * This script adds color properties to room definitions for visual tinting.
 * iOS-inspired color palette for different room types.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Room color mappings based on room names/types
const roomColorMap = {
  // Living spaces - warm orange/amber
  'Family Room': 'orange',
  'Living Room': 'orange',
  'Sun Room': 'amber',

  // Dining/Kitchen - warm red/rose
  'Dining Room': 'rose',
  Kitchen: 'red',

  // Entry/Utility - blue/cyan
  Entryway: 'cyan',
  Stairs: 'blue',

  // Work/Study - purple/indigo
  Office: 'purple',
  Study: 'indigo',

  // Outdoor - green/emerald
  Outdoor: 'emerald',
  Garden: 'green',
  Patio: 'lime',

  // Bedrooms - soft colors
  Bedroom: 'violet',
  'Master Bedroom': 'purple',

  // Other/Default - neutral
  Other: 'slate',
  Garage: 'zinc',
}

// iOS-inspired color palette (Tailwind CSS classes)
const colorPalette = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
]

async function addRoomColors() {
  try {
    // Read generated rooms
    const roomsPath = path.join(__dirname, '../data/generated-rooms.json')
    const roomsData = JSON.parse(fs.readFileSync(roomsPath, 'utf-8'))

    console.log(`📂 Found ${roomsData.length} rooms to update`)

    // Add colors to each room
    const updatedRooms = roomsData.map((room, index) => {
      // Try to match room name to color map
      let color = roomColorMap[room.name]

      // If no match, assign color based on index (cycling through palette)
      if (!color) {
        color = colorPalette[index % colorPalette.length]
      }

      return {
        ...room,
        color,
      }
    })

    // Write updated rooms back to file
    fs.writeFileSync(roomsPath, JSON.stringify(updatedRooms, null, 2))

    console.log('✅ Room colors added successfully!')
    console.log('\n📊 Color Assignments:')
    updatedRooms.forEach(room => {
      console.log(`  ${room.name}: ${room.color}`)
    })

    console.log('\n💡 Next Steps:')
    console.log('1. Import rooms using debug-tools/import-rooms.html')
    console.log('2. Refresh the Dashboard to see room colors')
  } catch (error) {
    console.error('❌ Error adding room colors:', error)
    process.exit(1)
  }
}

// Run the script
addRoomColors()
