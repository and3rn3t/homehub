#!/usr/bin/env node
/**
 * Quick check - what's in the worker KV store?
 */

async function checkWorkerKV() {
  try {
    const response = await fetch('http://127.0.0.1:8787/kv/devices')

    if (!response.ok) {
      console.error('❌ Worker not responding')
      return
    }

    const result = await response.json()
    const devices = result.value || []

    console.log(`\n📊 Worker KV Store Status:`)
    console.log(`   Total devices: ${devices.length}`)
    console.log(`   Hue devices: ${devices.filter(d => d.protocol === 'hue').length}`)
    console.log(`   MQTT devices: ${devices.filter(d => d.protocol === 'mqtt').length}`)
    console.log(`   HTTP devices: ${devices.filter(d => d.protocol === 'http').length}`)

    const hueDevices = devices.filter(d => d.protocol === 'hue')
    if (hueDevices.length > 0) {
      console.log(`\n💡 Hue Devices:`)
      hueDevices.slice(0, 5).forEach(d => {
        console.log(`   ${d.name} (${d.id}) - ${d.enabled ? 'ON' : 'OFF'} - ${d.status}`)
      })
      if (hueDevices.length > 5) {
        console.log(`   ... and ${hueDevices.length - 5} more`)
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkWorkerKV()
