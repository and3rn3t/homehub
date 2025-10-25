# Dashboard MQTT Integration Testing Guide

## ✅ Milestone 2.1.4 Complete

**Date**: January 2025
**Status**: Implementation Complete
**Testing**: Ready for Validation

---

## 🎯 What Was Built

### 1. React Hooks (451 lines total)

#### `useMQTTDevices()` Hook (336 lines)

**File**: `src/hooks/use-mqtt-devices.ts`

**Features**:

- Device state management via MQTT
- Optimistic UI updates for instant feedback
- Automatic connection on mount
- Device discovery support
- Connection monitoring
- Error handling with detailed states

**API**:

```typescript
const {
  devices, // Device[] - Current device list
  isConnected, // boolean - MQTT connection status
  connectionState, // MQTTConnectionState - Detailed state
  sendCommand, // Function to control devices
  discoverDevices, // Function to find new devices
  connect, // Manual connect
  disconnect, // Manual disconnect
  isLoading, // boolean - Loading state
  error, // Error | null - Error state
} = useMQTTDevices()
```

#### `useMQTTConnection()` Hook (115 lines)

**File**: `src/hooks/use-mqtt-connection.ts`

**Features**:

- Lightweight connection monitoring
- Connect/disconnect controls
- Real-time status updates
- Error reporting

**API**:

```typescript
const {
  isConnected, // boolean - Connection status
  connectionState, // MQTTConnectionState - Detailed state
  connect, // Function to connect
  disconnect, // Function to disconnect
  error, // Error | null - Error state
} = useMQTTConnection()
```

### 2. Dashboard Integration

**File**: `src/components/Dashboard.tsx`

**Changes**:

1. **Hybrid Device Management**
   - Primary: MQTT devices (when connected)
   - Fallback: KV store with mock data
   - Seamless switching between modes

2. **Connection Status Indicator**
   - Green badge: "MQTT Connected" (when connected)
   - Yellow badge: "Reconnecting..." (during reconnect)
   - Red button: "Reconnect" (on error/disconnect)
   - Animated icons for visual feedback

3. **Device Discovery Button**
   - Visible only when MQTT connected
   - One-click discovery trigger
   - Toast notifications for feedback

4. **Optimistic UI Updates**
   - Instant toggle response
   - Background MQTT command
   - Error rollback (TODO)

---

## 🧪 Testing Procedures

### Prerequisites

1. **MQTT Broker Running**

```bash
docker-compose up -d
docker ps --filter "name=mosquitto"
# Should show: homehub-mosquitto: Up X minutes
```

2. **Environment Variables**

```bash
cat .env | grep MQTT
# Should show: VITE_MQTT_BROKER_URL=ws://localhost:9001
```

3. **Development Server**

```bash
npm run dev
# Should start on: http://localhost:5173
```

---

### Test Suite

#### Test 1: Application Startup

**Steps**:

1. Open browser to `http://localhost:5173`
2. Observe Dashboard loads
3. Check browser console for errors

**Expected Results**:

- ✅ Dashboard renders without errors
- ✅ Mock devices displayed (fallback mode)
- ✅ Connection indicator shows appropriate state
- ✅ Console shows MQTT connection attempt

**Actual Results**:

- Status: ⏳ To be tested
- Notes: ******\_\_\_******

---

#### Test 2: Virtual Device Discovery

**Steps**:

1. In terminal: `node scripts/launch-virtual-devices.js --preset default`
2. Wait 2-3 seconds for devices to announce
3. In browser, observe connection status
4. Click "Discover" button in Dashboard

**Expected Results**:

- ✅ Connection badge changes to green "MQTT Connected"
- ✅ Toast notification: "Device discovery complete"
- ✅ Devices appear in Dashboard (3 devices: 2 lights, 1 thermostat)

**Actual Results**:

- Status: ⏳ To be tested
- Device count: ******\_\_\_******
- Notes: ******\_\_\_******

---

#### Test 3: Device Control via MQTT

**Steps**:

1. Click toggle switch on "living-room-light"
2. Observe UI feedback
3. Check virtual device terminal output

**Expected Results**:

- ✅ UI toggle switches immediately (optimistic update)
- ✅ Toast: "Living Room Light turned on"
- ✅ Virtual device logs: "📨 Received command: {"command":"toggle"}"
- ✅ Virtual device logs: "✅ Published state: ON"

**Actual Results**:

- Status: ⏳ To be tested
- Response time: ******\_\_\_******
- Notes: ******\_\_\_******

---

#### Test 4: Connection Loss Recovery

**Steps**:

1. Stop MQTT broker: `docker stop homehub-mosquitto`
2. Observe Dashboard connection indicator
3. Try to toggle a device
4. Restart broker: `docker start homehub-mosquitto`
5. Click "Reconnect" button

**Expected Results**:

- ✅ Connection badge changes to red "Reconnect" button
- ✅ Device toggles still work (fallback to KV store)
- ✅ Toast: "Command sent locally (MQTT disconnected)"
- ✅ After reconnect: Badge turns green "MQTT Connected"

**Actual Results**:

- Status: ⏳ To be tested
- Fallback worked: ******\_\_\_******
- Reconnect worked: ******\_\_\_******

---

#### Test 5: Real-Time State Updates

**Steps**:

1. Ensure MQTT connected with virtual devices running
2. In terminal: `mosquitto_pub -t "homehub/devices/living-room-light/set" -m '{"command":"toggle"}'`
3. Observe Dashboard UI

**Expected Results**:

- ✅ Device state updates in Dashboard within 1 second
- ✅ Toggle switch reflects new state
- ✅ No page refresh required

**Actual Results**:

- Status: ⏳ To be tested
- Update latency: ******\_\_\_******
- Notes: ******\_\_\_******

---

#### Test 6: Discovery with Multiple Devices

**Steps**:

1. Stop existing virtual devices (Ctrl+C)
2. Launch full house: `node scripts/launch-virtual-devices.js --preset full-house`
3. Wait 5 seconds for all devices to connect
4. Click "Discover" button in Dashboard

**Expected Results**:

- ✅ Toast: "Device discovery complete"
- ✅ All 20 devices appear in Dashboard
- ✅ Devices grouped by room
- ✅ All show "online" status

**Actual Results**:

- Status: ⏳ To be tested
- Device count: ******\_\_\_******
- Missing devices: ******\_\_\_******

---

#### Test 7: Connection State Indicators

**Steps**:

1. Start with MQTT disconnected
2. Observe "Reconnect" button
3. Click "Reconnect"
4. Observe reconnection flow

**Expected Results**:

- ✅ Initial: Red button "Reconnect"
- ✅ During: Yellow badge "Reconnecting..." (spinning icon)
- ✅ Success: Green badge "MQTT Connected"
- ✅ Failure: Red button reappears with error toast

**Actual Results**:

- Status: ⏳ To be tested
- Visual feedback: ******\_\_\_******

---

#### Test 8: Optimistic UI Updates

**Steps**:

1. MQTT connected with virtual devices
2. Click device toggle rapidly 5 times
3. Observe UI response

**Expected Results**:

- ✅ UI responds instantly to each click
- ✅ No lag or delay
- ✅ Final state matches virtual device state
- ✅ No "flash" or incorrect states

**Actual Results**:

- Status: ⏳ To be tested
- Response time: ******\_\_\_******
- Sync issues: ******\_\_\_******

---

## 🐛 Known Issues & Limitations

### Current Limitations

1. **Real-Time State Updates**
   - ⚠️ Wildcard subscriptions not yet implemented in DeviceRegistry
   - **Impact**: State updates only received when commands are sent
   - **Workaround**: Discovery button refreshes device states
   - **Fix Required**: Implement wildcard subscription in service layer

2. **Optimistic Update Rollback**
   - ⚠️ No rollback mechanism on command failure
   - **Impact**: UI may show incorrect state if MQTT command fails
   - **Workaround**: Refresh page or trigger discovery
   - **Fix Required**: Add error handling with state rollback

3. **Device State Persistence**
   - ⚠️ MQTT device states not persisted to KV store
   - **Impact**: Lost when page refreshes (falls back to mock data)
   - **Workaround**: Discovery re-fetches devices
   - **Fix Required**: Sync MQTT devices to KV store periodically

---

## 📊 Performance Metrics

### Expected Benchmarks

| Metric                   | Target           | Actual | Status |
| ------------------------ | ---------------- | ------ | ------ |
| **MQTT Connect Time**    | <2s              | \_\_\_ | ⏳     |
| **Device Discovery**     | <5s (20 devices) | \_\_\_ | ⏳     |
| **Toggle Response**      | <100ms (UI)      | \_\_\_ | ⏳     |
| **State Update Latency** | <500ms           | \_\_\_ | ⏳     |
| **Reconnect Time**       | <3s              | \_\_\_ | ⏳     |

---

## 🎯 Success Criteria

### Must Pass ✅

- [ ] Application loads without errors
- [ ] MQTT connection establishes automatically
- [ ] Device discovery finds all virtual devices
- [ ] Device toggles control virtual devices
- [ ] Connection status indicator updates correctly
- [ ] Reconnect button restores connection
- [ ] Fallback to mock data works when MQTT unavailable

### Nice to Have 🎨

- [ ] Smooth animations on state changes
- [ ] Toast notifications for all actions
- [ ] Error messages are clear and actionable
- [ ] Connection state changes are visually obvious

---

## 🚀 Next Steps (Phase 2.1.5)

After validation of Milestone 2.1.4, proceed with:

1. **Service Layer Enhancements**
   - Implement wildcard subscriptions in DeviceRegistry
   - Add optimistic update rollback mechanism
   - Add device state persistence to KV store

2. **Physical Device Integration**
   - Connect real smart light (Tasmota/ESPHome/Shelly)
   - Test with actual hardware
   - Monitor stability over 7 days

3. **Additional Features**
   - Device grouping by room in Dashboard
   - Favorite device quick actions
   - Device health monitoring
   - Battery level indicators for sensors

---

## 📸 Visual Testing Checklist

### Connection Status Indicator

**Screenshot Locations**: Dashboard header, right of title

| State        | Icon            | Color  | Text              | Tested |
| ------------ | --------------- | ------ | ----------------- | ------ |
| Connected    | WifiHigh        | Green  | "MQTT Connected"  | ⏳     |
| Reconnecting | ArrowsClockwise | Yellow | "Reconnecting..." | ⏳     |
| Error        | WifiSlash       | Red    | "Reconnect"       | ⏳     |

### Device Cards

**Screenshot Locations**: Favorite Devices section

| Element          | Expected              | Tested |
| ---------------- | --------------------- | ------ |
| Device name      | Displays from MQTT    | ⏳     |
| Device type icon | Correct icon for type | ⏳     |
| Toggle switch    | Interactive           | ⏳     |
| Online status    | Green badge           | ⏳     |
| Value display    | Shows brightness/temp | ⏳     |

---

## 🔧 Troubleshooting Guide

### Issue: MQTT Not Connecting

**Symptoms**:

- Connection indicator stuck on "Reconnecting..."
- Console errors about WebSocket connection

**Solutions**:

1. Check broker is running: `docker ps`
2. Verify port 9001 is accessible: `netstat -an | findstr 9001`
3. Check `.env` file has correct `VITE_MQTT_BROKER_URL`
4. Try restarting broker: `docker restart homehub-mosquitto`

### Issue: Devices Not Discovered

**Symptoms**:

- "Discover" button shows success but no devices appear
- Virtual devices running but not visible

**Solutions**:

1. Check virtual device terminal for connection logs
2. Verify devices announced: Look for "📢 Device announced for discovery"
3. Check MQTT traffic: `mosquitto_sub -t "homehub/discovery/#"`
4. Manually trigger discovery from browser console:

   ```javascript
   // In browser console
   window.__mqtt_discovery_debug = true
   ```

### Issue: Device Controls Not Working

**Symptoms**:

- Toggle switch changes but device doesn't respond
- No error messages

**Solutions**:

1. Check if MQTT connected (green badge)
2. Verify virtual device is subscribed to commands
3. Check browser console for command errors
4. Test with mosquitto_pub manually:

   ```bash
   mosquitto_pub -t "homehub/devices/{deviceId}/set" -m '{"command":"toggle"}'
   ```

---

## 📝 Testing Log

### Test Session 1

**Date**: ******\_\_\_******
**Tester**: ******\_\_\_******
**Environment**: Dev server + Docker Mosquitto

**Tests Completed**: ***/ 8
**Tests Passed**:*** / 8
**Tests Failed**: \_\_\_ / 8

**Issues Found**:

1. ***
2. ***
3. ***

**Notes**:

---

---

---

---

## ✅ Sign-Off

### Development Team

- [ ] Code complete
- [ ] TypeScript errors: 0
- [ ] ESLint warnings: Acceptable (TODO comments)
- [ ] Unit tests: N/A (integration testing)
- [ ] Documentation complete

**Developer**: ******\_\_\_******
**Date**: ******\_\_\_******

### QA Team

- [ ] All tests passed
- [ ] Performance metrics met
- [ ] Visual testing complete
- [ ] Cross-browser tested (if applicable)

**QA Engineer**: ******\_\_\_******
**Date**: ******\_\_\_******

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Status**: Ready for Testing
