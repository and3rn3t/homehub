#!/usr/bin/env node
/**
 * Test Scene Activation
 * Activates a scene and applies all device states to your Hue lights
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Hue Bridge configuration
const HUE_BRIDGE_IP = '192.168.1.6'
const HUE_API_KEY = 'xddEM82d6i8rZDvEy0jAdXL3rA8vxmnxTSUBIhyA'

// Load scenes
const scenesPath = path.join(__dirname, '..', 'data', 'generated-scenes.json')
const scenes = JSON.parse(fs.readFileSync(scenesPath, 'utf8'))

// Get scene from command line argument
const sceneArg = process.argv[2]

if (!sceneArg) {
  console.log('🎬 Available Scenes:\n')
  scenes.forEach((scene, index) => {
    console.log(`${index + 1}. ${scene.name} (${scene.icon})`)
    console.log(`   ${scene.description}`)
    console.log(`   Command: node scripts/test-scene.js ${index + 1}`)
    console.log('')
  })
  console.log('Usage: node scripts/test-scene.js <scene-number>')
  process.exit(0)
}

const sceneIndex = parseInt(sceneArg) - 1
if (sceneIndex < 0 || sceneIndex >= scenes.length) {
  console.error(`❌ Invalid scene number. Choose 1-${scenes.length}`)
  process.exit(1)
}

const scene = scenes[sceneIndex]
console.log(`\n🎬 Activating Scene: ${scene.name}`)
console.log(`📝 ${scene.description}\n`)

// Execute scene by applying each device state
async function activateScene() {
  let successCount = 0
  let failCount = 0

  for (const deviceState of scene.deviceStates) {
    // Extract numeric ID from device ID (e.g., "hue-1" -> "1")
    const numericId = deviceState.deviceId.replace('hue-', '')

    try {
      const state = {
        on: deviceState.enabled,
      }

      // Add brightness if specified
      if (deviceState.value !== undefined && deviceState.enabled) {
        // Convert 0-100 to 1-254 (Hue brightness range)
        state.bri = Math.round((deviceState.value / 100) * 254)
      }

      const url = `http://${HUE_BRIDGE_IP}/api/${HUE_API_KEY}/lights/${numericId}/state`
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      })

      const result = await response.json()

      if (result[0]?.success) {
        successCount++
        let action = 'OFF'
        if (deviceState.enabled) {
          action = deviceState.value !== undefined ? `ON @ ${deviceState.value}%` : 'ON'
        }
        console.log(`  ✅ Light ${numericId}: ${action}`)
      } else {
        failCount++
        console.log(`  ❌ Light ${numericId}: Failed - ${JSON.stringify(result)}`)
      }
    } catch (error) {
      failCount++
      console.log(`  ❌ Light ${numericId}: Error - ${error.message}`)
    }

    // Small delay to avoid overwhelming the bridge
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  console.log(`\n📊 Results: ${successCount} succeeded, ${failCount} failed`)

  if (failCount === 0) {
    console.log(`✅ Scene "${scene.name}" activated successfully!`)
  } else {
    console.log(`⚠️  Scene "${scene.name}" activated with ${failCount} errors`)
  }
}

activateScene().catch(error => {
  console.error('❌ Error activating scene:', error)
  process.exit(1)
})
