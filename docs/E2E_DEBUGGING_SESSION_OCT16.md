# E2E Debugging Session Summary - October 16, 2025

**Session Duration**: 60 minutes
**Status**: 🔶 BLOCKED - Vite Dev Server 500 Errors
**Root Cause**: Vite dev server returns 500 Internal Server Error during Playwright webServer startup

---

## Problem Statement

All 11 E2E tests fail with identical symptoms:

- TimeoutError waiting for `[data-testid="dashboard"]` element (15s timeout)
- Console shows "Failed to load resource: the server responded with a status of 500 (Internal Server Error)"
- Body text is empty (React never renders)
- #root element exists (HTML loads successfully)
- Vite eventually connects, but only after 500 errors

---

## Debugging Steps Taken

### 1. Wait Strategy Improvements ❌

**Attempted**: Added `waitUntil: 'networkidle'` and `waitForLoadState('domcontentloaded')`
**Result**: No change - still timeout errors
**Conclusion**: Not a timing issue

### 2. PWA Plugin Disable ❌

**Attempted**: Conditionally disabled VitePWA plugin during tests via `PLAYWRIGHT_TEST` env var
**Result**: Still getting 500 errors
**Files Modified**:

- `vite.config.ts` - Added conditional PWA plugin loading
- `playwright.config.ts` - Added `PLAYWRIGHT_TEST: 'true'` to webServer env

### 3. Console Logging 🟡

**Attempted**: Added browser console/error listeners to tests
**Result**: Successfully captured 500 errors occurring BEFORE Vite connects
**Key Finding**:

```
BROWSER: Failed to load resource: the server responded with a status of 500 (Internal Server Error)
BROWSER: Failed to load resource: the server responded with a status of 500 (Internal Server Error)
...
BROWSER: [vite] connecting...
BROWSER: [vite] connected.
Root element exists: true
Body text:  (EMPTY)
```

### 4. Data Attribute Addition ✅

**Completed**: Added `data-testid="dashboard"` to Dashboard.tsx line 635
**Result**: Attribute added successfully, but element never renders due to 500 errors
**Conclusion**: Test selector is correct, app just isn't starting

---

## Root Cause Analysis

### Symptoms

1. **500 HTTP Errors** - Multiple occurrences before Vite HMR connects
2. **Empty Body** - React application never renders
3. **Vite Eventually Connects** - HMR websocket establishes connection
4. **HTML Loads** - #root element exists in DOM

### Hypothesis

The Vite dev server started by Playwright's `webServer` config is failing to serve certain modules or resources, returning 500 errors instead. This prevents the JavaScript bundle from loading, which means React never initializes.

**Possible Causes**:

1. **Plugin Conflict** - A Vite plugin (PWA, Tailwind, visualizer) fails during test environment
2. **Module Resolution** - A module import fails to resolve (process polyfill, arlo package, etc.)
3. **Build Step Missing** - Service worker or other build artifact expected but not generated
4. **Environment Variable** - Missing or incorrect env var causes plugin crash

### Evidence

- Normal `npm run dev` works fine (manual testing confirmed)
- Only fails when started via Playwright's `webServer.command`
- 500 errors occur before any React code executes
- Vite's HMR websocket connects successfully (server is running)

---

## Files Modified During Debug Session

### Test Files

- `tests/e2e/device-discovery.spec.ts`
  - Added `waitUntil: 'networkidle'` to page.goto()
  - Added console/error logging
  - Increased timeout to 15s
  - Marked as `.skip()` (temporarily disabled)

- `tests/e2e/scene-management.spec.ts`
  - Added `waitUntil: 'networkidle'` to page.goto()
  - Increased timeout to 15s

### Config Files

- `playwright.config.ts`
  - Added `stdout: 'pipe'` and `stderr: 'pipe'` to webServer
  - Added `env: { PLAYWRIGHT_TEST: 'true' }` to webServer

- `vite.config.ts`
  - Wrapped VitePWA plugin in conditional: `...(process.env.PLAYWRIGHT_TEST ? [] : [VitePWA({...})])`

### Source Files

- `src/components/Dashboard.tsx`
  - Added `data-testid="dashboard"` to root div (line 635)

---

## Next Steps (Priority Order)

### Immediate (30 min)

1. **Check Vite Dev Server Logs**
   - Run tests with visible terminal to see actual Vite startup errors
   - Command: `npm run test:e2e` and monitor Vite output
   - Look for plugin initialization failures or module resolution errors

2. **Test with Pre-Started Dev Server**
   - Terminal 1: `npm run dev` (manual start)
   - Terminal 2: Comment out `webServer` in playwright.config.ts
   - Run: `npm run test:e2e`
   - If tests pass → webServer config issue
   - If tests fail → app incompatible with Playwright environment

### Short Term (1-2 hours)

3. **Simplify Vite Config**
   - Create `vite.config.test.ts` with minimal plugins
   - Use in webServer: `command: 'vite --config vite.config.test.ts'`
   - Add plugins back one-by-one to identify culprit

4. **Test Built Version**
   - Build production version: `npm run build`
   - Serve with static server: `npx serve dist -p 5173`
   - Run E2E tests against built version
   - If tests pass → dev server specific issue

### Long Term (2-4 hours)

5. **Investigate Specific Modules**
   - Check if `@koush/arlo` package causes issues in test environment
   - Verify `process-polyfill.ts` works correctly during Vite startup
   - Test if Tailwind CSS 4 Vite plugin has test environment bugs

6. **Alternative Test Strategy**
   - Use Vitest browser mode instead of Playwright
   - Or: Run E2E tests against deployed Cloudflare Pages URL
   - Or: Skip E2E entirely, rely on integration tests

---

## Success Criteria

✅ **Fixed**: When all 11 E2E tests pass consistently
✅ **Evidence**: No 500 errors in browser console logs
✅ **Validation**: Dashboard element renders within 5 seconds
✅ **CI/CD**: Tests pass on GitHub Actions

---

## Lessons Learned

1. **Console Logging is Essential** - Added `page.on('console')` and `page.on('pageerror')` early in debug process
2. **Test Selector First** - Always verify testid exists in DOM before assuming wait strategy issue
3. **Isolate Dev Server** - When webServer fails, test with manually started server to isolate config vs app issue
4. **PWA Plugins Problematic** - Service worker plugins often fail in test environments
5. **Vite Module Resolution** - Complex apps with polyfills/unusual imports may break in test mode

---

## Related Documentation

- `docs/E2E_TESTING_STATUS.md` - Original debugging doc (now superseded)
- `TESTING_INFRASTRUCTURE_COMPLETE.md` - Testing strategy overview
- `playwright.config.ts` - Playwright configuration
- `vite.config.ts` - Vite dev server configuration

---

**Last Updated**: October 16, 2025 20:52 PST
**Debugger**: GitHub Copilot
**Status**: Blocked pending Vite server log analysis
