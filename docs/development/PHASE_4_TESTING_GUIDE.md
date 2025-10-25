# Phase 4: Auto Token Refresh - Testing Guide

**Test Date**: October 13, 2025
**Tester**: ******\_\_\_******
**Status**: 🚧 In Progress

---

## Pre-Test Checklist

Before starting, ensure:

- [ ] Dev server is running (`npm run dev`)
- [ ] Browser is open at `http://localhost:5173`
- [ ] Chrome DevTools is available (F12)
- [ ] Active Arlo account with at least 1 camera
- [ ] Logged into my.arlo.com in another tab

---

## Test 1: Simulate Token Expiration (401 Error)

**Goal**: Verify that clearing the token triggers the modal automatically

### Steps

1. **Open browser console** at `http://localhost:5173`

   ```javascript
   // Check if token exists
   console.log('Current token:', localStorage.getItem('arlo-auth-token'))
   ```

2. **Clear the token**

   ```javascript
   localStorage.removeItem('arlo-auth-token')
   console.log('Token cleared')
   ```

3. **Navigate to Security Cameras tab**
   - Click "Security" in the main tab bar
   - Wait for the component to load

### Expected Results

- [ ] Console shows: `[ArloAdapter] No token available` or similar
- [ ] Toast error appears: "Arlo authentication expired"
- [ ] TokenRefreshModal opens automatically
- [ ] Modal shows:
  - [ ] Title: "Arlo Token Expired"
  - [ ] Token lifespan info box (clock icon)
  - [ ] 8-step instructions
  - [ ] Authorization textarea (empty)
  - [ ] X-Cloud-ID textarea (empty)
  - [ ] "Paste from Clipboard" button
  - [ ] "Cancel" and "Save Token" buttons

### Notes

```
Test Result: [ ] PASS  [ ] FAIL
Issues Found:
```

---

## Test 2: Token Validation & Parsing

**Goal**: Verify format validation and multi-format parsing works

### Test 2A: Invalid Token (Wrong Prefix)

1. **In the modal, paste this invalid token**:

   ```
   1_wrong_prefix_token_here_should_start_with_2_but_doesnt_this_is_long_enough_though
   ```

2. **Expected Result**:
   - [ ] Red error box appears
   - [ ] Message: "Invalid token format. Authorization should start with '2\_' and be at least 100 characters."

### Test 2B: Invalid Token (Too Short)

1. **Clear textarea and paste**:

   ```
   2_short
   ```

2. **Expected Result**:
   - [ ] Red error box appears (same message as 2A)

### Test 2C: Valid Token Format

1. **Clear textarea and paste** (replace with your actual token):

   ```
   2_abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyz1234567890
   ```

2. **Expected Result**:
   - [ ] Green success box appears
   - [ ] Message: "Valid Token Format - Token looks good! Click 'Save Token' to update."
   - [ ] "Save Token" button becomes enabled

### Test 2D: Bash cURL Parsing

1. **Clear textarea and paste** (use your actual token):

   ```bash
   curl 'https://myapi.arlo.com/hmsweb/users/devices' \
     -H 'auth-version: 2' \
     -H 'authorization: 2_your_token_here' \
     -H 'xcloudid: K5HYEUA3-2400-336-127845809'
   ```

2. **Expected Results**:
   - [ ] Green success box appears
   - [ ] Authorization textarea stays populated with full cURL
   - [ ] X-Cloud-ID textarea auto-fills with parsed value
   - [ ] Can save immediately

### Test 2E: PowerShell Format

1. **Clear and paste**:

   ```powershell
   Invoke-WebRequest -Uri "https://myapi.arlo.com/hmsweb/users/devices" `
     -Headers @{"authorization"="2_your_token_here"; "xcloudid"="K5HYEUA3-2400"}
   ```

2. **Expected Results**:
   - [ ] Both fields parse correctly
   - [ ] Green checkmark appears

### Test 2F: Raw Headers Format

1. **Clear and paste**:

   ```
   authorization: 2_your_token_here
   xcloudid: K5HYEUA3-2400-336-127845809
   ```

2. **Expected Results**:
   - [ ] Both fields parse correctly
   - [ ] Green checkmark appears

### Test 2G: Clipboard Paste Button

1. **Copy a valid cURL command** (from Chrome DevTools or test data)

2. **Click "Paste from Clipboard" button** in modal

3. **Expected Results**:
   - [ ] Toast appears: "Pasted from clipboard"
   - [ ] Authorization field populates
   - [ ] X-Cloud-ID auto-fills if found

### Notes

```
Test Result: [ ] PASS  [ ] FAIL
Issues Found:
```

---

## Test 3: Token Save & Reload Flow

**Goal**: Capture real token and verify full refresh flow

### Steps

1. **Open my.arlo.com in new tab**
   - Log in if needed
   - Ensure you're on the main dashboard

2. **Open Chrome DevTools** (F12)
   - Go to **Network** tab
   - Filter by **Fetch/XHR**
   - Clear existing requests (trash icon)

3. **Trigger an API call**
   - Click on any camera to start streaming
   - Watch for requests in Network tab

4. **Find the right request**
   - Look for request to:
     - `myapi.arlo.com/hmsweb/users/devices`
     - OR `myapi.arlo.com/hmsweb/users/devices/sipInfo/v2`
   - Status should be 200 OK

5. **Copy as cURL**
   - Right-click the request
   - **Copy** → **Copy as cURL (bash)**

6. **Return to HomeHub tab**
   - Modal should still be open from Test 1
   - If not, clear token again and reopen

7. **Paste the cURL command**
   - Paste into Authorization textarea
   - Should see green checkmark

8. **Save the token**
   - Click "Save Token" button

### Expected Results (Immediate)

- [ ] Success toast: "Token saved successfully! Valid for 36 hours"
- [ ] Modal closes automatically
- [ ] Toast appears: "Cameras reloaded - X cameras connected"
- [ ] Console logs: `[SecurityCameras] Token refreshed, reloading cameras...`

### Expected Results (Camera Grid)

- [ ] Loading state appears briefly
- [ ] Real camera tiles load (not mock data)
- [ ] Camera count in header matches your account
- [ ] Status indicators show correct states (online/offline)
- [ ] No error messages in console

### Verify localStorage

```javascript
// In browser console
const token = JSON.parse(localStorage.getItem('arlo-auth-token'))
console.log('Saved token:', token)

// Should show:
// {
//   authorization: "2_...",
//   authVersion: "2",
//   xcloudid: "K5HYEUA3-...",
//   capturedAt: "2025-10-13T...",
//   expiresAt: "2025-10-15T...",  // 36 hours later
//   source: "manual"
// }

// Check expiration
const expiresAt = new Date(token.expiresAt)
const hoursUntil = (expiresAt - new Date()) / (1000 * 60 * 60)
console.log('Hours until expiration:', hoursUntil.toFixed(1))
// Should be ~36 hours
```

### Verify Token Manager

```javascript
// Test token manager directly (if exposed)
// Note: You may need to add this to window for testing:
// In ArloTokenManager.ts, add: window.arloTokenManager = arloTokenManager

// Or test via component actions and observe console logs
```

### Notes

```
Test Result: [ ] PASS  [ ] FAIL
Camera Count: _____ (expected: _____)
Issues Found:
```

---

## Test 4: Expiration Warnings

**Goal**: Verify proactive warnings appear at correct thresholds

### Test 4A: Set Token to Expire in 1 Hour

1. **In browser console**:

   ```javascript
   const token = JSON.parse(localStorage.getItem('arlo-auth-token'))
   token.expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
   localStorage.setItem('arlo-auth-token', JSON.stringify(token))
   console.log('Token set to expire in 1 hour')
   ```

2. **Refresh the page** or navigate away and back to Security tab

### Expected Results (Immediate)

- [ ] Header shows: "⏰ Token expires in 1 hour" (approximately)
- [ ] No modal opens (just warning in header)

### Test 4B: Trigger Periodic Check

**Option 1: Wait 5 Minutes** (real-world test)

- Wait for the periodic check interval
- Should see toast warning after 5 minutes

**Option 2: Force Check** (faster test)

1. Open `src/components/SecurityCameras.tsx`
2. Find this line: `}, 5 * 60 * 1000) // Check every 5 minutes`
3. Change to: `}, 5000) // Check every 5 seconds`
4. Save file (hot reload will restart)
5. Wait 5 seconds

### Expected Results (After Check)

- [ ] Toast warning appears: "Arlo token expiring soon"
- [ ] Description: "Token expires in 1 hour. Consider refreshing."
- [ ] Action button: "Refresh Now"
- [ ] Toast stays visible for 10 seconds

### Test 4C: Click "Refresh Now"

1. **Click the "Refresh Now" button** in the toast

### Expected Results

- [ ] TokenRefreshModal opens immediately
- [ ] All fields and instructions visible
- [ ] Can paste new token and save

### Test 4D: Test 2-Hour Threshold

1. **Set token to expire in 2 hours**:

   ```javascript
   const token = JSON.parse(localStorage.getItem('arlo-auth-token'))
   token.expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
   localStorage.setItem('arlo-auth-token', JSON.stringify(token))
   ```

2. **Refresh page**

### Expected Results

- [ ] Header warning appears
- [ ] Periodic check should trigger toast (after interval)

### Test 4E: Test 30-Minute Threshold

1. **Set token to expire in 30 minutes**:

   ```javascript
   const token = JSON.parse(localStorage.getItem('arlo-auth-token'))
   token.expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
   localStorage.setItem('arlo-auth-token', JSON.stringify(token))
   ```

2. **Refresh page**

### Expected Results

- [ ] Header shows: "⏰ Token expires in 30 minutes"
- [ ] Toast warning appears (after interval)
- [ ] More urgent messaging expected

### Test 4F: Test 3-Hour (No Warning)

1. **Set token to expire in 3 hours**:

   ```javascript
   const token = JSON.parse(localStorage.getItem('arlo-auth-token'))
   token.expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
   localStorage.setItem('arlo-auth-token', JSON.stringify(token))
   ```

2. **Refresh page**

### Expected Results

- [ ] NO header warning (>2 hours is safe)
- [ ] NO toast warnings
- [ ] Just shows normal "X cameras connected"

### Cleanup

```javascript
// Restore original check interval in SecurityCameras.tsx
// Change back to: }, 5 * 60 * 1000)
```

### Notes

```
Test Result: [ ] PASS  [ ] FAIL
Issues Found:
```

---

## Test 5: Token Manager API

**Goal**: Verify all ArloTokenManager methods work correctly

### Setup

```javascript
// In browser console, we'll test the token manager methods
// Note: These methods are used internally but we can test via their effects

// First, save a test token
localStorage.setItem(
  'arlo-auth-token',
  JSON.stringify({
    authorization: '2_test_token_' + 'x'.repeat(100),
    authVersion: '2',
    xcloudid: 'TEST-1234-5678-9012',
    capturedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
    source: 'manual',
  })
)
```

### Test 5A: Token Storage & Retrieval

1. **Verify token was saved**:

   ```javascript
   const stored = localStorage.getItem('arlo-auth-token')
   console.log('Stored token exists:', stored !== null)
   console.log('Token length:', stored.length)
   ```

### Expected Results

- [ ] Token exists in localStorage
- [ ] Token is valid JSON
- [ ] All required fields present

### Test 5B: Token Validation

1. **Navigate to Security tab** (token manager will validate on load)
2. **Check console logs** for validation messages

### Expected Results

- [ ] No errors about invalid token
- [ ] Cameras should load (or attempt to load)

### Test 5C: Expiration Calculation

1. **Check expiration time**:

   ```javascript
   const token = JSON.parse(localStorage.getItem('arlo-auth-token'))
   const now = new Date()
   const expires = new Date(token.expiresAt)
   const hoursUntil = (expires - now) / (1000 * 60 * 60)
   console.log('Hours until expiration:', hoursUntil.toFixed(2))
   ```

### Expected Results

- [ ] Hours until expiration is ~36 (for fresh token)
- [ ] Expiration date is in the future

### Test 5D: Format Validation

1. **Test valid format** (via modal):
   - Open modal
   - Paste token starting with "2\_" and length > 100
   - Should see green checkmark

2. **Test invalid format**:
   - Paste token with wrong prefix
   - Should see red error

### Test 5E: Token Clearing

1. **Navigate to Security tab** (ensure cameras loaded)

2. **Clear token**:

   ```javascript
   localStorage.removeItem('arlo-auth-token')
   ```

3. **Refresh page or navigate to another tab and back**

### Expected Results

- [ ] Modal appears automatically (no valid token)
- [ ] Cameras fall back to mock data
- [ ] Toast error appears

### Notes

```
Test Result: [ ] PASS  [ ] FAIL
Issues Found:
```

---

## Test 6: Edge Cases & Error Handling

**Goal**: Test unusual scenarios and error conditions

### Test 6A: Malformed Token in localStorage

1. **Save malformed JSON**:

   ```javascript
   localStorage.setItem('arlo-auth-token', 'not-valid-json')
   ```

2. **Refresh page**

### Expected Results

- [ ] App doesn't crash
- [ ] Modal appears (token manager handles parse error)
- [ ] Console shows error log (expected)

### Test 6B: Missing Required Fields

1. **Save token missing xcloudid**:

   ```javascript
   localStorage.setItem(
     'arlo-auth-token',
     JSON.stringify({
       authorization: '2_test_token_' + 'x'.repeat(100),
       authVersion: '2',
       // missing xcloudid
     })
   )
   ```

2. **Navigate to Security tab**

### Expected Results

- [ ] Validation fails
- [ ] Modal appears
- [ ] No crashes

### Test 6C: Expired Token in Storage

1. **Save already-expired token**:

   ```javascript
   localStorage.setItem(
     'arlo-auth-token',
     JSON.stringify({
       authorization: '2_expired_token_' + 'x'.repeat(100),
       authVersion: '2',
       xcloudid: 'EXPIRED-1234-5678',
       capturedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 48 hrs ago
       expiresAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hrs ago
       source: 'manual',
     })
   )
   ```

2. **Navigate to Security tab**

### Expected Results

- [ ] Token manager detects expiration
- [ ] Modal appears automatically
- [ ] Console logs expiration warning

### Test 6D: Network Offline (Simulation)

1. **Open DevTools** → **Network tab**
2. **Change throttling** to "Offline"
3. **Try to save token and reload cameras**

### Expected Results

- [ ] Error toast appears: "Failed to reload cameras"
- [ ] Cameras remain in previous state or show mock data
- [ ] No crashes

4. **Restore network** and try again

### Test 6E: Very Long cURL Command

1. **Create extremely long cURL** (1000+ lines with many headers)
2. **Paste into modal**

### Expected Results

- [ ] Textarea handles long input
- [ ] Parsing still works
- [ ] No performance issues

### Notes

```
Test Result: [ ] PASS  [ ] FAIL
Issues Found:
```

---

## Test 7: User Experience

**Goal**: Verify the UI is intuitive and responsive

### Test 7A: Modal Instructions Clarity

1. **Open modal** (clear token first)
2. **Read through all 8 steps**

### Checklist

- [ ] Instructions are clear and actionable
- [ ] Steps are numbered correctly (1-8)
- [ ] Chrome DevTools workflow is accurate
- [ ] No typos or confusing wording
- [ ] Code examples are properly formatted

### Test 7B: Loading States

1. **Save a token** and watch the reload process

### Expected Results

- [ ] Loading state appears briefly
- [ ] Spinner or skeleton shown (if applicable)
- [ ] UI doesn't freeze
- [ ] Smooth transition to loaded state

### Test 7C: Toast Notifications

1. **Verify all toasts have**:
   - [ ] Clear title
   - [ ] Descriptive message
   - [ ] Appropriate icon/color
   - [ ] Reasonable duration (3-10 seconds)
   - [ ] Dismissible (X button or auto-dismiss)

### Test 7D: Modal Responsiveness

1. **Resize browser window** while modal is open
2. **Test on different viewport sizes**:
   - Desktop (1920x1080)
   - Laptop (1366x768)
   - Tablet (768x1024)

### Expected Results

- [ ] Modal stays centered
- [ ] Content doesn't overflow
- [ ] Buttons remain accessible
- [ ] Scrollable if content too tall

### Test 7E: Keyboard Navigation

1. **Tab through modal elements**

### Expected Results

- [ ] Tab order is logical (top to bottom)
- [ ] Focus indicators are visible
- [ ] Can submit with Enter key
- [ ] Can cancel with Escape key

### Notes

```
Test Result: [ ] PASS  [ ] FAIL
Issues Found:
```

---

## Test 8: Performance

**Goal**: Ensure no performance regressions

### Test 8A: Initial Load Time

1. **Clear token** and **refresh page**
2. **Measure time** from refresh to modal appearance

### Expected Results

- [ ] Modal appears within 1 second
- [ ] No long delays or freezing

### Test 8B: Token Save Time

1. **Measure time** from clicking "Save Token" to cameras reloading

### Expected Results

- [ ] Toast appears within 500ms
- [ ] Modal closes immediately
- [ ] Camera reload completes within 3 seconds (network dependent)

### Test 8C: Memory Usage

1. **Open Chrome Task Manager** (Shift+Esc)
2. **Find your tab**
3. **Monitor memory** before and after token operations

### Expected Results

- [ ] No significant memory leaks
- [ ] Memory usage remains stable after multiple token refreshes

### Test 8D: Periodic Check Impact

1. **Leave page open for 30 minutes**
2. **Monitor console** for check logs

### Expected Results

- [ ] Checks occur every 5 minutes (6 checks total)
- [ ] No errors accumulate
- [ ] No performance degradation

### Notes

```
Test Result: [ ] PASS  [ ] FAIL
Issues Found:
```

---

## Summary & Sign-Off

### Test Results

| Test                         | Status            | Notes |
| ---------------------------- | ----------------- | ----- |
| Test 1: Token Expiration     | [ ] PASS [ ] FAIL |       |
| Test 2: Validation & Parsing | [ ] PASS [ ] FAIL |       |
| Test 3: Save & Reload        | [ ] PASS [ ] FAIL |       |
| Test 4: Expiration Warnings  | [ ] PASS [ ] FAIL |       |
| Test 5: Token Manager API    | [ ] PASS [ ] FAIL |       |
| Test 6: Edge Cases           | [ ] PASS [ ] FAIL |       |
| Test 7: User Experience      | [ ] PASS [ ] FAIL |       |
| Test 8: Performance          | [ ] PASS [ ] FAIL |       |

### Overall Status

- [ ] ✅ All tests passed - Ready for production
- [ ] ⚠️ Minor issues found - Needs fixes
- [ ] ❌ Critical issues found - Major rework needed

### Issues Found

```
List any issues, bugs, or unexpected behavior:

1.

2.

3.
```

### Recommendations

```
Suggested improvements or next steps:

1.

2.

3.
```

### Sign-Off

**Tested By**: ******\_\_\_******
**Date**: ******\_\_\_******
**Approved**: [ ] YES [ ] NO
**Comments**:

---

**Next Steps After Testing**:

1. Document findings in PHASE_4_AUTO_REFRESH_COMPLETE.md
2. Fix any critical issues found
3. Update README with token refresh instructions
4. Mark Phase 4 as complete in project roadmap
5. Begin planning Phase 5 (Energy Monitoring) or Phase 5 (Security)
