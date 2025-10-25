#!/usr/bin/env node
/**
 * Generate Useful Scenes
 * Creates practical scenes based on actual Hue devices
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const devicesPath = path.join(__dirname, '..', 'data', 'hue-devices.json')
const devices = JSON.parse(fs.readFileSync(devicesPath, 'utf8'))

console.log('🎬 Generating practical scenes from your 22 Hue lights...\n')

// Use all lights (we'll filter unreachable ones in the UI later)
const allLights = devices
console.log(`✅ Using all ${allLights.length} lights for scene generation\n`)

// Get lights by room
const familyRoomLights = allLights.filter(d => d.room === 'Family Room')
const diningRoomLights = allLights.filter(d => d.room === 'Dining Room')
const outdoorLights = allLights.filter(d => d.room === 'Outdoor')
const entrywayLights = allLights.filter(d => d.room === 'Entryway')
const otherLights = allLights.filter(d => d.room === 'Other')

// Scene 1: All Off
const allOffScene = {
  id: 'scene-all-off',
  name: 'All Off',
  icon: 'moon',
  description: 'Turn off all lights in the house',
  enabled: true,
  deviceStates: allLights.map(device => ({
    deviceId: device.id,
    enabled: false,
  })),
}

// Scene 2: Movie Time (dim Family Room to 25%)
const movieTimeScene = {
  id: 'scene-movie-time',
  name: 'Movie Time',
  icon: 'play',
  description: 'Dim Family Room lights to 25% for movie watching',
  enabled: true,
  deviceStates: [
    // Dim Family Room to 25%
    ...familyRoomLights.map(device => ({
      deviceId: device.id,
      enabled: true,
      value: 25,
    })),
    // Turn off all other lights
    ...allLights
      .filter(d => d.room !== 'Family Room')
      .map(device => ({
        deviceId: device.id,
        enabled: false,
      })),
  ],
}

// Scene 3: Dinner Time (Dining Room full, Family Room 50%, others off)
const dinnerScene = {
  id: 'scene-dinner',
  name: 'Dinner Time',
  icon: 'coffee',
  description: 'Dining Room full brightness, Family Room ambient',
  enabled: true,
  deviceStates: [
    // Dining Room full
    ...diningRoomLights.map(device => ({
      deviceId: device.id,
      enabled: true,
      value: 100,
    })),
    // Family Room ambient (50%)
    ...familyRoomLights.map(device => ({
      deviceId: device.id,
      enabled: true,
      value: 50,
    })),
    // Turn off other lights
    ...allLights
      .filter(d => !['Dining Room', 'Family Room'].includes(d.room))
      .map(device => ({
        deviceId: device.id,
        enabled: false,
      })),
  ],
}

// Scene 4: Good Morning (gradual brightness, main areas)
const morningScene = {
  id: 'scene-good-morning',
  name: 'Good Morning',
  icon: 'sun',
  description: 'Turn on main living areas at 75% brightness',
  enabled: true,
  deviceStates: [
    // Family Room, Dining Room, Entryway at 75%
    ...allLights
      .filter(d => ['Family Room', 'Dining Room', 'Entryway'].includes(d.room))
      .map(device => ({
        deviceId: device.id,
        enabled: true,
        value: 75,
      })),
    // Turn off other lights
    ...allLights
      .filter(d => !['Family Room', 'Dining Room', 'Entryway'].includes(d.room))
      .map(device => ({
        deviceId: device.id,
        enabled: false,
      })),
  ],
}

// Scene 5: Welcome Home (Entryway, Outdoor, Family Room on)
const welcomeHomeScene = {
  id: 'scene-welcome-home',
  name: 'Welcome Home',
  icon: 'home',
  description: 'Turn on entry areas and main living space',
  enabled: true,
  deviceStates: [
    // Entryway, Outdoor, Family Room full
    ...allLights
      .filter(d => ['Entryway', 'Outdoor', 'Family Room'].includes(d.room))
      .map(device => ({
        deviceId: device.id,
        enabled: true,
        value: 100,
      })),
    // Turn off other lights
    ...allLights
      .filter(d => !['Entryway', 'Outdoor', 'Family Room'].includes(d.room))
      .map(device => ({
        deviceId: device.id,
        enabled: false,
      })),
  ],
}

const scenes = [allOffScene, movieTimeScene, dinnerScene, morningScene, welcomeHomeScene]

// Save to file
const outputPath = path.join(__dirname, '..', 'data', 'generated-scenes.json')
fs.writeFileSync(outputPath, JSON.stringify(scenes, null, 2))

console.log('✅ Generated 5 practical scenes:\n')
scenes.forEach((scene, index) => {
  const deviceCount = scene.deviceStates.length
  const enabledCount = scene.deviceStates.filter(s => s.enabled).length
  console.log(`${index + 1}. ${scene.name} (${scene.icon})`)
  console.log(`   ${scene.description}`)
  console.log(
    `   Affects ${deviceCount} devices (${enabledCount} on, ${deviceCount - enabledCount} off)`
  )
  console.log('')
})

console.log(`💾 Saved to: ${outputPath}`)
console.log('\n📋 Next steps:')
console.log('1. Open http://localhost:5173/debug-tools/import-scenes.html (need to create this)')
console.log('2. Click "Import Scenes" button')
console.log('3. Refresh HomeHub and test scenes from Dashboard or Scenes tab\n')
