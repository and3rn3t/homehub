# Phase 1 Testing Guide

**Date**: January 2025
**Status**: Ready for Testing
**URL**: <http://localhost:5175>

---

## 🎯 Testing Objective

Verify that all Phase 1 features are working correctly after completion:

- ✅ All 11 tabs render without errors
- ✅ Keyboard navigation works throughout
- ✅ Focus indicators are visible
- ✅ Hover states and micro-interactions feel smooth
- ✅ Responsive layouts work (320px - 1920px)
- ✅ Loading states and error handling function correctly

---

## 📋 Pre-Testing Checklist

### Server Status

- [ ] Dev server running on <http://localhost:5175>
- [ ] Worker running on <http://localhost:8787>
- [ ] No console errors in browser DevTools
- [ ] No TypeScript errors (`npx tsc --noEmit`)

### Browser Setup

- [ ] Open Browser DevTools (F12)
- [ ] Open Console tab to check for errors
- [ ] Enable Responsive Design Mode (Ctrl+Shift+M / Cmd+Shift+M)
- [ ] Clear browser cache (Ctrl+Shift+Delete)

---

## 🧪 Testing Scenarios

### 1. Dashboard Tab (Phase 1.3.6 Enhanced)

#### Visual Inspection

- [ ] Dashboard loads without errors
- [ ] "Good Morning" greeting visible
- [ ] Alert summary shows (if any devices offline/low battery)
- [ ] 3 status cards show device counts
- [ ] Quick scenes section shows 4 scene cards
- [ ] Favorite devices section shows device cards

#### Keyboard Navigation

1. Press **Tab** repeatedly
   - [ ] Focus moves through NotificationBell, Plus button, scene cards, device cards
   - [ ] Blue focus ring visible on each element (`ring-2 ring-offset-2 ring-primary/50`)
   - [ ] No focus ring on mouse click (only keyboard)

2. Focus on a scene card, press **Enter** or **Space**
   - [ ] Scene activates
   - [ ] Toast notification appears ("Movie Time activated")
   - [ ] Scene card shows pulse animation briefly
   - [ ] Scene card shows ring-2 ring-primary when active

#### Hover States

1. Hover over scene cards
   - [ ] Card lifts with `shadow-md` (4px elevation)
   - [ ] Smooth 200ms transition
   - [ ] Background lightens slightly (`hover:bg-accent/5`)

2. Hover over device cards
   - [ ] Card lifts with `shadow-md`
   - [ ] Smooth transition

#### Micro-Interactions

1. Click Plus button
   - [ ] Button shrinks to 90% on press (`whileTap`)
   - [ ] Button grows to 105% on hover (`whileHover`)
   - [ ] Smooth spring animation

2. Click NotificationBell
   - [ ] Panel opens with smooth transition
   - [ ] Bell button is 44px × 44px (touch target compliant)

---

### 2. Rooms Tab (Phase 1.3.6 Enhanced)

#### Visual Inspection

- [ ] Rooms tab loads without errors
- [ ] 7 room cards visible (Living Room, Master Bedroom, Kitchen, etc.)
- [ ] Each card shows room name, device count, status badge

#### Keyboard Navigation

1. Press **Tab** to focus on room cards
   - [ ] Focus ring visible on Card (`focus-within:ring-2`)
   - [ ] Focus moves through all room cards
   - [ ] Enter/Space activates card (should expand or navigate)

#### Hover States

1. Hover over room cards
   - [ ] Card lifts with `shadow-md`
   - [ ] Background lightens (`hover:bg-accent/5`)
   - [ ] Smooth 200ms transition

#### Micro-Interactions

1. Click Plus button
   - [ ] Button shrinks on press
   - [ ] Button grows on hover

---

### 3. Scenes Tab (Phase 1.3.6 Enhanced)

#### Visual Inspection

- [ ] Scenes tab loads without errors
- [ ] 12+ scene cards visible (Good Morning, Movie Time, etc.)
- [ ] Scene cards show gradient backgrounds with icons
- [ ] Active scene shows blue ring (`ring-2 ring-primary`)

#### Keyboard Navigation

1. Press **Tab** to focus on scene cards
   - [ ] Focus ring visible (`focus-visible:ring-2 ring-offset-2`)
   - [ ] Enter/Space activates scene
   - [ ] Toast notification appears
   - [ ] Active scene shows blue ring for 2 seconds

#### Hover States

1. Hover over scene cards
   - [ ] Card lifts with `shadow-lg` (8px elevation)
   - [ ] Card moves up 4px (`whileHover={{ y: -4 }}`)
   - [ ] Smooth combined animation

#### Micro-Interactions

1. Click Plus button
   - [ ] Button shrinks/grows with smooth animation

2. Click scene card
   - [ ] Card shrinks to 95% on press (`whileTap={{ scale: 0.95 }}`)
   - [ ] Scene icon pulses when active
   - [ ] Activation feels responsive

---

### 4. Automations Tab (Phase 1.3.6 Enhanced)

#### Visual Inspection

- [ ] Automations tab loads without errors
- [ ] Tabs show: Rules, Flows (2 tabs)
- [ ] Rules tab shows list of automation cards
- [ ] Each card has Play and Edit buttons

#### Micro-Interactions

1. Hover over Play button
   - [ ] Button background changes
   - [ ] Smooth transition

2. Click Play button
   - [ ] Button shrinks to 90% (`whileTap={{ scale: 0.9 }}`)
   - [ ] Toast notification appears ("Running automation...")
   - [ ] Button animation feels snappy

3. Click Edit button
   - [ ] Button shrinks to 90%
   - [ ] Smooth animation

4. Toggle automation switch
   - [ ] Switch animates smoothly
   - [ ] Badge updates (Enabled/Disabled)
   - [ ] Toast notification appears

---

### 5. Security Tab (Phase 1.3.6 Enhanced)

#### Visual Inspection

- [ ] Security tab loads without errors
- [ ] Armed/Disarmed badge visible
- [ ] 3 stat cards show counts (Online, Recording, Alerts)
- [ ] Live Feeds tab shows camera cards (grid layout)

#### Hover States

1. Hover over camera cards
   - [ ] Card lifts with `shadow-lg` (8px elevation)
   - [ ] Background lightens (`hover:bg-accent/5`)
   - [ ] Smooth 200ms transition (`transition-all duration-200`)

2. Click camera card
   - [ ] Dialog opens with camera details
   - [ ] Modal animates smoothly (Framer Motion spring)

---

### 6. All Other Tabs (Basic Testing)

#### Energy Tab

- [ ] Energy tab loads without errors
- [ ] Charts render correctly (if implemented)
- [ ] Device list shows energy consumption

#### DeviceMonitor Tab

- [ ] Monitor tab loads without errors
- [ ] Device grid shows all devices
- [ ] Device status badges visible

#### UserManagement Tab

- [ ] Users tab loads without errors
- [ ] User list shows 5 users
- [ ] Role badges visible (Admin, Member, Guest)

#### InsightsDashboard Tab

- [ ] Insights tab loads without errors
- [ ] Placeholder content visible

#### BackupRecovery Tab

- [ ] Backup tab loads without errors
- [ ] Backup actions visible

#### DeviceSettings Tab

- [ ] Settings tab loads without errors
- [ ] Settings form visible

---

## 📱 Responsive Layout Testing

### Mobile (320px - 639px)

1. Switch to Responsive Design Mode
2. Set width to **375px** (iPhone standard)
   - [ ] Dashboard: 2 status columns, 2 scene columns
   - [ ] Rooms: 1 room column
   - [ ] Scenes: 1 scene column
   - [ ] Tab bar wraps or scrolls
   - [ ] Text doesn't overflow
   - [ ] Touch targets are 44px minimum

### Tablet (640px - 1023px)

1. Set width to **768px** (iPad standard)
   - [ ] Dashboard: 3 status columns, 2 scene columns
   - [ ] Rooms: 2 room columns
   - [ ] Scenes: 2 scene columns
   - [ ] Tab bar fits comfortably

### Desktop (1024px+)

1. Set width to **1920px** (Full HD)
   - [ ] Dashboard: 3 status columns, 4 scene columns
   - [ ] Rooms: 2 room columns
   - [ ] Scenes: 3 scene columns
   - [ ] No excessive whitespace

---

## 🎨 Animation Quality Testing

### Spring Animations

1. Navigate between tabs
   - [ ] Tab content fades in smoothly
   - [ ] Cards appear with stagger effect (0.1s delay)
   - [ ] Spring physics feel natural (`stiffness: 300, damping: 30`)

2. Activate scene
   - [ ] Scene card pulses (`scale: [1, 1.02, 1]`)
   - [ ] Icon rotates or animates
   - [ ] Animation repeats for 2 seconds

### CSS Transitions

1. Hover over interactive elements
   - [ ] All transitions are 200ms (`duration-200`)
   - [ ] No jank or stuttering
   - [ ] Smooth shadow lift

2. Focus with keyboard
   - [ ] Focus ring appears instantly
   - [ ] No transition delay on focus (accessibility requirement)

---

## ⌨️ Keyboard Accessibility Testing

### Tab Navigation

1. Click address bar, then press **Tab**
   - [ ] Focus enters page (skips to main content)
   - [ ] First focusable element receives focus
   - [ ] Tab order is logical (top to bottom, left to right)

2. Press **Tab** repeatedly through Dashboard
   - [ ] Focus order: NotificationBell → Plus → Scenes → Devices
   - [ ] No elements skipped
   - [ ] No focus traps

### Keyboard Activation

1. Focus on scene card, press **Enter**
   - [ ] Scene activates (same as click)

2. Focus on scene card, press **Space**
   - [ ] Scene activates (same as click)

3. Try **Shift+Tab** (reverse navigation)
   - [ ] Focus moves backward correctly

---

## 🔍 Browser DevTools Inspection

### Console Errors

1. Open Console tab in DevTools
   - [ ] No red errors
   - [ ] No yellow warnings (except known Vite HMR messages)
   - [ ] No 404 errors (missing resources)

### Network Tab

1. Open Network tab
   - [ ] All assets load successfully (200 status)
   - [ ] No failed requests
   - [ ] Bundle size reasonable (~250KB gzipped)

### Performance Tab

1. Record performance
   - [ ] 60fps animations (no frame drops)
   - [ ] No long tasks (>50ms)
   - [ ] First Contentful Paint <1 second

---

## 🐛 Error Handling Testing

### Loading States

1. Throttle network in DevTools (Slow 3G)
   - [ ] Skeleton loaders appear
   - [ ] No content flash (FOUC)
   - [ ] Spinners animate smoothly

2. Disable network, refresh page
   - [ ] Error boundary appears
   - [ ] "Unable to Load" message visible
   - [ ] Reload button works

### Error Boundaries

1. Open DevTools Console
2. Type: `throw new Error('Test error')`
   - [ ] Error boundary catches error
   - [ ] ErrorFallback component renders
   - [ ] "Reload Page" button visible
   - [ ] In dev mode, stack trace visible

---

## 📊 Test Results Template

### Summary

- **Total Tests**: 100+
- **Passed**: \_\_\_
- **Failed**: \_\_\_
- **Pass Rate**: \_\_\_%

### Critical Issues

1.
2.
3.

### Minor Issues

1.
2.
3.

### Observations

1.
2.
3.

---

## ✅ Acceptance Criteria

### Must Pass (Critical)

- [ ] All 11 tabs render without errors
- [ ] Keyboard navigation works on all interactive elements
- [ ] Focus indicators visible on keyboard focus
- [ ] No TypeScript or ESLint errors
- [ ] No console errors in browser

### Should Pass (Important)

- [ ] Hover states feel smooth and responsive
- [ ] Micro-interactions provide tactile feedback
- [ ] Responsive layouts work on all screen sizes
- [ ] Animations run at 60fps

### Nice to Have (Polish)

- [ ] Scene activation feels delightful
- [ ] Toast notifications are contextual and helpful
- [ ] Loading states prevent content flash
- [ ] Error boundaries provide recovery options

---

## 🚀 Quick Test Commands

### TypeScript Check

```powershell
npx tsc --noEmit
```

**Expected**: No errors

### ESLint Check

```powershell
npx eslint . --ext .ts,.tsx
```

**Expected**: No errors (or only markdown lint warnings)

### Build Test

```powershell
npm run build
```

**Expected**: Successful build, no errors

### Preview Production Build

```powershell
npm run preview
```

**Expected**: Production build runs on <http://localhost:4173>

---

## 📸 Visual Regression Testing (Manual)

### Take Screenshots

1. Dashboard - Desktop (1920px)
2. Dashboard - Mobile (375px)
3. Scenes - Active state
4. Scenes - Focus state (keyboard)
5. Rooms - Hover state
6. Security - Camera grid
7. Automations - Rules list
8. NotificationCenter - Open panel

### Compare with Documentation

- [ ] Screenshots match design in `docs/PHASE_1.3.6_FINAL_POLISH.md`
- [ ] Focus rings match specification (2px, primary/50)
- [ ] Shadows match elevation scale (sm/md/lg)

---

## 🎓 Testing Tips

### Keyboard Testing

- Use **only keyboard** for 5 minutes (don't touch mouse)
- Can you accomplish all tasks?
- Is focus always visible?

### Animation Testing

- Reduce motion in OS settings
- Do animations respect `prefers-reduced-motion`?
- Are animations smooth at 60fps?

### Accessibility Testing

- Install screen reader (NVDA on Windows, VoiceOver on Mac)
- Can you navigate with screen reader only?
- Are all interactive elements announced correctly?

### Performance Testing

- Open 10+ tabs in browser
- Does app still respond quickly?
- Check memory usage in DevTools Performance Monitor

---

## 📝 Report Issues

If you find bugs, document:

1. **What**: What broke? (e.g., "Scene card doesn't activate on Enter key")
2. **Where**: Which component? (e.g., "Scenes.tsx, line 245")
3. **How**: Steps to reproduce
4. **Expected**: What should happen?
5. **Actual**: What actually happens?
6. **Console**: Any errors in DevTools?

---

## 🏆 Success Criteria Met?

After completing all tests:

- [ ] **100% tabs render**: All 11 tabs load without errors
- [ ] **100% keyboard accessible**: All interactive elements reachable
- [ ] **100% focus visible**: Focus indicators on all elements
- [ ] **95%+ animations smooth**: No jank, 60fps
- [ ] **0 critical bugs**: No show-stoppers

**If all checked, Phase 1 is COMPLETE! 🎉**

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Status**: Ready for Testing
