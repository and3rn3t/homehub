# Arlo HTTP Interceptor - Quick Reference

## 🚀 Quick Start (5 minutes)

### Option 1: Automated (Recommended)

```powershell
pwsh scripts/arlo-reverse-engineer.ps1
```

Follow the interactive prompts through all 6 phases.

### Option 2: Manual

1. **Capture Request**: Chrome DevTools → Network → Copy as cURL → Save to `scripts/arlo-captured-request.txt`
2. **Parse**: `node scripts/parse-curl-to-json.js`
3. **Test**: `node scripts/test-arlo-exact-request.js`
4. **Analyze**: Open `scripts/arlo-analyze-bundle.js` in browser console
5. **Review**: `node scripts/test-arlo-interceptor.js`

## 📋 The Process

### Phase 1: Capture Working Request (5 min)

```
Chrome DevTools → Network Tab
1. Login to my.arlo.com
2. Click on camera (triggers API call)
3. Find: myapi.arlo.com/hmsweb/users/devices
4. Right-click → Copy as cURL (bash)
5. Save to: scripts/arlo-captured-request.txt
```

### Phase 2: Parse Headers (1 min)

```bash
node scripts/parse-curl-to-json.js
```

**Output**:

- `data/arlo-request-headers.json` - All headers in JSON
- `scripts/test-arlo-exact-request.js` - Ready-to-run test

### Phase 3: Test Replication (2 min)

```bash
node scripts/test-arlo-exact-request.js
```

**Results**:

- ✅ **200 OK**: Headers work! → Proceed to implementation
- ❌ **401 Unauthorized**: Token expired → Capture fresh request
- ❌ **403 Forbidden**: Cloudflare/bot detection → Need interceptor analysis

### Phase 4: Analyze Bundle (10 min)

```
Chrome DevTools → Console Tab
1. Copy entire script: scripts/arlo-analyze-bundle.js
2. Paste into console on my.arlo.com
3. Copy JSON output
4. Save to: data/arlo-bundle-analysis.json
```

### Phase 5: Find Token Generation (30-60 min)

```
Chrome DevTools → Sources Tab
1. Ctrl+Shift+F (search all files)
2. Search: "Authorization", "Bearer ", "interceptor"
3. Set breakpoint on Authorization header assignment
4. Reload page, trace execution
5. Find: crypto.createHmac() or jwt.sign()
6. Extract secret key (2nd parameter)
```

### Phase 6: Implement in Node.js (2-3 hours)

Update `src/services/devices/ArloAdapter.ts`:

```typescript
private generateAuthToken(): string {
  // Extracted from JavaScript bundle
  const payload = {
    userId: this.userId,
    deviceId: this.deviceId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };

  // Secret key from reverse engineering
  const secret = 'EXTRACTED_SECRET_KEY';

  return jwt.sign(payload, secret, { algorithm: 'HS256' });
}
```

## 🔍 Common Patterns

### Pattern 1: JWT Token (Most Common)

**Signs**: Token starts with `eyJ`, contains `.` separators
**Implementation**:

```typescript
import jwt from 'jsonwebtoken'

const token = jwt.sign(
  {
    userId: '...',
    exp: Math.floor(Date.now() / 1000) + 3600,
  },
  SECRET_KEY,
  { algorithm: 'HS256' }
)
```

### Pattern 2: HMAC Signature

**Signs**: `X-Signature` header, timestamp-based
**Implementation**:

```typescript
import crypto from 'crypto'

const message = `${method}|${path}|${timestamp}`
const hmac = crypto.createHmac('sha256', SECRET_KEY)
hmac.update(message)
const signature = hmac.digest('base64')
```

### Pattern 3: Device Fingerprint

**Signs**: `X-User-Device-Id` header
**Implementation**:

```typescript
const deviceId = crypto.randomUUID() // Generate once, store in config
headers['X-User-Device-Id'] = deviceId
```

## 📊 Success Indicators

### ✅ Working Request

```
Status: 200 OK
Content-Type: application/json
Body: { "data": [ /* devices */ ] }
```

### ❌ Common Failures

| Status | Error         | Cause                      | Solution              |
| ------ | ------------- | -------------------------- | --------------------- |
| 401    | Invalid Token | Token expired/wrong format | Capture fresh request |
| 403    | Forbidden     | Cloudflare/bot detection   | Analyze interceptor   |
| 404    | Not Found     | Wrong endpoint             | Check URL spelling    |
| 429    | Rate Limited  | Too many requests          | Add delays            |

## 🛠️ Tools & Scripts

| File                         | Purpose                  | Usage                                    |
| ---------------------------- | ------------------------ | ---------------------------------------- |
| `arlo-reverse-engineer.ps1`  | Master automation script | `pwsh scripts/arlo-reverse-engineer.ps1` |
| `parse-curl-to-json.js`      | Parse cURL → JSON        | `node scripts/parse-curl-to-json.js`     |
| `test-arlo-interceptor.js`   | Comprehensive analysis   | `node scripts/test-arlo-interceptor.js`  |
| `arlo-analyze-bundle.js`     | Browser console analyzer | Copy/paste in DevTools                   |
| `test-arlo-exact-request.js` | Test captured headers    | Auto-generated                           |

## 📝 Data Files

| File                                 | Contains         | Created By                |
| ------------------------------------ | ---------------- | ------------------------- |
| `scripts/arlo-captured-request.txt`  | Raw cURL command | Manual (copy from Chrome) |
| `data/arlo-request-headers.json`     | Parsed headers   | parse-curl-to-json.js     |
| `data/arlo-bundle-analysis.json`     | Bundle analysis  | arlo-analyze-bundle.js    |
| `scripts/test-arlo-exact-request.js` | Generated test   | parse-curl-to-json.js     |

## 🎯 Critical Headers to Extract

Must-have headers for authentication:

- ✅ `Authorization: Bearer <token>` - Main auth token
- ✅ `Auth-Version: 2` - API version
- ✅ `Content-Type: application/json` - Data format
- ⚠️ `X-User-Device-Id` - Device fingerprint (if present)
- ⚠️ `schemaVersion` - Schema version (if present)
- ⚠️ `source: arloCamWeb` - Client identifier (if present)

## 💡 Pro Tips

1. **Token Expiration**: Most tokens expire after 1 hour. Capture fresh request if test fails.
2. **Device ID**: Use consistent UUID across all requests. Generate once, store in config.
3. **User-Agent**: Match browser's User-Agent string exactly.
4. **Timing**: Some APIs check timestamp. Use `Date.now()` for dynamic values.
5. **Breakpoints**: Set breakpoints BEFORE network request, not after.
6. **Pretty-print**: Always click `{}` in DevTools to format minified code.
7. **Persistence**: If test works once then fails, token refresh mechanism exists.

## 🔄 Token Refresh

If token expires after 1 hour:

```typescript
async refreshToken(): Promise<string> {
  // Option 1: Re-login
  return await this.login(email, password);

  // Option 2: Refresh endpoint
  const response = await fetch('/auth/refresh', {
    headers: { 'Refresh-Token': this.refreshToken }
  });

  const data = await response.json();
  return data.accessToken;
}
```

## 📚 Resources

- **JWT Debugger**: https://jwt.io (decode tokens)
- **Chrome DevTools**: F12 → Network/Sources/Console
- **Node Crypto**: https://nodejs.org/api/crypto.html
- **Guide**: `scripts/arlo-intercept-network.md` (detailed walkthrough)

## ⏱️ Time Estimate

| Phase     | Task                 | Time          |
| --------- | -------------------- | ------------- |
| 1         | Capture request      | 5 min         |
| 2         | Parse & test         | 5 min         |
| 3         | Analyze bundle       | 30 min        |
| 4         | Find token logic     | 1-2 hours     |
| 5         | Implement in Node.js | 2-3 hours     |
| 6         | Test & debug         | 30 min        |
| **Total** |                      | **4-6 hours** |

## 🎉 Success Checklist

- [ ] Captured cURL command saved to `arlo-captured-request.txt`
- [ ] Parsed to JSON: `arlo-request-headers.json` exists
- [ ] Test script runs: `test-arlo-exact-request.js`
- [ ] Bundle analyzed: `arlo-bundle-analysis.json` exists
- [ ] Token format identified (JWT / HMAC / Custom)
- [ ] Secret key extracted from bundle
- [ ] Token generation implemented in ArloAdapter.ts
- [ ] Test passes with 200 OK status
- [ ] All 5 cameras accessible via API
- [ ] Token refresh mechanism working

---

**Status**: Ready to start reverse engineering
**Next**: Run `pwsh scripts/arlo-reverse-engineer.ps1`
**Last Updated**: October 13, 2025
