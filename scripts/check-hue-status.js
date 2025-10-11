#!/usr/bin/env node

/**
 * Check Hue Light Status
 * 
 * Shows which lights are reachable/unreachable
 */

const BRIDGE_IP = '192.168.1.6'
const API_KEY = 'xddEM82d6i8rZDvEy0jAdXL3rA8vxmnxTSUBIhyA'

console.log('🔍 Checking Hue Light Status\n')

async function checkLights() {
  try {
    const response = await fetch(`http://${BRIDGE_IP}/api/${API_KEY}/lights`)
    
    if (!response.ok) {
      console.error('❌ Failed to get lights:', response.status)
      return
    }

    const lights = await response.json()
    
    if (lights[0]?.error) {
      console.error('❌ API Error:', lights[0].error)
      return
    }

    const lightsList = Object.entries(lights).map(([id, light]) => ({
      id,
      name: light.name,
      reachable: light.state.reachable,
      on: light.state.on,
      bri: Math.round((light.state.bri / 254) * 100),
    }))

    console.log(`Total lights: ${lightsList.length}\n`)

    // Reachable lights
    const reachable = lightsList.filter(l => l.reachable)
    console.log(`✅ Reachable lights (${reachable.length}):`)
    console.log('─'.repeat(60))
    reachable.forEach(light => {
      const status = light.on ? `ON (${light.bri}%)` : 'OFF'
      console.log(`  ${light.id.padStart(2)}. ${light.name.padEnd(30)} ${status}`)
    })

    // Unreachable lights
    const unreachable = lightsList.filter(l => !l.reachable)
    if (unreachable.length > 0) {
      console.log(`\n❌ Unreachable lights (${unreachable.length}):`)
      console.log('─'.repeat(60))
      unreachable.forEach(light => {
        console.log(`  ${light.id.padStart(2)}. ${light.name}`)
      })
      
      console.log('\n💡 Unreachable lights are:')
      console.log('   • Physically disconnected or powered off')
      console.log('   • Out of range from the Hue bridge')
      console.log('   • Having connection issues')
      console.log('\n   These will show as greyed out in HomeHub')
    } else {
      console.log('\n✅ All lights are reachable!')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkLights()
