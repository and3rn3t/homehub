# 🚀 HomeHub MQTT Quick Reference

## Status Check

```powershell
# Is broker running?
docker ps | Select-String mosquitto

# View logs
docker logs homehub-mosquitto -f
```

## Common Commands

```powershell
# Start
docker-compose up -d mosquitto

# Stop
docker-compose down

# Restart
docker-compose restart mosquitto

# Test connection
node scripts/test-mqtt-connection.js
```

## Connection Info

- **MQTT**: `mqtt://localhost:1883`
- **WebSocket**: `ws://localhost:9001`
- **Auth**: Anonymous (dev only)

## Topic Structure

```
homehub/
  devices/{deviceId}/state    # Device reports state
  devices/{deviceId}/set      # Send commands
  devices/{deviceId}/get      # Request state
  discovery/announce          # New devices
```

## Example: Publish Command

```javascript
import mqtt from 'mqtt'

const client = mqtt.connect('mqtt://localhost:1883')
client.on('connect', () => {
  // Toggle device
  client.publish('homehub/devices/light1/set', JSON.stringify({ command: 'toggle' }), { qos: 1 })
})
```

## Example: Subscribe to State

```javascript
client.subscribe('homehub/devices/+/state', { qos: 1 })

client.on('message', (topic, payload) => {
  const state = JSON.parse(payload.toString())
  console.log('Device state:', state)
})
```

## Troubleshooting

```powershell
# Port conflicts?
netstat -ano | findstr "1883\|9001"

# Permission issues?
docker restart homehub-mosquitto

# Not receiving messages?
# Check QoS level (use 1 or 2)
# Verify topic names match exactly
```

## Files Location

```
mosquitto/
  config/mosquitto.conf   # Configuration
  data/                   # Persistent storage
  log/                    # Broker logs
```

## Next Steps

✅ Milestone 2.1.1 Complete
⏳ Milestone 2.1.2 - Service Layer (TypeScript classes)
⏳ Milestone 2.1.3 - Virtual devices
⏳ Milestone 2.1.4 - Dashboard integration
⏳ Milestone 2.1.5 - Physical device

---

**Need help?** See `docs/PHASE_2.1_MQTT_SETUP.md` for full guide
