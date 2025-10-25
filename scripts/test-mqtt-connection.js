/**
 * MQTT Connection Test Script
 *
 * Tests connection to Mosquitto broker and basic pub/sub functionality.
 * Usage: node scripts/test-mqtt-connection.js
 */

import mqtt from 'mqtt'

const BROKER_URL = 'mqtt://localhost:1883'
const TEST_TOPIC = 'homehub/test'

console.log('🔌 Connecting to MQTT broker:', BROKER_URL)

const client = mqtt.connect(BROKER_URL, {
  clientId: `test-client-${Math.random().toString(16).slice(2, 8)}`,
  clean: true,
  connectTimeout: 5000,
})

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker!')
  console.log('📡 Subscribing to test topic:', TEST_TOPIC)

  client.subscribe(TEST_TOPIC, { qos: 1 }, err => {
    if (err) {
      console.error('❌ Subscribe error:', err)
      process.exit(1)
    }

    console.log('✅ Subscribed successfully!')
    console.log('📤 Publishing test message...')

    // Publish test message
    client.publish(
      TEST_TOPIC,
      JSON.stringify({
        message: 'Hello from HomeHub!',
        timestamp: new Date().toISOString(),
      }),
      { qos: 1 }
    )
  })
})

client.on('message', (topic, payload) => {
  console.log('📨 Received message on', topic)
  console.log('📦 Payload:', payload.toString())

  try {
    const data = JSON.parse(payload.toString())
    console.log('✅ Message parsed successfully:', data)
  } catch (err) {
    console.log('⚠️  Message is not JSON:', payload.toString())
  }

  console.log('\n✨ MQTT connection test successful!')
  console.log('🎉 Milestone 2.1.1 Environment Setup: COMPLETE')

  // Disconnect
  setTimeout(() => {
    client.end()
    process.exit(0)
  }, 1000)
})

client.on('error', error => {
  console.error('❌ Connection error:', error)
  process.exit(1)
})

client.on('disconnect', () => {
  console.log('🔌 Disconnected from broker')
})

// Timeout after 10 seconds
setTimeout(() => {
  console.error('❌ Test timeout - no message received')
  client.end()
  process.exit(1)
}, 10000)
