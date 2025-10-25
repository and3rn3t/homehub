#!/usr/bin/env node

/**
 * Device Persistence Test
 *
 * Tests that discovered devices persist in KV store across page refreshes
 *
 * Usage: node scripts/test-persistence.js
 */

console.log('🧪 Device Persistence Test\n')
console.log('='.repeat(60))

console.log('\n📋 Test Instructions:\n')

console.log('1️⃣  BEFORE REFRESH - Check Current State:')
console.log('   • Open http://localhost:5173 in browser')
console.log('   • Navigate to Rooms tab')
console.log('   • Find your discovered device in Living Room card')
console.log('   • Note the device state (ON or OFF)')
console.log('   • Open DevTools (F12) → Console')
console.log('   • Run: localStorage.getItem("devices")')
console.log('   • Copy the output to a text file\n')

console.log('2️⃣  REFRESH TEST:')
console.log('   • Press F5 to refresh the page')
console.log('   • Wait for app to fully reload')
console.log('   • Navigate to Rooms tab again')
console.log('   ✅ CHECK: Device still in Living Room card?')
console.log('   ✅ CHECK: Device state (ON/OFF) preserved?')
console.log('   ✅ CHECK: Device details (name, icon) correct?\n')

console.log('3️⃣  VERIFY KV STORE:')
console.log('   • In DevTools Console, run again:')
console.log('   • localStorage.getItem("devices")')
console.log('   • Compare with pre-refresh output')
console.log('   ✅ CHECK: JSON data identical?')
console.log('   ✅ CHECK: Device ID matches?')
console.log('   ✅ CHECK: Room assignment preserved?\n')

console.log('4️⃣  DEVICE MONITOR CHECK:')
console.log('   • Navigate to Device Monitor tab')
console.log('   ✅ CHECK: Discovered device appears in list?')
console.log('   ✅ CHECK: Status shows "online"?')
console.log('   ✅ CHECK: Room shows "Living Room"?\n')

console.log('5️⃣  TOGGLE STATE PERSISTENCE:')
console.log('   • Go back to Rooms tab')
console.log('   • Click device icon to toggle state')
console.log('   • Note new state (ON → OFF or OFF → ON)')
console.log('   • Refresh page (F5)')
console.log('   • Navigate to Rooms tab')
console.log('   ✅ CHECK: New state persisted?\n')

console.log('6️⃣  BROWSER RESTART TEST:')
console.log('   • Close the browser tab completely')
console.log('   • Open a new tab')
console.log('   • Navigate to http://localhost:5173')
console.log('   • Go to Rooms tab')
console.log('   ✅ CHECK: Device still exists?')
console.log('   ✅ CHECK: State still preserved?\n')

console.log('7️⃣  CROSS-TAB SYNC TEST:')
console.log('   • Open http://localhost:5173 in Tab 1')
console.log('   • Open http://localhost:5173 in Tab 2')
console.log('   • In Tab 1: Toggle device state')
console.log('   • In Tab 2: Refresh page')
console.log('   ✅ CHECK: State syncs to Tab 2?\n')

console.log('='.repeat(60))
console.log('\n📊 Expected Results:\n')

console.log('✅ PASS Criteria:')
console.log('   • Device persists after F5 refresh')
console.log('   • Device persists after browser restart')
console.log('   • Device state (ON/OFF) persists')
console.log('   • Room assignment persists')
console.log('   • Device visible in all tabs (Rooms, Monitor)')
console.log('   • KV store data unchanged')
console.log('   • Cross-tab sync works (with manual refresh)\n')

console.log('❌ FAIL Criteria:')
console.log('   • Device disappears after refresh')
console.log('   • State resets to default')
console.log('   • Room changes back to "Unassigned"')
console.log('   • KV store data lost')
console.log('   • Cross-tab state desync\n')

console.log('='.repeat(60))
console.log('\n🔍 Debugging Tips:\n')

console.log('If device disappears:')
console.log('   1. Check localStorage in DevTools → Application')
console.log('   2. Verify "devices" key exists')
console.log('   3. Check if data is valid JSON')
console.log('   4. Look for console errors during load\n')

console.log('If state resets:')
console.log('   1. Verify useKV hook is reading from correct key')
console.log('   2. Check if device.enabled property exists')
console.log('   3. Ensure optimistic updates are working')
console.log('   4. Check if debounce is saving to KV store\n')

console.log('='.repeat(60))
console.log('\n📝 Record Your Results:\n')

console.log('Test 6.1 - Refresh Page:          [ ] PASS  [ ] FAIL')
console.log('Test 6.2 - Device Exists:         [ ] PASS  [ ] FAIL')
console.log('Test 6.3 - State Persists:        [ ] PASS  [ ] FAIL')
console.log('Test 6.4 - Device Monitor:        [ ] PASS  [ ] FAIL')
console.log('Test 6.5 - Toggle Persists:       [ ] PASS  [ ] FAIL')
console.log('Test 6.6 - Browser Restart:       [ ] PASS  [ ] FAIL')
console.log('Test 6.7 - Cross-Tab Sync:        [ ] PASS  [ ] FAIL')

console.log('\n='.repeat(60))
console.log('\n✨ Ready to test! Follow the steps above.\n')
