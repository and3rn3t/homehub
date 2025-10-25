# Virtual Devices Quick Reference

Complete guide for using HomeHub virtual MQTT devices for testing.

---

## 🚀 Quick Start

### 1. Start MQTT Broker

```bash
docker-compose up -d
```

### 2. Launch Virtual Devices

```bash
# Single device
node scripts/virtual-device.js light my-light

# Multiple devices (recommended)
node scripts/launch-virtual-devices.js --preset default
```

### 3. Run Integration Tests

```bash
# Terminal 1: Start test device
node scripts/virtual-device.js light integration-test-light

# Terminal 2: Run tests
node scripts/test-integration.js
```

---

## 📋 Device Types

| Type         | Command     | Capabilities                             | Value Range |
| ------------ | ----------- | ---------------------------------------- | ----------- |
| `light`      | Brightness  | `toggle`, `set_value`                    | 0-100%      |
| `thermostat` | Temperature | `toggle`, `set_value`, `set_temperature` | 60-85°F     |
| `sensor`     | Reading     | `get_state`                              | 0-100       |
| `plug`       | Power       | `toggle`, `get_state`                    | 0-1500W     |
| `switch`     | On/Off      | `toggle`, `get_state`                    | 0-1         |

---

## 🎮 Launcher Presets

```bash
# Default: 2 lights + 1 thermostat
node scripts/launch-virtual-devices.js

# Full house: 20 devices
node scripts/launch-virtual-devices.js --preset full-house

# Minimal: 1 light + 1 sensor
node scripts/launch-virtual-devices.js --preset minimal

# Stress test: 20 devices
node scripts/launch-virtual-devices.js --preset stress

# Custom: 5 lights
node scripts/launch-virtual-devices.js --type light --count 5
```

---

## 📡 MQTT Topics

### Command Topics (Subscribe)

```text
homehub/devices/{deviceId}/set      # Receive commands
homehub/devices/{deviceId}/get      # State query requests
homehub/system/status               # Discovery requests
```

### State Topics (Publish)

```text
homehub/devices/{deviceId}/state    # Device state updates
homehub/discovery/announce          # Device announcements
```

---

## 💬 Command Format

### Toggle Device

```bash
mosquitto_pub -t "homehub/devices/my-light/set" \
  -m '{"command":"toggle"}'
```

### Set Brightness

```bash
mosquitto_pub -t "homehub/devices/my-light/set" \
  -m '{"command":"set_value","value":75}'
```

### Set Temperature

```bash
mosquitto_pub -t "homehub/devices/main-thermostat/set" \
  -m '{"command":"set_temperature","value":72}'
```

### Get State

```bash
mosquitto_pub -t "homehub/devices/my-light/get" \
  -m '{"command":"get_state"}'
```

### Trigger Discovery

```bash
mosquitto_pub -t "homehub/system/status" \
  -m '{"action":"discover"}'
```

---

## 📊 Monitoring

### Subscribe to All States

```bash
mosquitto_sub -t "homehub/devices/+/state"
```

### Subscribe to Discovery

```bash
mosquitto_sub -t "homehub/discovery/#"
```

### Subscribe to Specific Device

```bash
mosquitto_sub -t "homehub/devices/my-light/#"
```

---

## 🧪 Testing Workflows

### Workflow 1: Single Device Test

```bash
# Terminal 1: Start device
node scripts/virtual-device.js light test-light

# Terminal 2: Monitor state
mosquitto_sub -t "homehub/devices/test-light/state"

# Terminal 3: Send commands
mosquitto_pub -t "homehub/devices/test-light/set" -m '{"command":"toggle"}'
```

### Workflow 2: Multi-Device Test

```bash
# Terminal 1: Start devices
node scripts/launch-virtual-devices.js --preset full-house

# Terminal 2: Monitor all
mosquitto_sub -t "homehub/devices/+/state"

# Terminal 3: Integration test
node scripts/test-integration.js
```

### Workflow 3: Discovery Test

```bash
# Terminal 1: Start devices
node scripts/launch-virtual-devices.js --preset default

# Terminal 2: Monitor discovery
mosquitto_sub -t "homehub/discovery/announce"

# Terminal 3: Trigger discovery
mosquitto_pub -t "homehub/system/status" -m '{"action":"discover"}'
```

---

## 🔍 Troubleshooting

### Device Not Connecting

```bash
# Check broker is running
docker ps --filter "name=mosquitto"

# Check broker logs
docker logs homehub-mosquitto

# Test connection
node scripts/test-mqtt-connection.js
```

### Commands Not Working

```bash
# Verify device is subscribed
# Look for: "📥 Subscribed to: homehub/devices/{id}/set"

# Test with mosquitto_pub
mosquitto_pub -t "homehub/devices/{id}/set" -m '{"command":"toggle"}'

# Check message format
# Must be valid JSON with "command" field
```

### State Updates Not Received

```bash
# Subscribe to state topic
mosquitto_sub -t "homehub/devices/{id}/state"

# Trigger state update
mosquitto_pub -t "homehub/devices/{id}/get" -m '{"command":"get_state"}'

# Check heartbeat (30 seconds)
# Wait for automatic state publish
```

---

## 📝 Common Use Cases

### Test Automation Rules

```bash
# Start devices
node scripts/launch-virtual-devices.js --preset default

# Monitor states
mosquitto_sub -t "homehub/devices/+/state"

# Simulate automation trigger
mosquitto_pub -t "homehub/devices/living-room-light/set" \
  -m '{"command":"set_value","value":100}'
```

### Test Scene Activation

```bash
# Start multiple lights
node scripts/launch-virtual-devices.js --type light --count 5

# Activate scene (turn all on at 50%)
for i in {1..5}; do
  mosquitto_pub -t "homehub/devices/light-$i/set" \
    -m '{"command":"set_value","value":50}'
done
```

### Load Testing

```bash
# Start 20 devices
node scripts/launch-virtual-devices.js --preset stress

# Send rapid commands
for i in {1..100}; do
  mosquitto_pub -t "homehub/devices/stress-device-1/set" \
    -m '{"command":"toggle"}'
  sleep 0.1
done
```

---

## 🎯 Best Practices

1. **Use Presets**: Start with `--preset default` for most testing
2. **Monitor Output**: Always have a terminal with `mosquitto_sub` running
3. **Check Discovery**: Verify devices announce on startup
4. **Test Integration**: Run `test-integration.js` after changes
5. **Graceful Shutdown**: Use Ctrl+C to stop devices cleanly
6. **Name Devices**: Use descriptive IDs like `bedroom-light` not `device-1`
7. **Validate JSON**: Ensure command messages are valid JSON
8. **Check QoS**: Commands use QoS 1 for reliable delivery

---

## 📚 Related Documentation

- `docs/PHASE_2.1.3_COMPLETE.md` - Complete milestone report
- `docs/PHASE_2.1_PROGRESS.md` - Phase progress tracker
- `scripts/virtual-device.js` - Device implementation
- `scripts/launch-virtual-devices.js` - Launcher implementation
- `scripts/test-integration.js` - Integration tests

---

## 🆘 Support

**Issue**: Device not starting

- Check Node.js version (requires v20+)
- Verify MQTT broker is running
- Check `.env` file for correct broker URL

**Issue**: Commands timing out

- Verify device is subscribed to correct topic
- Check MQTT broker logs for connection issues
- Ensure JSON format is valid

**Issue**: Discovery not working

- Verify device announces on startup (look for "📢 Device announced")
- Check discovery topic: `mosquitto_sub -t "homehub/discovery/#"`
- Ensure broker allows wildcard subscriptions

---

**Last Updated**: January 2025
**Version**: 1.0
