# Arlo Integration - Authentication Challenge & Resolution

## Status: **🔄 ACTIVE - Reverse Engineering HTTP Interceptor**

**Date**: October 13, 2025
**Decision**: Reverse-engineer HTTP interceptor to enable real API integration
**Tools**: Complete reverse engineering toolkit created (see Quick Reference below)

---

## Challenge Summary

Arlo's cloud API uses sophisticated authentication that proved difficult to reverse-engineer:

### Attempted Approaches

#### ❌ Approach 1: @koush/arlo Direct Library (Failed)

- **Method**: Use community library with email/password login
- **Blocker**: Cloudflare 403 Forbidden on all requests
- **Root Cause**: Arlo detects bot/automation via Cloudflare challenge
- **Files**: `src/services/devices/ArloAdapter.ts` (initial implementation)

#### ❌ Approach 2: Puppeteer Browser Automation (Failed)

- **Method**: Headless Chrome to bypass Cloudflare, automate login
- **Blocker**: Arlo's anti-bot detection shows fake "no internet connection" error
- **Root Cause**: Bot detection beyond Cloudflare - detects `navigator.webdriver`, missing APIs
- **Attempts**:
  - Stealth plugin (`puppeteer-extra-plugin-stealth`)
  - Human-like behavior (random mouse, realistic typing delays)
  - Real browser profile access
- **Files**:
  - `scripts/arlo-puppeteer-auth.js` (310 lines)
  - `scripts/test-arlo-puppeteer.js` (200+ lines)
  - `docs/development/features/PUPPETEER_ARLO_IMPLEMENTATION.md`

#### ❌ Approach 3: Cookie/Token Extraction (Failed)

- **Method**: Extract cookies and auth tokens from real logged-in browser session
- **Process**:
  1. ✅ Successfully extracted 3 cookies from my.arlo.com
  2. ✅ Successfully extracted 20 localStorage keys (device capabilities)
  3. ✅ Found 1004-character token in `localStorage.time`
  4. ❌ Token invalid when used in API requests (401 Unauthorized)
- **Discovery**: Arlo web app uses **HTTP interceptors** (Angular/React) that dynamically add authorization headers
- **Evidence**:
  - Simple `fetch()` from console → 401 Unauthorized
  - Arlo web app requests → 200 OK
  - Same cookies, different behavior
- **Root Cause**: Authentication happens in JavaScript interceptor layer, not visible in Network tab headers
- **Files**:
  - `scripts/arlo-real-browser-auth.js` (Chrome profile cookie extraction)
  - `scripts/test-arlo-cookies.js` (API test with extracted cookies)
  - `data/arlo-real-auth.json` (extracted cookies + localStorage)

#### 🔄 Approach 4: HTTP Interceptor Reverse Engineering (IN PROGRESS)

- **Method**: Capture and replicate exact authentication mechanism from Arlo web app
- **Status**: ✅ Complete toolkit created, ready to execute
- **Tools Created**:
  - `scripts/arlo-reverse-engineer.ps1` - Master automation script (6 phases)
  - `scripts/arlo-intercept-network.md` - Comprehensive guide
  - `scripts/parse-curl-to-json.js` - Parse Chrome DevTools cURL → JSON
  - `scripts/test-arlo-interceptor.js` - Comprehensive test suite
  - `scripts/arlo-analyze-bundle.js` - Browser console bundle analyzer
  - `scripts/ARLO_INTERCEPTOR_QUICKREF.md` - Quick reference guide
- **Process**:
  1. Capture working API request from Chrome DevTools Network tab
  2. Parse headers and analyze authentication mechanism
  3. Test exact request replication in Node.js
  4. Analyze JavaScript bundles to find token generation
  5. Extract secret key and signing algorithm
  6. Implement in ArloAdapter.ts
- **Expected Success Rate**: 70% (moderate - requires finding secret key)
- **Time Estimate**: 4-6 hours
- **Next Steps**: See [Quick Start](#quick-start---reverse-engineering) below

### Key Findings

1. **Arlo Developer API Shutdown**: Official API (developer.arlo.com) no longer exists
2. **Community Libraries Blocked**: @koush/arlo and similar libraries hit Cloudflare
3. **Bot Detection Stack**:
   - Layer 1: Cloudflare challenge (blocks direct HTTP)
   - Layer 2: Anti-automation detection (blocks Puppeteer)
   - Layer 3: Dynamic token generation (blocks static cookie replay)
4. **Token Mechanism**: Likely short-lived JWT or encrypted session token generated via JavaScript crypto
5. **HTTP Interceptor**: Angular/React interceptor adds dynamic auth headers before each request

---

## Quick Start - Reverse Engineering

### Automated Process (Recommended)

```powershell
pwsh scripts/arlo-reverse-engineer.ps1
```

The script guides you through all 6 phases interactively:

1. **Phase 1**: Setup and verification
2. **Phase 2**: Capture request from Chrome DevTools
3. **Phase 3**: Parse cURL command to JSON
4. **Phase 4**: Test exact request replication
5. **Phase 5**: Analyze JavaScript bundles
6. **Phase 6**: Run comprehensive analysis

### Manual Quick Start

```bash
# 1. Capture request (5 min)
# Chrome DevTools → Network → Copy as cURL → Save to scripts/arlo-captured-request.txt

# 2. Parse and test (2 min)
node scripts/parse-curl-to-json.js
node scripts/test-arlo-exact-request.js

# 3. Analyze bundle (10 min)
# Copy scripts/arlo-analyze-bundle.js into Chrome Console on my.arlo.com

# 4. Comprehensive analysis (5 min)
node scripts/test-arlo-interceptor.js
```

### Documentation

- **Complete Guide**: `scripts/arlo-intercept-network.md` (detailed walkthrough)
- **Quick Reference**: `scripts/ARLO_INTERCEPTOR_QUICKREF.md` (cheat sheet)
- **Tools**: All scripts in `scripts/` directory

---

## Alternative: Mock Camera Data (Fallback)

If reverse engineering proves unsuccessful, mock data is production-ready.

### Decision Rationale

**Pros of Mocking**:

- ✅ Continue HomeHub development without API delays
- ✅ Test all SecurityCameras UI features
- ✅ No rate limits or API quota concerns
- ✅ Realistic data from extracted device capabilities
- ✅ Easy to swap with real adapter later (interface-based design)

**Cons of Mocking**:

- ❌ No real-time camera feeds
- ❌ No actual doorbell notifications
- ❌ No live motion detection

**Timeframe**: Phase 1-4 focus on core features (devices, automations, energy, insights). Phase 5 dedicated to security/cameras - revisit Arlo integration then with more time.

### Mock Data Implementation

**File**: `src/constants/mock-arlo-cameras.ts`

**5 Mock Cameras**:

1. **AVD1001B Video Doorbell** - Front Door (1536x1536, battery 87%)
2. **VMC4041PB Pro 4** - Backyard (2K, spotlight, 2-way audio, battery 65%)
3. **VMC4041PB Pro 4** - Driveway (2K, motion zones, battery 42%)
4. **VMC5040 Pro 5** - Garage (4K, color night vision, auto-tracking, battery 91%)
5. **VMC2040B Essential** - Living Room (1080p, wired, privacy shutter)

**Realistic Properties**:

- Battery levels (40-90%)
- Signal strength (78-100%)
- Last motion timestamps
- Recording capabilities from real device JSON
- Firmware versions from actual devices
- Placeholder thumbnails/streams

---

## Future Integration Options (Phase 5)

When revisiting Arlo integration, consider:

### Option A: Reverse-Engineer HTTP Interceptor ⭐ (Recommended)

- Use Chrome DevTools → Network tab → Copy as cURL
- Capture exact headers from successful request
- Reverse-engineer token generation algorithm
- Implement in Node.js
- **Effort**: 1-2 weeks
- **Success Rate**: 70%

### Option B: Homebridge Arlo Plugin

- Use existing Homebridge plugin: `@homebridge/arlo-platform`
- Plugin already solves authentication
- Extract tokens from Homebridge config
- Use tokens in ArloAdapter
- **Effort**: 2-3 days
- **Success Rate**: 90%
- **Trade-off**: Requires Homebridge running

### Option C: Arlo RTSP Streams (Paid Feature)

- Arlo Secure subscription includes RTSP
- Direct camera access, no cloud API
- Use standard video streaming libraries
- **Effort**: 1 week
- **Success Rate**: 95%
- **Cost**: $4.99/month per camera

### Option D: Continue with Mock Data

- Focus on other HomeHub features
- Use mock cameras indefinitely
- User manually accesses Arlo app separately
- **Effort**: 0
- **Trade-off**: No integration

---

## Lessons Learned

1. **Modern APIs are hard to reverse-engineer**: Multiple layers of bot protection
2. **Cookie replay insufficient**: Dynamic token generation requires understanding crypto
3. **Puppeteer limitations**: Even stealth mode detected by sophisticated systems
4. **Mock data is valuable**: Allows progress without blocking on external integrations
5. **Phase-based approach works**: Core features first, integrations later

---

## References

### Documentation

- `docs/development/features/PUPPETEER_ARLO_IMPLEMENTATION.md` - Puppeteer attempt
- `docs/development/features/ARLO_REAL_BROWSER_AUTH.md` - Cookie extraction guide
- `scripts/arlo-extract-cookies-manual.md` - Manual extraction steps

### Code

- `src/services/devices/ArloAdapter.ts` - Adapter implementation (partial)
- `src/constants/mock-arlo-cameras.ts` - Mock data (complete) ✅
- `scripts/arlo-puppeteer-auth.js` - Puppeteer automation
- `scripts/test-arlo-cookies.js` - Cookie/token testing
- `data/arlo-real-auth.json` - Extracted auth data

### External

- [Arlo Community](https://community.arlo.com/) - API discussions
- [Homebridge Arlo Plugin](https://github.com/homebridge/homebridge-arlo) - Working alternative
- [@koush/arlo](https://github.com/JOHNEPPILLAR/arlo) - Blocked by Cloudflare
