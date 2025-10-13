# Testing Virtual HTTP Devices - Step by Step Guide

**Date**: October 10, 2025

---

## 🎯 Quick Test (Recommended)

### Step 1: Start Test Device

Open **Terminal 1** and run:

```powershell
npm run test-device
```

You should see:

```text
✅ Test Shelly Device Running
   URL: http://localhost:8001
   State: OFF
```

**Keep this terminal open!** The device will run until you press Ctrl+C.

### Step 2: Test in Browser

Open your web browser and navigate to:

**Device Info**: <http://localhost:8001/shelly>

You should see:

```json
{
  "name": "Test Shelly Device",
  "type": "light",
  "mac": "AA:BB:CC:DD:EE:FF",
  "model": "Shelly Plus 1",
  "gen": 2,
  "fw_id": "1.0.0",
  "app": "Switch"
}
```

**Device Status**: <http://localhost:8001/rpc/Switch.GetStatus?id=0>

You should see:

```json
{
  "id": 0,
  "source": "http",
  "output": false,
  "apower": 0,
  "voltage": 230.1,
  "current": 0
}
```

### Step 3: Test with PowerShell (Separate Terminal)

Open **Terminal 2** (PowerShell) and run these commands:

**Get Device Info**:

```powershell
Invoke-RestMethod -Uri "http://localhost:8001/shelly"
```

**Get Status**:

```powershell
Invoke-RestMethod -Uri "http://localhost:8001/rpc/Switch.GetStatus?id=0"
```

**Toggle Device**:

```powershell
Invoke-RestMethod -Uri "http://localhost:8001/rpc/Switch.Toggle?id=0" -Method POST
```

**Check Status Again** (should be ON now):

```powershell
Invoke-RestMethod -Uri "http://localhost:8001/rpc/Switch.GetStatus?id=0"
```

**Turn ON Explicitly**:

```powershell
Invoke-RestMethod -Uri "http://localhost:8001/rpc/Switch.Set?id=0&on=true" -Method POST
```

**Turn OFF**:

```powershell
Invoke-RestMethod -Uri "http://localhost:8001/rpc/Switch.Set?id=0&on=false" -Method POST
```

### Step 4: Watch the Logs

In **Terminal 1** (where the device is running), you'll see logs like:

```text
State changed: false → true
Toggled: true → false
```

---

## 🏠 Full House Test (Multiple Devices)

### Step 1: Kill Any Running Devices

```powershell
# Find processes on ports 8001-8005
netstat -ano | findstr :800

# Kill specific process (replace PID with actual process ID)
taskkill /F /PID <PID>
```

### Step 2: Start Multiple Devices

In **Terminal 1**:

```powershell
npm run http-devices
```

You should see 5 devices start:

- Port 8001: Living Room Light (Shelly)
- Port 8002: Bedroom Light (Shelly)
- Port 8003: Kitchen Light (TPLink)
- Port 8004: Bathroom Light (Hue)
- Port 8005: Office Light (Generic)

### Step 3: Test Each Device

In **Terminal 2** or **Browser**:

**Shelly Device (Port 8001)**:

```powershell
Invoke-RestMethod -Uri "http://localhost:8001/shelly"
Invoke-RestMethod -Uri "http://localhost:8001/rpc/Switch.GetStatus?id=0"
Invoke-RestMethod -Uri "http://localhost:8001/rpc/Switch.Toggle?id=0" -Method POST
```

**Shelly Device (Port 8002)**:

```powershell
Invoke-RestMethod -Uri "http://localhost:8002/shelly"
Invoke-RestMethod -Uri "http://localhost:8002/rpc/Switch.Toggle?id=0" -Method POST
```

**TPLink Device (Port 8003)**:

```powershell
Invoke-RestMethod -Uri "http://localhost:8003/api/system/get_sysinfo"
```

**Hue Device (Port 8004)**:

```powershell
Invoke-RestMethod -Uri "http://localhost:8004/api/lights/1"
```

**Generic Device (Port 8005)**:

```powershell
Invoke-RestMethod -Uri "http://localhost:8005/api/devices"
Invoke-RestMethod -Uri "http://localhost:8005/api/devices/1/status"
```

---

## 🐛 Troubleshooting

### Error: Cannot GET /shelly

**Problem**: Old device process still running on port 8001

**Solution**:

```powershell
# Find process
netstat -ano | findstr :8001

# Kill it (replace PID)
taskkill /F /PID <PID>

# Restart device
npm run test-device
```

### Error: EADDRINUSE

**Problem**: Port already in use

**Solution**: Kill the process using that port (see above)

### Device Stops When Testing

**Problem**: Terminal loses focus or Ctrl+C pressed accidentally

**Solution**: Make sure you're running commands in a **separate terminal** from where the device is running

### No Response from Device

**Problem**: Device not actually running or on wrong port

**Solution**:

```powershell
# Check what's listening on port 8001
netstat -ano | findstr :8001

# Test health endpoint
curl http://localhost:8001/health

# Or in browser
http://localhost:8001/health
```

---

## ✅ Expected Results

### Device Info Response

```json
{
  "name": "Test Shelly Device",
  "type": "light",
  "mac": "AA:BB:CC:DD:EE:FF",
  "model": "Shelly Plus 1",
  "gen": 2
}
```

### Status Response (OFF)

```json
{
  "id": 0,
  "source": "http",
  "output": false,
  "apower": 0
}
```

### Status Response (ON)

```json
{
  "id": 0,
  "source": "http",
  "output": true,
  "apower": 15.5
}
```

### Toggle Response

```json
{
  "was_on": false
}
```

---

## 📝 Testing Checklist

- [ ] Start test device (`npm run test-device`)
- [ ] Device shows "Running" message
- [ ] Open http://localhost:8001/shelly in browser - see JSON
- [ ] GET status endpoint - see output: false
- [ ] POST toggle endpoint - see was_on response
- [ ] GET status again - see output: true
- [ ] Logs show state changes in Terminal 1
- [ ] POST set endpoint with on=false - device turns off
- [ ] All tests pass ✅

---

## 🎓 Tips

1. **Always use 2 terminals**: One for running the device, one for testing
2. **Use browser for GET requests**: Easier to see JSON responses
3. **Use PowerShell for POST requests**: Invoke-RestMethod makes it easy
4. **Watch the logs**: Terminal 1 shows all state changes in real-time
5. **Kill old processes**: If you get errors, check for processes on ports 8001-8005

---

## 🚀 Next Steps

Once you can toggle the test device:

1. **Try HTTP adapter in code** - Connect HTTPDeviceAdapter to localhost:8001
2. **Test multi-protocol** - Run MQTT broker + HTTP device together
3. **Dashboard integration** - Show HTTP devices in UI (Milestone 2.2.2)

---

## 📚 Reference

- **Simple Test Script**: `scripts/test-device-simple.js`
- **Full Launch Script**: `scripts/launch-http-devices.js`
- **HTTP Adapter**: `src/services/device/HTTPDeviceAdapter.ts`
- **Quick Start Guide**: `docs/HTTP_ADAPTER_QUICKSTART.md`
