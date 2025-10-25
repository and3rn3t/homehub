# Arlo Reverse Engineering - Troubleshooting Guide

## Common Issues & Solutions

### ❌ Error: Failed to parse URL from cURL command

**Problem**: Parser can't find the URL in your captured cURL command.

**Common Causes:**

1. **Copied PowerShell version instead of bash**
   - Chrome offers "Copy as cURL (bash)" and "Copy as cURL (cmd)" and "Copy as PowerShell"
   - ✅ Use: **Copy as cURL (bash)**
   - ❌ Don't use: PowerShell or cmd versions

2. **Captured CORS preflight request (OPTIONS)**
   - Browser sends OPTIONS request before actual API call
   - OPTIONS requests don't have auth headers
   - ✅ Look for: POST or GET request to `/hmsweb/users/devices`
   - ❌ Don't use: OPTIONS request to `/notify/` endpoint

3. **File is empty or truncated**
   - Check file size (should be 1-5 KB, not 0 bytes)
   - Make sure you pasted the entire command

**Solution:**

```bash
# In Chrome DevTools Network tab:
1. Filter by "Fetch/XHR" (not "All")
2. Look for GET request to: myapi.arlo.com/hmsweb/users/devices
3. Right-click → Copy → Copy as cURL (bash)  ← IMPORTANT!
4. Paste entire command into scripts/arlo-captured-request.txt
5. Verify file starts with: curl 'https://myapi.arlo.com/...
6. Run: node scripts/parse-curl-to-json.js
```

**Example of correct request:**

- ✅ Method: GET or POST
- ✅ URL: `/hmsweb/users/devices` or `/hmsweb/users/profile`
- ✅ Has header: `authorization: Bearer ...`

**Example of wrong request (don't use these):**

- ❌ Method: OPTIONS (CORS preflight)
- ❌ URL: `/notify/` (notification endpoint)
- ❌ No authorization header

---

### ❌ Error: Cannot find package 'node-fetch'

**Problem**: Generated scripts try to import `node-fetch` but it's not installed.

**Solution**: Node.js v18+ has native fetch built-in. Update your Node.js:

```powershell
# Check current version
node --version

# If less than v18, download from:
# https://nodejs.org/ (download LTS version)
```

**Why it happens**: The scripts were updated to use native fetch (no dependencies needed). If you see this error, you either:

1. Have an old version of the scripts (re-run `parse-curl-to-json.js`)
2. Have Node.js v17 or lower (upgrade Node.js)

**Quick Fix**:

```powershell
# Re-generate the test script
node scripts/parse-curl-to-json.js

# Or manually edit scripts/test-arlo-exact-request.js
# Remove: import fetch from 'node-fetch';
# (Native fetch is globally available in Node v18+)
```

---

### ❌ Error: Captured request file not found

**Problem**: Script can't find `scripts/arlo-captured-request.txt`

**Solution**:

1. Create the file: `scripts/arlo-captured-request.txt`
2. Follow Phase 2 instructions to capture cURL command
3. Paste the command into the file
4. Save and re-run the script

---

### ❌ Status 401 Unauthorized

**Problem**: Captured token has expired (Arlo tokens typically last 1 hour)

**Solution**:

1. Capture a fresh request from Chrome (repeat Phase 2)
2. Make sure you're still logged into my.arlo.com
3. Test immediately after capturing

**Pro Tip**: Capture and test within 5 minutes to avoid expiration.

---

### ❌ Status 403 Forbidden

**Problem**: Cloudflare or additional verification required

**Solution**:

1. Verify you captured from a logged-in browser
2. Check if all headers were captured (especially cookies)
3. Continue to Phase 4 (bundle analysis) to find interceptor logic

---

### ❌ Can't find Authorization header in bundle

**Problem**: Minified JavaScript is hard to read

**Solution**:

1. In DevTools Sources tab, click the `{}` button (Pretty-print)
2. Search for multiple terms:
   - `"Authorization"`
   - `"Bearer "`
   - `.interceptors`
   - `axios.interceptors`
   - `headers.Authorization`
   - `config.headers`

**Pro Tip**: Search one term at a time, inspect each result.

---

### ❌ Found auth code but can't find secret key

**Problem**: Secret key might be obfuscated or dynamically generated

**Solution**:

**Option 1 - Breakpoint Method**:

1. Set breakpoint on `headers['Authorization'] = ...` line
2. Reload page
3. Step backward through call stack
4. Look for the function that generates the token
5. Find where secret key is defined

**Option 2 - Common Patterns**:
Try these in order:

```javascript
// Pattern 1: User ID as secret
const secret = localStorage.getItem('userId') || 'user@email.com'

// Pattern 2: Device ID as secret
const secret = crypto.randomUUID() // Generate once, store in config

// Pattern 3: Timestamp-based
const secret = Math.floor(Date.now() / 1000).toString()

// Pattern 4: Environment variable
const secret = process.env.ARLO_SECRET || 'hardcoded_fallback'
```

---

### ❌ Token generation works but refresh fails

**Problem**: Token expires after 1 hour, no refresh mechanism

**Solution**:

**Option 1 - Re-login**:

```typescript
async refreshToken() {
  // Re-execute full login flow
  return await this.login(email, password);
}
```

**Option 2 - Monitor expiration**:

```typescript
if (this.tokenExpireTime < Date.now()) {
  await this.refreshToken()
}
```

**Option 3 - Periodic refresh**:

```typescript
setInterval(
  () => {
    this.refreshToken()
  },
  50 * 60 * 1000
) // Refresh every 50 minutes
```

---

### ❌ PowerShell script won't run

**Problem**: Execution policy blocks scripts

**Solution**:

```powershell
# Check current policy
Get-ExecutionPolicy

# If "Restricted", run:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or run with bypass:
pwsh -ExecutionPolicy Bypass scripts/arlo-reverse-engineer.ps1
```

---

### ❌ Node.js version too old

**Problem**: Node v17 or lower doesn't have native fetch

**Solution**:

1. Download Node.js v20 LTS from https://nodejs.org/
2. Install and restart terminal
3. Verify: `node --version` (should be v20+)

**Alternative** (if you can't upgrade):

```bash
npm install node-fetch
```

Then manually edit scripts to keep `import fetch from 'node-fetch';`

---

### ⚠️ Script hangs during bundle analysis

**Problem**: Large JavaScript files take time to load

**Solution**:

- Be patient! Large bundles (5-10MB) can take 30-60 seconds
- If it hangs >2 minutes, press Ctrl+C and re-run
- Try in Chrome Incognito mode (fewer extensions = faster)

---

### ⚠️ Generated code has syntax errors

**Problem**: cURL command has special characters that break parsing

**Solution**:

1. Check `scripts/arlo-captured-request.txt` for complete cURL
2. Ensure entire command is on one line (or proper line continuations)
3. Look for unescaped quotes or special characters
4. Manually fix in `scripts/test-arlo-exact-request.js`

---

## Verification Checklist

Before reporting an issue, verify:

- [ ] Node.js v18+ installed (`node --version`)
- [ ] `scripts/arlo-captured-request.txt` exists and contains cURL
- [ ] Logged into my.arlo.com in browser
- [ ] Captured request is fresh (<5 minutes old)
- [ ] All scripts exist in `scripts/` directory
- [ ] Running from project root (not inside `scripts/` folder)

---

## Getting Help

### Check Documentation First

1. **Quick Start**: `scripts/START_HERE.md`
2. **Complete Guide**: `scripts/arlo-intercept-network.md`
3. **Quick Reference**: `scripts/ARLO_INTERCEPTOR_QUICKREF.md`
4. **This File**: `scripts/TROUBLESHOOTING.md`

### Debug Mode

Add verbose logging:

```javascript
// In test scripts, add before fetch:
console.log('Full request:', { url, method, headers, body })
```

### Manual Testing

If automated scripts fail, test manually:

```javascript
// In browser console on my.arlo.com:
fetch('https://myapi.arlo.com/hmsweb/users/devices', {
  method: 'GET',
  headers: {
    Authorization: 'Bearer YOUR_TOKEN_HERE',
  },
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

If this works but Node.js doesn't, compare headers exactly.

---

## Success Indicators

You know it's working when:

✅ `node scripts/test-arlo-exact-request.js` returns:

```
Status: 200 OK
Response: {
  "data": [
    { "deviceId": "...", "deviceName": "..." }
  ]
}
```

✅ Device list matches your Arlo cameras

✅ Subsequent requests also return 200

---

## Fallback Option

If reverse engineering proves too difficult:

**Use mock cameras** (already production-ready):

- File: `src/constants/mock-arlo-cameras.ts`
- 5 realistic cameras with all properties
- Ready for SecurityCameras UI development
- Can swap with real adapter later

This is a valid outcome! Mock data allows continued development.

---

**Last Updated**: October 13, 2025
**Node.js Requirement**: v18+ (native fetch)
**Status**: Production ready
