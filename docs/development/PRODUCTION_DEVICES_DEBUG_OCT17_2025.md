# Production Devices Not Showing - Troubleshooting Guide

**Date**: October 17, 2025
**Issue**: Devices still not showing correctly in production
**Previous Fixes**: Device migration implemented (Oct 15, commit ca4d9ef)

---

## 🔍 Quick Diagnosis Steps

### Step 1: Open Production Site in Browser Console

1. Go to https://homehub.andernet.dev
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for migration logs:
   - `[Migration] Devices OK: XX devices found` ✅ Good
   - `[Migration] Devices array is empty, restoring from MOCK_DEVICES` ⚠️ Running migration
   - `[Migration] No devices found, initializing with MOCK_DEVICES` ⚠️ First time init
   - Any errors? ❌ Problem

### Step 2: Check localStorage

In browser console, run:

```javascript
// Check if devices exist
localStorage.getItem('kv:devices')

// Parse and count devices
JSON.parse(localStorage.getItem('kv:devices')).length
// Should return: 27
```

### Step 3: Use Debug Tool

1. Open: `c:\git\homehub\debug-tools\production-device-debug.html`
2. Drag to browser OR serve from localhost
3. Click "Run Full Diagnostics"
4. Check the results

---

## 🐛 Common Issues & Fixes

### Issue 1: Migration Not Running

**Symptoms**:

- No migration logs in console
- `kv:devices` is empty array `[]`
- Page loads but no devices

**Possible Causes**:

- Old cached JS files (migration code not loaded)
- Build didn't include migration
- Console errors blocking execution

**Fix**:

```javascript
// Manual fix in production console:
localStorage.setItem('kv:devices', localStorage.getItem('kv:devices') || '[]')
location.reload()
```

**Better Fix**:

1. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Try incognito/private window

---

### Issue 2: Cached Build

**Symptoms**:

- Migration code not running
- Old version of app loading
- Features missing that should be there

**Fix**:

1. **Cloudflare Cache Purge**:
   - Go to Cloudflare Pages dashboard
   - Find deployment
   - Click "Manage deployment" → "Purge cache"

2. **Force Browser Cache Clear**:
   - Chrome: Ctrl+Shift+Delete → Clear cached images and files
   - Firefox: Ctrl+Shift+Delete → Cached Web Content
   - Safari: Cmd+Option+E

3. **Check deployment time**:

   ```bash
   # In your local repo
   git log --oneline -1
   ```

   - Compare commit hash with Cloudflare deployment

---

### Issue 3: localStorage Corrupted

**Symptoms**:

- Devices showing as `null` or `undefined`
- Parse errors in console
- Random devices missing

**Fix**:

Option A - Manual Clear (Production Console):

```javascript
// Clear all HomeHub storage
Object.keys(localStorage)
  .filter(key => key.startsWith('kv:'))
  .forEach(key => localStorage.removeItem(key))

// Reload to trigger migration
location.reload()
```

Option B - Use Debug Tool:

1. Open `production-device-debug.html`
2. Click "Clear All Storage"
3. Reload production site

---

### Issue 4: MOCK_DEVICES Not Defined

**Symptoms**:

- Console error: `MOCK_DEVICES is not defined`
- Migration runs but fails
- Devices count = 0 after migration

**Diagnosis**:

```javascript
// In production console
import { MOCK_DEVICES } from '@/constants'
console.log(MOCK_DEVICES.length)
```

**Fix**:

- Check build output for dead code elimination
- Verify `src/constants/index.ts` exports MOCK_DEVICES
- Check tree-shaking settings in vite.config.ts

---

### Issue 5: Multiple Tabs Open

**Symptoms**:

- Devices appear/disappear randomly
- Storage conflicts
- Race conditions

**Fix**:

- Close ALL tabs with homehub.andernet.dev
- Open only ONE tab
- Clear storage if needed
- Reload

---

## 🔧 Manual Migration (Emergency)

If all else fails, run this in production console:

```javascript
// Full manual migration with real mock data
const MOCK_DEVICES = [
  {
    id: 'hue-light-1',
    name: 'Living Room Ceiling',
    type: 'light',
    room: 'living-room',
    status: 'online',
    enabled: true,
    brightness: 100,
    protocol: 'hue',
  },
  {
    id: 'hue-light-2',
    name: 'Living Room Corner Lamp',
    type: 'light',
    room: 'living-room',
    status: 'online',
    enabled: false,
    brightness: 75,
    protocol: 'hue',
  },
  // Add all 27 devices here (copy from src/constants/mock-data.ts)
]

// Save to localStorage
localStorage.setItem('kv:devices', JSON.stringify(MOCK_DEVICES))
localStorage.setItem('migration-log', new Date().toISOString())

// Verify
console.log('Devices stored:', JSON.parse(localStorage.getItem('kv:devices')).length)

// Reload
location.reload()
```

---

## 📊 Expected Console Output (Healthy)

When production is working correctly, you should see:

```console
[Migration] Devices OK: 27 devices found
[useKV] Reading from cache: devices
[useKV] Devices loaded: 27 items
[Dashboard] Rendering 27 devices
[Rooms] Loaded 7 rooms with devices
```

---

## 🚨 Red Flags

Watch for these errors:

❌ `Uncaught ReferenceError: MOCK_DEVICES is not defined`
→ Build issue, migration can't run

❌ `localStorage.getItem is not a function`
→ Privacy mode or localStorage disabled

❌ `JSON.parse: unexpected character at line 1`
→ Corrupted storage data

❌ `Failed to fetch`
→ Network issue, KV worker down

❌ `[Migration] Device storage migration failed`
→ Migration crashed, check error details

---

## 🎯 Production Deployment Checklist

Before deploying fixes:

- [ ] Local build succeeds (`npm run build`)
- [ ] Migration code in `src/main.tsx`
- [ ] `MOCK_DEVICES` imported in `migrate-devices.ts`
- [ ] Commit and push to main
- [ ] Wait for Cloudflare Pages deployment
- [ ] Purge Cloudflare cache
- [ ] Test in incognito window
- [ ] Check console for migration logs
- [ ] Verify device count in localStorage
- [ ] Test on mobile device

---

## 📞 Next Steps

1. **Run Debug Tool** (`production-device-debug.html`)
2. **Check Console** in production site
3. **Export Data** if devices are there but not showing
4. **Report Back** with:
   - Console logs (especially migration logs)
   - Device count from localStorage
   - Any error messages
   - Screenshot of debug tool output

---

## 🔗 Related Documentation

- `docs/development/DEVICE_MIGRATION_FIX_OCT15_2025.md` - Original fix
- `docs/development/DEVICES_NOT_SHOWING_FIX_OCT15_2025.md` - Previous issue
- `src/lib/migrate-devices.ts` - Migration code
- `src/constants/mock-data.ts` - Device definitions
