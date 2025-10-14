# Quick Test Guide - Live Camera Streaming

## What Changed

✅ **Installed DASH.js** - Added support for MPEG-DASH video format  
✅ **Created UniversalVideoPlayer** - New component supporting both HLS and MPEG-DASH  
✅ **Updated CameraDetailsModal** - Now uses universal player instead of HLS-only player  

## Why the Change?

Your Arlo cameras return **MPEG-DASH streams** (`.mpd` files), not HLS streams (`.m3u8`).

**Stream URL Example**:
```
https://arlostreaming21203-z2-prod.wowza.arlo.com:80/stream/AAE3177HA0A49_1760407235485.mpd
```

The old `HLSVideoPlayer` couldn't handle `.mpd` files. The new `UniversalVideoPlayer` automatically detects the format and uses the right library (DASH.js or HLS.js).

## How to Test

1. **Refresh your browser** (F5 or Ctrl+R)
2. **Open Security tab** → Click any camera card
3. **Click "Start Live Stream"** button
4. **Watch for**:
   - Loading spinner (~2-3 seconds)
   - Video playback starts automatically
   - Control bar appears at bottom

## Expected Results

✅ **Video should play** within 3-5 seconds  
✅ **Stream type badge** shows "DASH" in bottom right  
✅ **Controls work**: Play/Pause, Mute/Unmute, Fullscreen  
✅ **Auto-muted** on start (for browser autoplay policies)  

## Console Output to Look For

```
[ArloAdapter] Starting stream for Front Yard...
[ArloAdapter] ✅ Stream started: https://arlostreaming21203...
[UniversalVideoPlayer] Initializing DASH player for Front Yard
[UniversalVideoPlayer] Using DASH.js
[UniversalVideoPlayer] DASH stream initialized
[UniversalVideoPlayer] DASH playback started
```

## If Something Goes Wrong

### Video Doesn't Load
- Check console for errors
- Try "Stop Stream" → "Start Live Stream" again
- Verify proxy worker is running: http://localhost:8788 should respond

### 403 Error Returns
- May be temporary rate limit
- Wait 1-2 minutes and try again
- Try a different camera

### Black Screen
- Click the Play button (autoplay may have failed)
- Check if video is paused (pause icon = video is playing)
- Try unmuting (volume icon)

## Test All Features

- [ ] Start stream on Front Yard camera
- [ ] Test play/pause button
- [ ] Test mute/unmute button  
- [ ] Test fullscreen mode (press F11 to exit)
- [ ] Stop stream
- [ ] Try a different camera (Back Yard, Doorbell, etc.)
- [ ] Test with camera offline (unplug one to simulate)

## Controls Guide

**Bottom Left**:
- ⏯️ Play/Pause - Toggle video playback
- 🔇/🔊 Mute/Unmute - Toggle audio (starts muted)

**Bottom Right**:
- **DASH/HLS badge** - Shows stream type
- ⛶ Fullscreen - Enter fullscreen mode

## Success Criteria

✅ Video plays smoothly  
✅ No buffering or stuttering  
✅ Controls respond immediately  
✅ Can switch between cameras  
✅ Stream stops cleanly when clicking "Stop Stream"  

## Next Steps After Testing

Once you confirm streaming works:
1. We'll mark Milestone 6.1.3 as complete ✅
2. Move to Milestone 6.1.4: Camera Controls
3. Implement Start Recording, Snapshot Download, PTZ controls, etc.

---

**Ready to test?** Refresh your browser and click "Start Live Stream"! 🎬
