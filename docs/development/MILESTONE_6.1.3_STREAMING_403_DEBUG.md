# Milestone 6.1.3: Streaming 403 Error Investigation

**Date**: October 13, 2025
**Issue**: Arlo API returns 403 Forbidden when attempting to start camera stream
**Status**: Under Investigation

## Problem Description

When clicking "Start Live Stream" in the camera details modal, the Arlo API responds with:

```
POST http://localhost:8788/hmsweb/users/devices/startStream 403 (Forbidden)
```

## Technical Details

### Request Being Sent

**Endpoint**: `POST /hmsweb/users/devices/startStream`

**Headers** (from `arloTokenManager.exportAsHeaders()`):

```json
{
  "accept": "application/json",
  "accept-language": "en-US,en;q=0.9",
  "auth-version": "<token.authVersion>",
  "authorization": "<token.authorization>",
  "content-type": "application/json; charset=utf-8",
  "origin": "https://my.arlo.com",
  "referer": "https://my.arlo.com/",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...",
  "xcloudid": "<token.xcloudid>"
}
```

**Payload**:

```json
{
  "from": "<deviceId>_web",
  "to": "<deviceId>",
  "action": "set",
  "resource": "cameras/<deviceId>",
  "publishResponse": true,
  "transId": "web!<timestamp>",
  "properties": {
    "activityState": "startUserStream",
    "cameraId": "<deviceId>"
  }
}
```

### Camera Information

- **Status**: Online (provisioned)
- **Type**: Various (camera, doorbell)
- **Authentication**: Valid token from Phase 4 (401 refresh working)
- **Other APIs**: Working (device list, snapshot refresh, etc.)

## Possible Causes

### 1. Subscription Requirements ⚠️ **Most Likely**

Arlo cloud streaming typically requires an active **Arlo Smart subscription**:

- Basic plan may only support local storage/playback
- Cloud streaming requires premium tier
- API returns 403 if subscription is inactive or insufficient

**Verification Steps**:

- Check Arlo account subscription status at https://my.arlo.com/
- Look for "Arlo Smart" or "Arlo Secure" plan details
- Verify streaming entitlements in account settings

### 2. Base Station Offline

Some Arlo cameras require a base station to be online:

- VMB3000/4000/5000 series base stations
- Camera must be connected and synced
- Base station acts as streaming gateway

**Verification Steps**:

- Check if cameras appear in Arlo app when away from home network
- Look for base station devices in `/hmsweb/users/devices` response
- Verify base station `state === 'provisioned'` and has network connectivity

### 3. Camera Model Limitations

Not all Arlo cameras support cloud streaming:

- Older models (original Arlo, Arlo Pro 1) may be limited
- Some cameras only support local recording
- Doorbell cameras may have different API endpoints

**Verification Steps**:

- Check `deviceType` field in API response
- Cross-reference with Arlo's official feature matrix
- Test with different camera models if available

### 4. API Rate Limiting

Arlo may rate-limit streaming requests:

- Too many startStream calls in short period
- Multiple simultaneous streams
- Account-level rate limits

**Verification Steps**:

- Wait 5-10 minutes between test attempts
- Check for `429 Too Many Requests` in responses
- Monitor API response headers for rate limit info

### 5. Incorrect Payload Format

The request payload may need adjustments:

- Different `activityState` values for different camera types
- Missing required fields
- Incorrect `resource` path format

**Verification Steps**:

- Compare with Arlo's official API documentation (if available)
- Try alternative payload formats from community examples
- Check Arlo's browser network traffic when using their web app

## Debugging Improvements Made

### Enhanced Error Logging

**File**: `src/services/devices/ArloAdapter.ts`

```typescript
if (!response.ok) {
  let errorDetails = `Status: ${response.status} ${response.statusText}`
  try {
    const errorData = await response.json()
    errorDetails += `\nResponse: ${JSON.stringify(errorData, null, 2)}`
  } catch {
    const errorText = await response.text()
    errorDetails += `\nText: ${errorText}`
  }
  console.error('[ArloAdapter] Stream start failed:', errorDetails)
  return null
}
```

### Payload Logging

```typescript
const payload = {
  from: `${device.deviceId}_web`,
  to: device.deviceId,
  action: 'set',
  resource: `cameras/${device.deviceId}`,
  publishResponse: true,
  transId: `web!${Date.now()}`,
  properties: {
    activityState: 'startUserStream',
    cameraId: device.deviceId,
  },
}

console.log('[ArloAdapter] Stream request payload:', JSON.stringify(payload, null, 2))
```

### Improved User Feedback

**File**: `src/components/CameraDetailsModal.tsx`

```tsx
if (!streamUrl) {
  alert(
    'Live streaming is currently unavailable for this camera.\n\n' +
      'This could be due to:\n' +
      '• Camera requires an active Arlo Smart subscription\n' +
      '• Camera base station is offline\n' +
      '• Camera model does not support cloud streaming\n' +
      '• API rate limiting or temporary service issue\n\n' +
      'Please check the console for detailed error information.'
  )
}
```

## Next Steps

### Immediate Actions

1. **Refresh browser** and test again - new logging will show exact API response
2. **Check console** for detailed error JSON from Arlo API
3. **Review Arlo account** subscription status
4. **Verify base station** status if applicable

### Alternative Approaches

If cloud streaming is unavailable:

#### Option A: RTSP Direct Streaming

- Many Arlo cameras expose RTSP streams on local network
- Format: `rtsp://<camera-ip>:<port>/live`
- Requires: Camera IP discovery, local network access
- Pro: No subscription required, lower latency
- Con: Only works on home network, requires setup

#### Option B: Snapshot Pseudo-Streaming

- Rapid snapshot refresh (1-2 fps)
- Already implemented snapshot system
- Pro: Works with basic subscription, simple
- Con: Not true video, high bandwidth

#### Option C: Test Stream for Demo

- Use public HLS test stream URL for UI demonstration
- Example: `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`
- Pro: Always works, shows video player functionality
- Con: Not real camera footage

#### Option D: Record & Playback

- Focus on recorded clip playback instead of live streaming
- Use `/hmsweb/users/library` API to fetch recordings
- Pro: Available with basic plans
- Con: Not live, may have cloud storage limits

## References

- **Arlo API Endpoint**: `POST /hmsweb/users/devices/startStream`
- **Authentication**: Phase 4 Token Manager (`ArloTokenManager.ts`)
- **Camera Discovery**: `ArloAdapter.discoverDevices()` - 6 cameras found
- **Related Files**:
  - `src/services/devices/ArloAdapter.ts` (lines 552-605: startStream method)
  - `src/components/CameraDetailsModal.tsx` (lines 72-127: stream handling)
  - `src/components/HLSVideoPlayer.tsx` (305 lines: video player ready)

## Expected Outcomes

### If Subscription Issue

- API will return JSON with error message about subscription
- Need to upgrade Arlo plan or accept limitation
- Document as known limitation in README

### If Base Station Issue

- Need to discover base station devices
- Add base station status check before streaming
- Show user-friendly message about base station requirement

### If API Format Issue

- API response will show validation errors
- Adjust payload format based on error details
- May need to reverse-engineer from Arlo web app

### If Rate Limit

- Response headers will show rate limit info
- Implement exponential backoff retry logic
- Add cooldown period between stream attempts

---

**Current Status**: Awaiting test results with enhanced error logging to determine root cause.
