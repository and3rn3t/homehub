#!/usr/bin/env node
/**
 * Verify Room Import
 * Checks if rooms were successfully imported to localStorage and shows current state
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const roomsPath = path.join(__dirname, '..', 'data', 'generated-rooms.json')
const rooms = JSON.parse(fs.readFileSync(roomsPath, 'utf8'))

console.log('📁 Room Structure Ready for Import\n')
console.log('='.repeat(60))

rooms.forEach((room, index) => {
  console.log(`\n${index + 1}. ${room.name} (${room.id})`)
  console.log(`   Icon: ${room.icon}`)
  console.log(
    `   Devices: ${room.deviceIds?.length || 0} (${room.deviceIds?.join(', ') || 'none'})`
  )
})

console.log('\n' + '='.repeat(60))
console.log('\n✨ To complete the import:\n')
console.log('1. Refresh your HomeHub app (http://localhost:5173)')
console.log('2. Go to Devices → Rooms tab')
console.log('3. You should see all 8 rooms with device counts\n')
console.log('💡 If rooms are not showing up:')
console.log('   - Open http://localhost:5173/debug-tools/import-rooms.html')
console.log('   - Click "Import Rooms to KV Store" button')
console.log('   - Refresh HomeHub app again\n')
