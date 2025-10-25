# Arlo HTTP Interceptor Reverse Engineering Guide

## Objective

Capture and replicate the exact HTTP authentication mechanism used by Arlo's web application to enable real API integration.

## Phase 1: Capture Working Request (5 minutes)

### Step 1: Login to Arlo Web App

1. Open Chrome and navigate to https://my.arlo.com/
2. Login with your credentials
3. Wait for dashboard to fully load

### Step 2: Open Network Tab

1. Press `F12` to open DevTools
2. Click **Network** tab
3. Check **Preserve log** checkbox
4. Clear existing requests (trash icon)

### Step 3: Trigger API Request

1. Navigate to **Devices** or click on a camera
2. Look for XHR requests to `myapi.arlo.com`
3. Find a request like: `GET https://myapi.arlo.com/hmsweb/users/devices`

### Step 4: Copy Request as cURL

1. Right-click the request → **Copy** → **Copy as cURL (bash)**
2. Save to a file: `scripts/arlo-captured-request.txt`

Example captured request:

```bash
curl 'https://myapi.arlo.com/hmsweb/users/devices' \
  -H 'Authorization: Bearer XXXXX...' \
  -H 'User-Agent: Mozilla/5.0...' \
  -H 'Content-Type: application/json' \
  -H 'Auth-Version: 2' \
  ...
```

### Step 5: Export All Headers

1. Click the same request in Network tab
2. Go to **Headers** subtab
3. Scroll to **Request Headers** section
4. Copy ALL headers (including hidden ones)
5. Save to: `data/arlo-request-headers.json`

## Phase 2: Analyze Authorization Header (10 minutes)

### Key Headers to Study

```json
{
  "Authorization": "Bearer eyJ...", // JWT token format?
  "Auth-Version": "2",
  "schemaVersion": "1",
  "source": "arloCamWeb",
  "User-Agent": "...",
  "X-User-Device-Id": "...", // Device fingerprint?
  "X-User-Device-Type": "..."
}
```

### Analysis Checklist

- [ ] Authorization format: `Bearer <token>` or custom?
- [ ] Token structure: JWT (eyJ...) or opaque string?
- [ ] Token length: Count characters
- [ ] Special headers: X-User-Device-Id, Auth-Version, etc.
- [ ] Cookie involvement: Any cookies sent with request?

### JWT Token Decoding (if applicable)

If token starts with `eyJ`, it's JWT. Decode at https://jwt.io:

```bash
# Or decode locally
node -e "console.log(JSON.parse(Buffer.from('eyJ...', 'base64')))"
```

Look for:

- `iss` (issuer): Arlo domain
- `exp` (expiration): Token lifetime
- `sub` (subject): User ID
- `aud` (audience): API endpoint

## Phase 3: Find Token Generation Code (30 minutes)

### Step 1: Search JavaScript Bundles

1. In DevTools, go to **Sources** tab
2. Expand `my.arlo.com` → `js/` folder
3. Look for minified bundles: `main.xxx.js`, `vendor.xxx.js`, `app.xxx.js`
4. Press `Ctrl+Shift+F` to search across all files

### Step 2: Search for Key Strings

Search for these patterns:

```javascript
// Authorization header generation
'Authorization'
'Bearer '
'Auth-Version'

// Token storage/retrieval
'getToken'
'setToken'
'authToken'
'accessToken'

// HTTP interceptor patterns
'interceptor'
'beforeRequest'
'request.use'
'axios.interceptors'
'http.interceptors'

// Arlo-specific
'myapi.arlo.com'
'hmsweb/users'
```

### Step 3: Locate Interceptor Code

Look for Angular/React patterns:

**Angular:**

```typescript
.interceptors.request.use((config) => {
  config.headers['Authorization'] = 'Bearer ' + getToken();
  return config;
});
```

**React/Axios:**

```javascript
axios.interceptors.request.use(function (config) {
  config.headers.Authorization = 'Bearer ' + localStorage.getItem('token')
  return config
})
```

### Step 4: Pretty-Print for Analysis

1. Find the relevant bundle (e.g., `main.js`)
2. Click the `{}` button in bottom-left (Pretty-print)
3. Set breakpoints near token generation
4. Reload page and step through code

## Phase 4: Extract Token Generation Logic (1-2 hours)

### Method 1: Breakpoint Debugging

1. Set breakpoint on Authorization header assignment
2. Reload page (or trigger API call)
3. Inspect call stack when breakpoint hits
4. Trace back to token source

### Method 2: Search for Crypto Operations

Look for:

```javascript
// HMAC signature generation
CryptoJS.HmacSHA256(...)
crypto.subtle.sign(...)

// JWT signing
jwt.sign(payload, secret)

// Base64 encoding
btoa(...)
Buffer.from(...).toString('base64')
```

### Method 3: Console Override

Intercept the interceptor:

```javascript
// In browser console
const originalFetch = window.fetch
window.fetch = function (...args) {
  console.log('Fetch request:', args)
  return originalFetch.apply(this, args)
}

// For Axios
const originalRequest = axios.interceptors.request.handlers[0].fulfilled
axios.interceptors.request.handlers[0].fulfilled = function (config) {
  console.log('Axios config:', config)
  return originalRequest(config)
}
```

## Phase 5: Replicate in Node.js (2-3 hours)

### Example: JWT Token Generation

If Arlo uses JWT with HMAC-SHA256:

```typescript
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

interface ArloTokenPayload {
  userId: string
  deviceId: string
  iat: number // Issued at
  exp: number // Expiration
}

function generateArloToken(userId: string, secret: string): string {
  const payload: ArloTokenPayload = {
    userId,
    deviceId: crypto.randomUUID(),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  }

  return jwt.sign(payload, secret, { algorithm: 'HS256' })
}

// Use in API requests
const token = generateArloToken('user@email.com', 'EXTRACTED_SECRET')
const headers = {
  Authorization: `Bearer ${token}`,
  'Auth-Version': '2',
  'Content-Type': 'application/json',
}
```

### Example: Custom Signature

If Arlo uses custom HMAC:

```typescript
import crypto from 'crypto'

function generateArloSignature(
  method: string,
  path: string,
  timestamp: number,
  secret: string
): string {
  const message = `${method}|${path}|${timestamp}`
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(message)
  return hmac.digest('base64')
}

// Use in API requests
const timestamp = Date.now()
const signature = generateArloSignature('GET', '/hmsweb/users/devices', timestamp, 'SECRET')
const headers = {
  Authorization: `Arlo ${signature}`,
  'X-Timestamp': timestamp.toString(),
  'Auth-Version': '2',
}
```

## Phase 6: Test and Validate (30 minutes)

### Test Script Template

```javascript
// scripts/test-arlo-interceptor.js
import fetch from 'node-fetch'

async function testArloAPI() {
  const token = generateToken() // Your implementation

  const response = await fetch('https://myapi.arlo.com/hmsweb/users/devices', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Auth-Version': '2',
      'Content-Type': 'application/json',
      'User-Agent': 'ArloHomeHub/1.0',
    },
  })

  console.log('Status:', response.status)
  console.log('Headers:', response.headers)
  const data = await response.json()
  console.log('Data:', JSON.stringify(data, null, 2))
}

testArloAPI().catch(console.error)
```

### Success Indicators

- ✅ Status 200 (not 401/403)
- ✅ Response contains device list
- ✅ Devices match your Arlo account
- ✅ Token works across multiple requests
- ✅ Token refresh mechanism working

## Common Patterns

### Pattern 1: localStorage Token

```javascript
// Browser stores token
localStorage.setItem('arlo_token', 'eyJ...')

// Interceptor reads it
const token = localStorage.getItem('arlo_token')
headers['Authorization'] = `Bearer ${token}`
```

**Node.js Replication:**

- Extract token from browser localStorage (already done!)
- Use directly in requests
- Implement refresh when expired

### Pattern 2: Device Fingerprinting

```javascript
// Browser generates device ID
const deviceId = generateDeviceFingerprint()
headers['X-User-Device-Id'] = deviceId
```

**Node.js Replication:**

- Generate consistent device ID (UUID)
- Store in config
- Send with every request

### Pattern 3: Dynamic Signature

```javascript
// Browser signs each request
const signature = sign(method + url + timestamp + body)
headers['X-Signature'] = signature
```

**Node.js Replication:**

- Find signing algorithm (HMAC-SHA256 common)
- Extract secret key from bundle
- Replicate signing logic

## Troubleshooting

### Issue: Token Extracted but Still 401

**Diagnosis:** Token might be tied to browser session
**Solution:** Look for additional headers (X-User-Device-Id, User-Agent)

### Issue: Token Works Once Then Fails

**Diagnosis:** Token refresh mechanism
**Solution:** Capture refresh request, implement refresh logic

### Issue: Can't Find Token Generation

**Diagnosis:** Obfuscated/encrypted code
**Solution:** Use breakpoints to trace execution at runtime

### Issue: Token Changes Every Request

**Diagnosis:** Request-specific signature
**Solution:** Find signing function, replicate signature algorithm

## Next Steps

1. **Capture Request** → Save to `arlo-captured-request.txt`
2. **Analyze Headers** → Document in `arlo-request-headers.json`
3. **Find Interceptor** → Search bundles, set breakpoints
4. **Extract Logic** → Document in `arlo-token-generation.md`
5. **Implement in Node.js** → Update `ArloAdapter.ts`
6. **Test** → Run `test-arlo-interceptor.js`
7. **Integrate** → Connect to real cameras!

## Resources

- **JWT Decoder:** https://jwt.io
- **Arlo API Docs (archived):** https://web.archive.org/web/*/developer.arlo.com
- **Chrome DevTools:** https://developer.chrome.com/docs/devtools/
- **Axios Interceptors:** https://axios-http.com/docs/interceptors
- **Node Crypto:** https://nodejs.org/api/crypto.html

## Time Estimate

- Capture request: 5 minutes
- Analyze headers: 10 minutes
- Find interceptor: 30 minutes
- Extract logic: 1-2 hours
- Replicate in Node.js: 2-3 hours
- Test and validate: 30 minutes

**Total: 4-6 hours** (realistic, with breaks and debugging)

---

**Status:** Ready to start Phase 1 - Request Capture
**Last Updated:** October 13, 2025
