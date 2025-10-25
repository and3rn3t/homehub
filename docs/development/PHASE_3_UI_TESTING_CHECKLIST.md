# Phase 3 UI Testing Checklist

**Date**: October 15, 2025
**Tester**: You
**Duration**: 30-60 minutes
**Goal**: Verify automation engine works end-to-end via UI

---

## ✅ Pre-Testing Setup (5 min)

### 1. Start Development Server

```bash
npm run dev
```

**Expected**: Server starts on http://localhost:5173

### 2. Open Browser

- [ ] Navigate to http://localhost:5173
- [ ] Open DevTools (F12)
- [ ] Switch to Console tab (watch for errors)

### 3. Initial Check

Run this in browser console:

```javascript
// Quick environment check
console.log('Automations:', localStorage.getItem('automations'))
console.log('Devices:', JSON.parse(localStorage.getItem('devices') || '[]').length + ' devices')
console.log('Ready for testing!')
```

**Expected**: No console errors, devices exist

---

## 🧪 Test 1: View Automations Tab (5 min)

### Steps

1. [ ] Click **Automations** tab in bottom navigation
2. [ ] Observe the UI loads

### Expected Results

- [ ] Automations tab opens without errors
- [ ] Page renders (even if empty)
- [ ] No console errors in DevTools
- [ ] Can see "Create Automation" button (or similar)

### If Issues

- Check console for errors
- Verify `src/components/Automations.tsx` exists
- Try refreshing page (Ctrl+R)

---

## 🧪 Test 2: Create Time-Based Automation (10 min)

### Steps

1. [ ] Click **Create Automation** button
2. [ ] Fill in form:
   - **Name**: "Test Evening Lights"
   - **Trigger Type**: Time
   - **Time**: 18:00 (6:00 PM)
   - **Days**: Select all days
   - **Action**: Turn on a light device
   - **Brightness** (if available): 75%
3. [ ] Click **Save** or **Create**

### Expected Results

- [ ] Automation appears in list
- [ ] Shows as "Enabled" or has toggle
- [ ] "Next Run" time displayed (should be today at 6:00 PM or tomorrow if past 6 PM)
- [ ] No console errors
- [ ] Toast notification shows success

### Observations

**Automation ID**: ******\_******
**Next Run Time**: ******\_******
**Status**: Enabled / Disabled
**Errors?**: Yes / No

**Screenshot Location**: `screenshots/test-2-create-automation.png`

---

## 🧪 Test 3: Manual Trigger Test (10 min)

### Steps

1. [ ] Find the "Test Evening Lights" automation in list
2. [ ] Look for manual trigger button (play icon, "Run Now", or similar)
3. [ ] Click manual trigger button
4. [ ] Observe device response

### Expected Results

- [ ] Button exists and is clickable
- [ ] Device responds (lights turn on)
- [ ] Brightness changes to 75% (if supported)
- [ ] Response time <1 second
- [ ] Success toast notification
- [ ] No console errors

### Performance Check

**Trigger Click → Device Response**: **\_\_\_** ms
**Console Errors**: Yes / No
**Device Protocol**: Hue / HTTP / MQTT
**Success**: Yes / No

### If No Manual Trigger Button

Alternative test:

1. [ ] Wait until 6:00 PM (scheduled time)
2. [ ] Verify automation executes automatically
3. [ ] Check monitoring dashboard for execution log

---

## 🧪 Test 4: View Monitoring Dashboard (5 min)

### Steps

1. [ ] Look for **Monitoring** section in Automations tab
   - May be a separate tab
   - May be a button like "View Metrics"
   - May be integrated into main view
2. [ ] Open monitoring dashboard
3. [ ] Observe metrics display

### Expected Results

- [ ] Dashboard opens/renders
- [ ] Shows at least one execution (from Test 3)
- [ ] Metrics displayed:
  - Total Executions: 1+
  - Success Rate: 100%
  - Avg Response Time: <500ms
  - Last Execution: Recent timestamp
- [ ] No console errors

### Metrics Observed

| Metric           | Value        |
| ---------------- | ------------ |
| Total Executions | **\_**       |
| Successful       | **\_**       |
| Failed           | **\_**       |
| Success Rate     | **\_**%      |
| Avg Time         | **\_**ms     |
| Last Execution   | ****\_\_**** |

**Screenshot**: `screenshots/test-4-monitoring.png`

---

## 🧪 Test 5: Create Condition-Based Automation (10 min)

### Steps

1. [ ] Click **Create Automation** again
2. [ ] Fill in form:
   - **Name**: "High Temp Alert"
   - **Trigger Type**: Condition
   - **Device**: Select a temperature sensor (or any sensor)
   - **Operator**: `>` (greater than)
   - **Threshold**: 75 (or appropriate value)
   - **Action**: Turn on fan (or any device)
3. [ ] Save automation

### Expected Results

- [ ] Automation created successfully
- [ ] Appears in list with "Condition" trigger type
- [ ] Shows monitored device name
- [ ] Shows threshold value
- [ ] Status: Enabled

### Test Trigger (if possible)

1. [ ] Manually adjust sensor value above threshold
   - Use device control panel
   - Or simulate via localStorage edit
2. [ ] Verify automation triggers
3. [ ] Verify cooldown prevents immediate retrigger

**Cooldown Test**:

- First trigger: **\_\_\_** (time)
- Second attempt: Blocked / Allowed
- Cooldown Duration: **\_\_\_** seconds

---

## 🧪 Test 6: Edit Automation (5 min)

### Steps

1. [ ] Find "Test Evening Lights" automation
2. [ ] Click **Edit** button (pencil icon or similar)
3. [ ] Change time to 19:00 (7:00 PM)
4. [ ] Save changes

### Expected Results

- [ ] Edit dialog/form opens
- [ ] Current values pre-filled correctly
- [ ] Can modify time field
- [ ] Save succeeds
- [ ] "Next Run" time updates to 7:00 PM
- [ ] No console errors

---

## 🧪 Test 7: Disable/Enable Automation (3 min)

### Steps

1. [ ] Find toggle switch for "Test Evening Lights"
2. [ ] Click to **disable** automation
3. [ ] Observe status change
4. [ ] Click to **enable** again

### Expected Results

- [ ] Toggle switches instantly (optimistic update)
- [ ] Status indicator changes (gray → green or similar)
- [ ] Disabled automation doesn't execute at scheduled time
- [ ] Re-enabled automation resumes schedule
- [ ] No console errors

**Status Changes**: Enabled → Disabled → Enabled ✅

---

## 🧪 Test 8: Delete Automation (3 min)

### Steps

1. [ ] Find "High Temp Alert" automation (created in Test 5)
2. [ ] Click **Delete** button (trash icon)
3. [ ] Confirm deletion (if prompted)

### Expected Results

- [ ] Confirmation dialog appears (optional)
- [ ] Automation removed from list
- [ ] Monitoring unsubscribes (no more condition checks)
- [ ] No console errors
- [ ] Success toast notification

**Deleted Successfully**: Yes / No

---

## 🧪 Test 9: Check Browser Console (5 min)

### Steps

1. [ ] Review entire console log from start of session
2. [ ] Look for patterns

### What to Check

- [ ] **No critical errors** (red messages)
- [ ] **Warnings acceptable** (yellow messages about dev mode)
- [ ] **Debug logs present** (if enabled)
- [ ] **No infinite loops** (repeating messages)
- [ ] **No memory leaks** (check Performance tab if concerned)

### Console Summary

**Errors**: **\_** (should be 0)
**Warnings**: **\_** (acceptable)
**Info/Debug**: **\_**
**Performance**: Good / Slow / Acceptable

---

## 🧪 Test 10: Browser Validation Script (5 min)

### Steps

1. [ ] Open `scripts/validate-phase3.js`
2. [ ] Copy entire contents
3. [ ] Paste into browser console
4. [ ] Run: `await validatePhase3()`

### Expected Output

```
🧪 Phase 3 Validation Starting...

📦 Test 1: Checking if services are loaded...
  ✅ localStorage accessible
  ✅ Automations data structure exists
  ✅ Monitoring data exists

... (more tests)

📊 VALIDATION SUMMARY
✅ scheduler             X/Y passed (Z%)
✅ conditionEvaluator    X/Y passed (Z%)
✅ actionExecutor        X/Y passed (Z%)
...

✅ PASS Overall: X/Y tests passed (80%+)
```

**Overall Score**: **\_**% (Target: ≥80%)

---

## 📊 Test Results Summary

### Overall Results

| Test                      | Status | Duration   | Notes |
| ------------------------- | ------ | ---------- | ----- |
| 1. View Automations       | ⬜     | \_\_\_ min |       |
| 2. Create Time Automation | ⬜     | \_\_\_ min |       |
| 3. Manual Trigger         | ⬜     | \_\_\_ min |       |
| 4. Monitoring Dashboard   | ⬜     | \_\_\_ min |       |
| 5. Condition Automation   | ⬜     | \_\_\_ min |       |
| 6. Edit Automation        | ⬜     | \_\_\_ min |       |
| 7. Disable/Enable         | ⬜     | \_\_\_ min |       |
| 8. Delete Automation      | ⬜     | \_\_\_ min |       |
| 9. Console Check          | ⬜     | \_\_\_ min |       |
| 10. Validation Script     | ⬜     | \_\_\_ min |       |

**Total Duration**: **\_\_\_** minutes
**Tests Passed**: **\_** / 10
**Pass Rate**: **\_**%

### Critical Issues Found

1. ***
2. ***
3. ***

### Minor Issues Found

1. ***
2. ***
3. ***

### Positive Observations

1. ***
2. ***
3. ***

---

## ✅ Success Criteria

Phase 3 UI testing is **COMPLETE** when:

- [ ] All 10 tests executed
- [ ] At least 8/10 tests pass (80%+)
- [ ] At least 1 automation works end-to-end
- [ ] Monitoring dashboard shows metrics
- [ ] No critical console errors
- [ ] Response time <500ms for actions

**Result**: PASS ✅ / FAIL ❌ / PARTIAL ⚠️

---

## 🚀 Next Steps Based on Results

### If PASS (8+ tests passed)

✅ **Phase 3 is VALIDATED!**

Next actions:

1. Take screenshots for documentation
2. Update `PHASE_3_VALIDATION_RESULTS.md` with findings
3. Proceed to 24-hour stability test (Priority 3)
4. Begin Phase 4 planning

### If PARTIAL (5-7 tests passed)

⚠️ **Phase 3 needs minor fixes**

Next actions:

1. Document failing tests
2. Fix critical issues
3. Re-test failed scenarios
4. Update validation status

### If FAIL (<5 tests passed)

❌ **Phase 3 needs attention**

Next actions:

1. Review console errors carefully
2. Check service initialization
3. Verify device integration
4. Consult `PHASE_3_VALIDATION_RESULTS.md` for troubleshooting
5. Report issues with details

---

## 📸 Screenshots Checklist

Create these screenshots during testing:

- [ ] `test-2-create-automation.png` - Automation creation form
- [ ] `test-3-manual-trigger.png` - Before/after device state
- [ ] `test-4-monitoring.png` - Monitoring dashboard with metrics
- [ ] `test-5-condition-automation.png` - Condition trigger config
- [ ] `test-9-console-clean.png` - Clean console (no errors)

**Save to**: `screenshots/phase3-ui-testing/`

---

## 📝 Testing Notes

Use this space for observations during testing:

```
Time Started: _______
Time Ended: _______

General Observations:
-
-
-

Device Types Tested:
-
-

Performance Notes:
-
-

Suggestions for Improvement:
-
-

Overall Impression:
-

Recommendation: PROCEED TO PHASE 4 / NEEDS MORE WORK / BLOCKED
```

---

**Tester Signature**: ******\_\_\_******
**Date Completed**: October 15, 2025
**Status**: ⬜ Complete | ⬜ In Progress | ⬜ Blocked

---

**Pro Tip**: Keep this checklist open in a side window while testing. Check off items as you go. Take notes liberally - they'll be valuable for documentation!

**Good luck! 🚀**
