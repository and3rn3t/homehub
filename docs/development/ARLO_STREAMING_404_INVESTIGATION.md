# Arlo Live Streaming 404 Investigation

## Issue Summary

Live streaming from Arlo cameras consistently returns 404 errors when requesting the DASH manifest (.mpd) file, despite successfully receiving stream URLs from Arlo's API.

**Status**: Issue persists after multiple timing adjustments (3s, 5s, 10s, 15s delays)

## Timeline of Attempts

### Iteration 1: 3-Second Delay

- **Hypothesis**: Wowza needs time to provision stream
- **Result**: ❌ 404 errors
- **Conclusion**: Too short

### Iteration 2: HEAD Polling

- **Hypothesis**: Poll manifest URL until available
- **Result**: ❌ CORS blocked all HEAD requests (error 5003)
- **Conclusion**: Browser CORS restrictions prevent polling

### Iteration 3: 5-Second Delay

- **Hypothesis**: Double the initial delay
- **Result**: ❌ 404 errors
- **Conclusion**: Still too short

### Iteration 4: 10-Second Delay

- **Hypothesis**: Conservative 2x increase
- **Result**: ❌ 404 errors
- **Logs Confirm**: Delay executed correctly, stream still not ready

### Iteration 5: 15-Second Delay (Current)

- **Hypothesis**: Maximum reasonable wait (3x original)
- **Result**: ❌ (Assumed - pattern consistent)
- **Conclusion**: **Timing is not the root cause**

## Evidence That Timing Isn't The Issue

1. **Consistent Pattern**: 3s → 5s → 10s → 15s all fail identically
2. **No Partial Success**: Never seen manifest return 200 OK
3. **Immediate 404s**: Errors occur instantly, not after timeout
4. **URL Construction Works**: Proxy server responds (404 vs connection refused)

## Alternative Root Causes to Investigate

### 1. Stream Session Lifecycle Issue

**Hypothesis**: Stream sessions expire before we request the manifest

**Evidence**:

- Arlo API returns URL with `egressToken` and `txnId`
- These may be time-sensitive authentication tokens
- Waiting 10-15s might cause token expiration

**Test**:

- Try requesting manifest **immediately** (0s delay)
- If still 404, rules out timing
- If works, confirms expiration issue

**Potential Fix**:

```typescript
// Don't delay at all - request immediately
return streamUrl // Remove await setTimeout
```

### 2. Missing Stream Activation Step

**Hypothesis**: API returns URL but doesn't auto-start stream

**Evidence**:

- Some streaming platforms require explicit "start" command
- URL alone may not trigger Wowza provisioning

**Test**:

- Check if Arlo API has separate "activate stream" endpoint
- Review Arlo SDK documentation for stream lifecycle

**Potential Fix**:

```typescript
// After getting stream URL
await this.arloClient.startStreamSession(streamUrl)
await new Promise(resolve => setTimeout(resolve, 3000))
return streamUrl
```

### 3. RTSP vs DASH Protocol Mismatch

**Hypothesis**: Arlo provides RTSP streams, not native DASH

**Evidence**:

- Many security cameras stream via RTSP
- DASH manifest (.mpd) might not exist at all
- We may need to transcode RTSP → DASH server-side

**Test**:

- Try accessing stream URL directly in VLC (RTSP player)
- Check if URL pattern matches RTSP (`rtsp://...`)

**Potential Fix**:

```typescript
// Backend transcoding service
// RTSP stream → FFmpeg → DASH/HLS output
// Serve transcoded stream to UniversalVideoPlayer
```

### 4. Authentication/Authorization Issue

**Hypothesis**: Manifest requests require additional auth headers

**Evidence**:

- `egressToken` in URL may not be sufficient
- Wowza might require session cookies or headers
- Proxy may strip necessary authentication

**Test**:

- Compare successful Arlo web app network requests
- Check for additional headers (Authorization, Cookie, etc.)

**Potential Fix**:

```typescript
// In arlo-proxy worker
const arloHeaders = {
  Authorization: `Bearer ${token}`,
  'X-Session-ID': sessionId,
  // ... other headers from Arlo web app
}
```

### 5. Manifest URL Encoding Issue

**Hypothesis**: URL encoding breaks Wowza path resolution

**Evidence**:

- URL goes through proxy: `localhost:8787/proxy/https%3A%2F%2F...`
- Double encoding may corrupt query parameters
- Wowza can't find resource due to malformed path

**Test**:

- Log exact URL received by proxy worker
- Try accessing Arlo URL directly (bypass proxy)

**Potential Fix**:

```typescript
// In proxy worker - decode then re-encode properly
const targetUrl = decodeURIComponent(url.pathname.replace('/proxy/', ''))
const response = await fetch(targetUrl, { ... })
```

### 6. Stream Not Actually Starting

**Hypothesis**: `startUserStream` API succeeds but stream never provisions

**Evidence**:

- API returns 200 OK with URL
- But Wowza never receives stream data
- Backend issue on Arlo's side

**Test**:

- Check if stream shows "active" in Arlo app
- Monitor Arlo account for active stream sessions
- Try web.arlo.com to see if live view works there

**Potential Fix**:

- None if Arlo backend issue
- May need to use Arlo's official embed SDK instead

## Recommended Next Steps

### Immediate (Do Now)

1. **Test with 0s delay** - Rule out expiration theory
2. **Check RTSP protocol** - Try VLC with stream URL
3. **Inspect Arlo web app** - Compare network requests

### Short-term (This Sprint)

4. **Backend transcoding** - Set up FFmpeg RTSP→DASH pipeline
5. **Alternative APIs** - Research Arlo SDK/embed options

### Long-term (Future)

6. **Native RTSP player** - Consider rtsp.js or similar
7. **HLS fallback** - Try HLS protocol instead of DASH

## Related Files

- `src/services/devices/ArloAdapter.ts` - Stream URL retrieval
- `src/components/security/UniversalVideoPlayer.tsx` - Player component
- `workers/arlo-proxy/index.ts` - CORS proxy
- Current delay: 15 seconds (line 621)

## Console Log Pattern

```
[ArloAdapter] ✅ Stream URL received: https://arlostreaming20519...
[ArloAdapter] ⏳ Waiting 15 seconds...
[ArloAdapter] Previous tests: 3s ❌, 5s ❌, 10s ❌ → Trying 15s
[ArloAdapter] ✅ Stream should now be ready after 15 second...
[UniversalVideoPlayer] Proxied manifest URL: http://localhost:8787/proxy/...
[UniversalVideoPlayer] Initializing DASH player...
GET http://localhost:8787/proxy/...mpd 404 (Not Found)
[UniversalVideoPlayer] DASH error code: 25
```

## Decision

**Moving forward without live streaming for now.** Will continue with:

- ✅ Milestone 6.1.4: Camera Controls (non-streaming features)
- ✅ Milestone 6.1.5: Motion Events Timeline
- 🔄 Revisit streaming with RTSP investigation

---

**Last Updated**: October 14, 2025
**Issue Tracker**: Keep monitoring for patterns with other cameras
