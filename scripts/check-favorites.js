#!/usr/bin/env node

/**
 * Diagnostic script to check favorites data consistency
 * Run this to see what's stored in localStorage vs what Dashboard sees
 */

console.log('🔍 Favorites Diagnostic Script\n')
console.log('='.repeat(60))
console.log('\n📋 Instructions:')
console.log('1. Open your browser console (F12)')
console.log('2. Copy and paste this code:\n')

const checkScript = `
// Check favorites
console.log('\\n🔍 FAVORITES DIAGNOSTIC');
console.log('='.repeat(60));

const favorites = localStorage.getItem('kv:favorite-devices');
const devices = localStorage.getItem('kv:devices');

console.log('\\n1️⃣ Raw localStorage data:');
console.log('Favorites:', favorites);
console.log('Devices count:', devices ? JSON.parse(devices).length : 0);

if (favorites) {
  try {
    const favArray = JSON.parse(favorites);
    console.log('\\n2️⃣ Parsed favorites:');
    console.log('Type:', Array.isArray(favArray) ? 'Array ✓' : 'NOT ARRAY ✗');
    console.log('Count:', favArray.length);
    console.log('IDs:', favArray);

    if (devices) {
      const deviceArray = JSON.parse(devices);
      const deviceIds = deviceArray.map(d => d.id);

      console.log('\\n3️⃣ Matching check:');
      console.log('Total devices:', deviceArray.length);
      console.log('Device IDs (first 5):', deviceIds.slice(0, 5));

      const matches = favArray.filter(id => deviceIds.includes(id));
      const nonMatches = favArray.filter(id => !deviceIds.includes(id));

      console.log('\\n4️⃣ Results:');
      console.log('✓ Matching favorites:', matches.length);
      console.log('✗ Non-matching favorites:', nonMatches.length);

      if (nonMatches.length > 0) {
        console.log('\\n⚠️ PROBLEM FOUND: These favorite IDs don\\'t match any devices:');
        console.log(nonMatches);
        console.log('\\n🔧 FIX: Run this to reset favorites to first 4 devices:');
        console.log('localStorage.setItem("kv:favorite-devices", JSON.stringify(' + JSON.stringify(deviceIds.slice(0, 4)) + '));');
        console.log('\\nThen refresh the page.');
      } else if (matches.length === 0) {
        console.log('\\n⚠️ PROBLEM: No favorites set!');
        console.log('\\n🔧 FIX: Run this to add first 4 devices:');
        console.log('localStorage.setItem("kv:favorite-devices", JSON.stringify(' + JSON.stringify(deviceIds.slice(0, 4)) + '));');
        console.log('\\nThen refresh the page.');
      } else {
        console.log('\\n✅ All favorites match! Should show in Dashboard.');
        console.log('\\n🔍 If still not showing, check:');
        console.log('1. Browser console for Dashboard debug logs');
        console.log('2. React component is rendering (no errors)');
        console.log('3. favoriteDeviceList.length > 0 in Dashboard logs');
      }

      // Show the actual favorite devices
      const favoriteDevices = deviceArray.filter(d => favArray.includes(d.id));
      console.log('\\n5️⃣ Your favorite devices:');
      favoriteDevices.forEach((d, i) => {
        console.log(\`  \${i + 1}. \${d.name} (ID: \${d.id}, Type: \${d.type})\`);
      });
    }
  } catch (e) {
    console.error('\\n❌ Error parsing data:', e);
  }
} else {
  console.log('\\n⚠️ No favorites found in localStorage!');

  if (devices) {
    const deviceArray = JSON.parse(devices);
    const deviceIds = deviceArray.map(d => d.id);
    console.log('\\n🔧 FIX: Run this to add first 4 devices as favorites:');
    console.log('localStorage.setItem("kv:favorite-devices", JSON.stringify(' + JSON.stringify(deviceIds.slice(0, 4)) + '));');
    console.log('\\nThen refresh the page.');
  }
}

console.log('\\n' + '='.repeat(60));
`

console.log(checkScript)
console.log('\n' + '='.repeat(60))
console.log('\n✅ Copy the entire code block above and paste it in your browser console!')
console.log('It will diagnose the issue and give you a fix command if needed.\n')
