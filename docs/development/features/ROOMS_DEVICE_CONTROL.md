# Rooms Tab - Enhanced Device Control UI

## Overview

The Rooms tab now features **highly interactive device cards** with clear visual feedback to make device control obvious and intuitive.

## Visual Design Changes

### Before (Subtle)

- Small device icons (14px)
- Minimal color difference between ON/OFF states
- No hover effects
- Not obvious they were clickable

### After (Enhanced) ✅

- **Larger icons** (16px) with fill/regular weight toggle
- **Clear borders** (2px) with color-coded states
- **Status indicator dot** in top-right corner
- **Hover effects** with scale animation and overlay hint
- **Color transitions** for ON (blue) vs OFF (gray) states

## Interactive Features

### Device Card States

#### 🟢 Device ON (Enabled)

```
- Border: Primary blue with 30% opacity
- Background: Primary blue with 10% opacity
- Icon: Filled style, primary blue color
- Status Dot: Solid primary blue
- Text: Primary blue, medium weight
```

#### ⚫ Device OFF (Disabled)

```
- Border: Border color with 50% opacity
- Background: Secondary gray with 50% opacity
- Icon: Regular style, muted foreground color
- Status Dot: Muted gray with 30% opacity
- Text: Muted foreground color
```

### Hover Effects

1. **Scale Animation**: Card scales up to 105% on hover
2. **Border Highlight**: Border opacity increases
3. **Background Brightening**: Background gets slightly brighter
4. **Overlay Hint**: Black overlay with "Turn On" or "Turn Off" text appears
5. **Icon Color Shift**: Slightly changes brightness

### Click/Tap Feedback

1. **Scale Down**: Card scales to 90% (Framer Motion `whileTap`)
2. **Spring Animation**: Bounces back with spring physics
3. **Toast Notification**: Success message shows device name and new state
4. **State Update**: Visual state updates immediately (optimistic UI)

## Device Card Anatomy

```
┌─────────────────────────┐
│ ●                    [●]│  ← Status indicator dot
│                         │
│      ╭─────╮            │
│      │ 💡 │            │  ← Icon (fill if ON, regular if OFF)
│      ╰─────╯            │
│                         │
│       Shelly            │  ← Device name (first word)
│                         │
│   [Turn Off overlay]    │  ← Hover hint
│                         │
└─────────────────────────┘
```

## User Interactions

### Toggle Device

**Action**: Click/tap on device card

**Flow**:

1. User hovers → Card scales up + shows "Turn On/Off" hint
2. User clicks → Card scales down briefly
3. State updates → Icon changes style (fill ↔ regular)
4. Colors transition → Blue (ON) ↔ Gray (OFF)
5. Toast shows → "Shelly Plus 1 turned on/off"

### Visual Feedback Timeline

```
0ms   - Hover starts
100ms - Scale animation completes
150ms - Overlay hint fades in

[CLICK]

0ms   - Scale down to 90%
150ms - Spring back to 100%
200ms - State update (icon + colors change)
300ms - Toast notification appears
```

## Accessibility Features

### Visual Indicators

- ✅ Status dot shows ON/OFF at a glance
- ✅ Color coding (blue = ON, gray = OFF)
- ✅ Icon weight change (fill = ON, regular = OFF)
- ✅ Hover hint text for clear action

### Interactive Feedback

- ✅ Cursor changes to pointer
- ✅ Scale animation on hover (indicates clickability)
- ✅ Tap animation on click (confirms input received)
- ✅ Toast notification (confirms action completed)
- ✅ Title attribute (tooltip shows on hover)

### Keyboard Support

- ⚠️ Currently mouse/touch only
- 🔜 Future: Add keyboard navigation (Tab + Enter/Space)

## Code Implementation

### Device Card Structure

```tsx
<motion.div
  whileTap={{ scale: 0.9 }}
  whileHover={{ scale: 1.05 }}
  className={`group relative cursor-pointer border-2 ${
    device.enabled
      ? 'border-primary/30 bg-primary/10 hover:border-primary/50'
      : 'border-border/50 bg-secondary/50 hover:border-border'
  }`}
  onClick={e => {
    e.stopPropagation()
    toggleDevice(device.id)
  }}
  title={`Click to turn ${device.enabled ? 'off' : 'on'}`}
>
  {/* Status Indicator */}
  <div
    className={`absolute right-1 top-1 h-1.5 w-1.5 rounded-full ${
      device.enabled ? 'bg-primary' : 'bg-muted-foreground/30'
    }`}
  />

  {/* Icon Container */}
  <div className={`h-8 w-8 rounded-full ${device.enabled ? 'bg-primary/20' : 'bg-muted'}`}>
    <IconComponent
      size={16}
      weight={device.enabled ? 'fill' : 'regular'}
      className={device.enabled ? 'text-primary' : 'text-muted-foreground'}
    />
  </div>

  {/* Device Name */}
  <span className={device.enabled ? 'text-primary' : 'text-muted-foreground'}>
    {device.name.split(' ')[0]}
  </span>

  {/* Hover Hint */}
  <div className="absolute inset-0 bg-black/0 opacity-0 group-hover:bg-black/5 group-hover:opacity-100">
    <span className="text-[10px]">{device.enabled ? 'Turn Off' : 'Turn On'}</span>
  </div>
</motion.div>
```

### Toggle Function

```typescript
const toggleDevice = (deviceId: string) => {
  const device = devices.find(d => d.id === deviceId)

  // Update KV store
  setDevices(prevDevices =>
    prevDevices.map(d => (d.id === deviceId ? { ...d, enabled: !d.enabled } : d))
  )

  // Show feedback
  toast.success(`${device?.name} turned ${device?.enabled ? 'off' : 'on'}`)
}
```

## Device Discovery Flow

### Newly Discovered Devices

**Location**: "Recently Discovered Devices" section (top of Rooms tab)

**Appearance**:

- Blue highlighted card with "New" badge
- Border: `border-primary/50` (stronger than regular)
- Background: `bg-primary/5` (subtle blue tint)
- No device cards shown yet (not assigned to room)

**Actions**:

- Click "Assign Room" button → Dialog opens
- Select room from dropdown
- Device moves to assigned room card
- Now appears in room's device grid

### Assigned Devices

**Location**: Inside room cards in "All Rooms" section

**Appearance**:

- 4x device grid at bottom of room card
- Shows up to 4 devices, "+X" indicator if more
- Interactive cards with hover/click animations
- Color-coded by state (ON/OFF)

**Actions**:

- Click device card → Toggles ON/OFF
- Visual state updates immediately
- Toast notification confirms action

## Testing the UI

### Visual Test

1. Navigate to Rooms tab
2. Find a room card with devices (e.g., Living Room)
3. **Hover** over device card → Should see:
   - Card scales up slightly
   - Border gets brighter
   - "Turn On/Off" hint appears
4. **Click** device card → Should see:
   - Card scales down briefly
   - Icon changes from regular ↔ fill
   - Colors transition blue ↔ gray
   - Toast notification appears

### Functional Test

1. Click device card (turn ON)
   - ✅ Icon should fill in
   - ✅ Colors turn blue
   - ✅ Status dot turns blue
   - ✅ Toast: "Device turned on"

2. Click again (turn OFF)
   - ✅ Icon returns to regular style
   - ✅ Colors turn gray
   - ✅ Status dot turns gray/transparent
   - ✅ Toast: "Device turned off"

3. Refresh page
   - ✅ Device state persists (KV store)
   - ✅ Visual state matches KV state

## Browser Compatibility

### Supported Features

- ✅ Framer Motion animations (all modern browsers)
- ✅ Tailwind transitions (all browsers)
- ✅ Group hover states (all modern browsers)
- ✅ `backdrop-blur` effects (95%+ browsers)

### Fallbacks

- Older browsers: Animations degrade gracefully
- No JavaScript: Cards still visible (no interaction)
- No touch: Hover states work with mouse

## Future Enhancements

### Short Term

- [ ] Add loading spinner during state change
- [ ] Add error state if toggle fails
- [ ] Show device status (online/offline) in card

### Medium Term

- [ ] Long-press for device settings menu
- [ ] Drag-and-drop to reorder devices
- [ ] Keyboard navigation support

### Long Term

- [ ] Real-time status updates via MQTT
- [ ] Device control history
- [ ] Custom animations per device type

## Related Components

- **Dashboard**: Also has device controls (for favorites)
- **Device Monitor**: Shows all devices with detailed status
- **Device Settings**: Configure device properties

## Summary

The Rooms tab now features **highly interactive, visually clear device cards** that make it obvious devices can be controlled:

✅ **Visual Clarity**: Clear ON/OFF states with color coding
✅ **Interactive Feedback**: Hover effects + scale animations
✅ **Action Hints**: "Turn On/Off" overlay on hover
✅ **Immediate Response**: Optimistic UI updates + toast notifications
✅ **Status Indicators**: Small dots show state at a glance

**No more confusion** - users can clearly see and control their devices! 🎉
