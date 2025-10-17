# Production Devices Debugging - October 17, 2025

## 🎯 Quick Start

Your devices aren't showing in production. Here's how to fix it **in 2 minutes**:

### Option 1: Browser Console Test (Fastest)

1. Open https://homehub.andernet.dev
2. Press **F12** (open DevTools)
3. Go to **Console** tab
4. Copy/paste this entire script:

```javascript
// Quick diagnostic
const stored = localStorage.getItem('kv:devices');
const devices = stored ? JSON.parse(stored) : [];
console.log(`Devices in storage: ${devices.length}`);

if (devices.length === 0) {
  console.log('🔴 Storage is empty - running fix...');
  localStorage.removeItem('kv:devices');
  location.reload();
} else {
  console.log('✅ Storage OK:', devices.slice(0, 3).map(d => d.name));
}
```

5. If it says "Storage is empty" → **It will auto-reload and fix itself**
6. If it says "Storage OK" → **Something else is wrong, keep reading**

---

### Option 2: Use Debug Tool (Most Comprehensive)

1. Open `c:\git\homehub\debug-tools\production-device-debug.html` in browser
2. Click **"Run Full Diagnostics"**
3. Check results:
   - **Device Count: 0** → Click "Force Migration"
   - **Device Count: 27** → Storage is fine, issue is elsewhere
4. Export data if needed for backup

---

### Option 3: Run Test Script (Detailed)

1. Open `c:\git\homehub\debug-tools\production-quick-test.js`
2. Copy entire contents
3. Paste in browser console on production site
4. Read the output - it will tell you exactly what's wrong

---

## 🔍 Common Scenarios

### Scenario A: "Device Count: 0"

**Cause**: Storage is empty (migration didn't run or failed)

**Fix**:

```javascript
// In production console
localStorage.removeItem('kv:devices')
location.reload()
// Migration will run automatically on reload
```

---

### Scenario B: "Device Count: 27 but still not showing"

**Cause**: React state issue or rendering problem

**Check**:

1. Open React DevTools
2. Find `Dashboard` component
3. Look at `kvDevices` state
4. Is it empty? → State not loading from KV
5. Has devices? → Rendering issue

**Fix**:

```javascript
// Hard refresh to clear React cache
location.reload(true)
```

---

### Scenario C: "Parse error" or "Invalid JSON"

**Cause**: Corrupted localStorage data

**Fix**:

```javascript
// Nuclear option - clear everything
localStorage.clear()
location.reload()
// Will reinitialize from scratch
```

---

### Scenario D: "Migration logs showing but still empty"

**Cause**: Cached build (old JS files without migration code)

**Fix**:

1. Go to Cloudflare Pages dashboard
2. Find latest deployment
3. Click "Purge cache"
4. Wait 30 seconds
5. Hard refresh browser (Ctrl+Shift+R)

---

## 📋 Debugging Checklist

Run through this checklist to diagnose:

- [ ] **Check localStorage**
  - Run: `localStorage.getItem('kv:devices')`
  - Should return: Long JSON string
  - If `null`: Storage is empty

- [ ] **Check device count**
  - Run: `JSON.parse(localStorage.getItem('kv:devices')).length`
  - Should return: `27`
  - If `0`: Run migration fix
  - If `undefined`: Storage key missing

- [ ] **Check migration logs**
  - Look in browser console
  - Should see: `[Migration] Devices OK: 27 devices found`
  - If nothing: Migration didn't run (cache issue)

- [ ] **Check React state**
  - Open React DevTools
  - Find Dashboard component
  - Check `kvDevices` prop
  - Should have 27 devices

- [ ] **Check network**
  - Open Network tab
  - Look for failed requests
  - Check KV worker is reachable

- [ ] **Check build version**
  - Run: `git log --oneline -1`
  - Compare with Cloudflare deployment
  - Should match: `bab094b`

---

## 🚨 Emergency Fixes

### Fix 1: Force Clear and Reload

```javascript
// Clear all HomeHub data
Object.keys(localStorage)
  .filter(key => key.startsWith('kv:'))
  .forEach(key => localStorage.removeItem(key));

// Reload
location.reload();
```

### Fix 2: Manual Device Import

If migration keeps failing, manually import devices:

1. Go to `c:\git\homehub\src\constants\mock-data.ts`
2. Copy the `MOCK_DEVICES` array
3. In production console:

```javascript
const MOCK_DEVICES = [ /* paste array here */ ];
localStorage.setItem('kv:devices', JSON.stringify(MOCK_DEVICES));
location.reload();
```

### Fix 3: Service Worker Reset

If service worker is serving old cached files:

```javascript
// Unregister service worker
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});

// Clear cache
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
});

// Reload
location.reload();
```

---

## 🔧 Files to Check

If still having issues, check these files in production build:

1. **main.tsx** - Does it call `migrateDeviceStorage()`?
2. **migrate-devices.ts** - Is it in the bundle?
3. **constants/index.ts** - Does it export `MOCK_DEVICES`?
4. **Dashboard.tsx** - Does it use `MOCK_DEVICES` as default?

To verify:

```bash
# Local check
npm run build
grep -r "migrateDeviceStorage" dist/
grep -r "MOCK_DEVICES" dist/

# Should find matches in compiled JS
```

---

## 📊 What to Report Back

If none of these fixes work, report:

1. **Console output** from `production-quick-test.js`
2. **Device count** from localStorage
3. **Migration logs** (if any)
4. **React DevTools state** (screenshot)
5. **Network errors** (screenshot)
6. **Build version** (`git log --oneline -1`)
7. **Browser** (Chrome/Firefox/Safari + version)

---

## 🎓 Understanding the Fix

The migration system works like this:

```
1. User visits site
2. main.tsx runs (before React)
3. migrateDeviceStorage() checks localStorage
4. If kv:devices is empty → restore from MOCK_DEVICES
5. If kv:devices has data → do nothing
6. React loads and reads from localStorage
```

If devices aren't showing, the break is at one of these steps:

- **Step 2**: Old cached JS (migration code not loaded)
- **Step 3**: Migration crashes (check console errors)
- **Step 4**: MOCK_DEVICES not in bundle (build issue)
- **Step 6**: React not reading from localStorage (state issue)

---

## 🔗 Related Tools

- `debug-tools/production-device-debug.html` - Full diagnostic UI
- `debug-tools/production-quick-test.js` - Console test script
- `docs/development/PRODUCTION_DEVICES_DEBUG_OCT17_2025.md` - Full guide

---

## ⏱️ Timeline of Fixes

- **Oct 15, 14:30**: Fixed Arlo CORS (proxy deployment)
- **Oct 15, 16:47**: Fixed empty devices (Dashboard using `[]`)
- **Oct 15, 17:44**: Added migration script
- **Oct 17**: Created debug tools (this session)

**Next**: Run diagnostics and report findings!
