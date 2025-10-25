# Debugging: No Video Loading Issue

**Problem**: Video player appears but no video loads, no errors in console

## Diagnostic Steps

### Step 1: Check Browser Console

After clicking "Start Live Stream", look for these specific logs:

#### Expected in CameraDetailsModal

```
[CameraDetailsModal] Starting stream for camera: Front Yard
[CameraDetailsModal] Token found, initializing adapter...
[CameraDetailsModal] Adapter initialized, starting stream...
[CameraDetailsModal] Stream URL result: https://arlostreaming...mpd
[CameraDetailsModal] ✅ Stream URL received: https://arlostreaming...mpd
```

#### Expected in UniversalVideoPlayer

```
[UniversalVideoPlayer] Props received: { streamUrl: "https://...", hasStreamUrl: true, ... }
[UniversalVideoPlayer] Detecting stream type for URL: https://arlostreaming...mpd
[UniversalVideoPlayer] Detected DASH stream (.mpd)
[UniversalVideoPlayer] Initializing DASH player for Front Yard
[UniversalVideoPlayer] Stream URL: https://arlostreaming...mpd
[UniversalVideoPlayer] Original stream URL: https://arlostreaming...mpd
[UniversalVideoPlayer] Proxied manifest URL: http://localhost:8787/proxy/https%3A%2F%2F...
[UniversalVideoPlayer] Initializing DASH player...
[UniversalVideoPlayer] DASH manifest loaded: {...}
[UniversalVideoPlayer] DASH stream initialized
```

#### Expected in Proxy Worker Terminal

```
[Arlo Proxy] 🔄 Wildcard proxy request
[Arlo Proxy] Encoded URL: https%3A%2F%2Farlostreaming...
[Arlo Proxy] Decoded URL: https://arlostreaming20659-z2-prod.wowza.arlo.com:80/stream/...mpd
[Arlo Proxy] ✅ Validated: arlostreaming20659-z2-prod.wowza.arlo.com/stream/...mpd
[Arlo Proxy] Proxying DASH manifest (.mpd)
[Arlo Proxy] Response: 200 OK
```

### Step 2: Check Network Tab

Open DevTools → Network tab → Filter by "proxy"

**Look for**:

1. Request to `localhost:8787/proxy/https%3A%2F%2Farlostreaming...mpd`
2. Status should be **200 OK**
3. Response should be XML (MPEG-DASH manifest)
4. Subsequent requests to `localhost:8787/proxy/https%3A%2F%2Farlostreaming...m4s` (video segments)

**Red flags**:

- ❌ No requests to localhost:8787 at all → Player not initializing
- ❌ 403 Forbidden → Proxy security validation failing
- ❌ 404 Not Found → Proxy URL encoding issue
- ❌ 500 Server Error → Proxy worker crashed
- ❌ Request stays "Pending" forever → CORS or network issue

### Step 3: Check Proxy Worker

In the terminal running `npx wrangler dev`, you should see:

```
⎔ Starting local server...
[wrangler:info] Ready on http://127.0.0.1:8787

[Arlo Proxy] 🔄 Wildcard proxy request
[Arlo Proxy] Proxying DASH manifest (.mpd)
[Arlo Proxy] Response: 200 OK
```

**If you see**:

- Nothing → Proxy not receiving requests (check port 8787)
- "Security: Rejected" → Domain validation failing
- "Response: 403" or "Response: 404" → Arlo server rejecting request

### Step 4: Verify Proxy Port

The proxy **must** be on port **8787** (not 8788):

```powershell
# Check if wrangler is running
Get-Process | Select-String wrangler

# Check what's on port 8787
netstat -ano | findstr :8787

# If nothing, restart proxy
cd workers/arlo-proxy
npx wrangler dev
```

### Step 5: Manual Proxy Test

Copy the stream URL from console and test manually:

```powershell
# Get the .mpd URL from console (after clicking "Start Live Stream")
# Example: https://arlostreaming20659-z2-prod.wowza.arlo.com:80/stream/AAE3177HA0A49_1760480974747.mpd?egressToken=...

# Test with script
node scripts/test-dash-proxy.js "YOUR_MPD_URL_HERE"
```

This will show:

- ✅ If proxy can fetch the manifest
- ✅ If manifest is valid XML
- ✅ Response time and size
- ❌ Any errors from proxy or Arlo server

### Step 6: Check Video Element

In browser console, check if video element exists:

```javascript
// In browser DevTools console
const video = document.querySelector('video')
console.log('Video element:', video)
console.log('Video src:', video?.src)
console.log('Video readyState:', video?.readyState)
console.log('Video networkState:', video?.networkState)
console.log('Video error:', video?.error)
```

**Expected**:

- `readyState`: 0 (HAVE_NOTHING) initially, then 1+ when loading
- `networkState`: 2 (NETWORK_LOADING) or 3 (NETWORK_IDLE)
- `error`: null (no errors)

**Red flags**:

- `src` is empty → dashjs not setting source
- `error` is not null → Media error occurred
- `readyState` stuck at 0 → Not loading at all

## Common Issues & Solutions

### Issue 1: No Console Logs at All

**Problem**: No UniversalVideoPlayer logs appear

**Solution**:

```typescript
// Check if UniversalVideoPlayer is rendering
// Look for this in CameraDetailsModal around line 293:
isStreaming && streamUrl ? (
  <UniversalVideoPlayer ... />
) : (
  ...
)

// Verify isStreaming is true and streamUrl has value
console.log('isStreaming:', isStreaming)
console.log('streamUrl:', streamUrl)
```

### Issue 2: Props Not Received

**Problem**: UniversalVideoPlayer shows `hasStreamUrl: false`

**Solution**: streamUrl state not being set in CameraDetailsModal

- Check `setStreamUrl(streamUrl)` is called (line ~145)
- Check `const [streamUrl, setStreamUrl] = useState<string | null>(null)` exists

### Issue 3: Proxy Not Receiving Requests

**Problem**: No logs in proxy worker terminal

**Solution**:

1. Proxy not running → Start with `cd workers/arlo-proxy && npx wrangler dev`
2. Wrong port → Frontend expecting 8787, check `getProxiedUrl()` function
3. URL encoding issue → Check proxied URL format in console

### Issue 4: DASH Player Not Initializing

**Problem**: Logs show "Initializing DASH player..." but nothing after

**Solution**:

```typescript
// Check if dashjs is loaded
console.log('dashjs:', typeof dashjs)
console.log('dashjs.MediaPlayer:', typeof dashjs.MediaPlayer)

// Check if video element exists
const video = videoRef.current
console.log('Video ref:', video)
```

### Issue 5: Manifest Loads But No Video

**Problem**: Manifest loads (200 OK) but video stays black

**Possible causes**:

1. Manifest has no playable video tracks
2. Video codec not supported by browser
3. Segments failing to load (check Network tab for .m4s files)
4. DASH settings incompatible with stream

**Debug**:

```javascript
// In UniversalVideoPlayer, after STREAM_INITIALIZED event
const videoTracks = player.getTracksFor('video')
const audioTracks = player.getTracksFor('audio')
console.log('Video tracks:', videoTracks)
console.log('Audio tracks:', audioTracks)
console.log('Current quality:', player.getQualityFor('video'))
```

## Quick Checklist

Copy/paste this into your response:

```
Video Loading Debug Checklist:

Console Logs:
[ ] CameraDetailsModal shows "✅ Stream URL received"
[ ] UniversalVideoPlayer shows "Props received" with hasStreamUrl: true
[ ] UniversalVideoPlayer shows "Detected DASH stream"
[ ] UniversalVideoPlayer shows "Proxied manifest URL: http://localhost:8787/..."
[ ] Proxy worker terminal shows "Proxying DASH manifest (.mpd)"
[ ] Proxy worker terminal shows "Response: 200 OK"

Network Tab:
[ ] Request to localhost:8787/proxy/... exists
[ ] Request status is 200 OK
[ ] Response type is application/dash+xml or text/xml
[ ] Response body contains XML with <MPD> tag
[ ] Subsequent .m4s segment requests exist

Proxy:
[ ] Wrangler is running (check terminal)
[ ] Port 8787 is shown in terminal output
[ ] No security rejection logs

Video Element:
[ ] Video element exists in DOM
[ ] Video element has class "w-full h-full"
[ ] Video element is visible (not display:none)

If all checked and still not working:
[ ] Run: node scripts/test-dash-proxy.js "<mpd-url>"
[ ] Share: Full console output
[ ] Share: Network tab screenshot
[ ] Share: Proxy worker terminal output
```

## Next Steps

1. **Refresh browser** (Ctrl+Shift+R)
2. **Open DevTools** (F12)
3. **Go to Console tab**
4. **Click "Start Live Stream"**
5. **Copy ALL console output**
6. **Go to Network tab**
7. **Filter by "proxy"**
8. **Screenshot the requests**
9. **Check proxy worker terminal**
10. **Share findings**

---

This will help us identify exactly where in the pipeline the video loading is failing!
