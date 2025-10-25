# Testing & Integration Guide - Advanced Hue Controls

**Date**: October 11, 2025
**Status**: 🧪 Testing Phase
**Browser**: <http://localhost:5173>

---

## 🎯 Step 1: Test Components in Isolation

### Access Test Page

1. **Open Browser**: <http://localhost:5173> (already open)
2. **Navigate to Settings Tab** (bottom navigation, far right)
3. **Click "Test Controls"** tab (in the settings sub-tabs)

You should now see the **Test Advanced Controls** page with all 3 components.

---

### Testing Checklist

#### ✅ Color Wheel Picker

**Test Actions**:

- [ ] Click anywhere on the color wheel
- [ ] Drag across the wheel to select multiple colors
- [ ] Click each of the 9 preset buttons (red, orange, yellow, green, cyan, blue, indigo, magenta, white)
- [ ] Verify indicator dot moves smoothly to selected position
- [ ] Check that hex display updates (#RRGGBB format)
- [ ] Verify HSV values update (H: 0-360°, S: 0-100%, V: 0-100%)
- [ ] Click "Enable Disabled State" and verify wheel grays out
- [ ] Re-enable and test again

**Expected Behavior**:

- Toast notification appears on color change
- Indicator dot follows cursor with spring animation
- Preset buttons have hover effects and scale on click
- Hex value matches visual selection
- HSV coordinates are technically accurate

---

#### ✅ Brightness Slider

**Test Actions**:

- [ ] Drag slider from 0% to 100%
- [ ] Verify gradient background is visible (dark → light)
- [ ] Check progress bar animates below slider (yellow → white)
- [ ] Test edge cases: 0% and 100%
- [ ] Click "Test Loading State" and verify loading indicator (⋯) appears
- [ ] Click "Enable Disabled State" and verify slider is disabled
- [ ] Use keyboard arrows to adjust value

**Expected Behavior**:

- Percentage display updates in real-time
- Progress bar width matches slider position
- Toast appears at 0% and 100%
- Loading indicator shows when isUpdating=true
- Smooth spring animations on changes

---

#### ✅ Color Temperature Slider

**Test Actions**:

- [ ] Drag slider from 2000K (warm) to 6500K (cool)
- [ ] Verify gradient shows orange → yellow → blue spectrum
- [ ] Check labels "Warm (2000K)" and "Cool (6500K)" are visible
- [ ] Verify color dots appear next to labels (🔶 orange, 🔷 blue)
- [ ] Test edge cases: 2000K and 6500K
- [ ] Click "Test Loading State" and verify loading indicator
- [ ] Click "Simulate API Call" to test 2-second loading state
- [ ] Use keyboard to adjust in 100K increments

**Expected Behavior**:

- Kelvin display updates (2000K-6500K range)
- Progress bar gradient matches slider position
- Toast appears at extremes (2000K, 6500K)
- 100K step size feels responsive
- Smooth transitions between temperatures

---

#### ✅ Interactive Test Controls

**Test Buttons**:

- [ ] **Test Loading State** - Toggles isUpdating prop
- [ ] **Enable Disabled State** - Toggles disabled prop on all controls
- [ ] **Simulate API Call** - Shows loading toast for 2 seconds
- [ ] **Reset Values** - Returns to defaults (color=#FF5500, brightness=75%, temp=3000K)

**Current Values Display**:

- [ ] Verify all 3 values update in real-time
- [ ] Color swatch shows correct color
- [ ] Values match component displays

---

## 🎯 Step 2: Integration into DeviceControlPanel

Once all tests pass, integrate the components:

### 2.1 Replace Brightness Slider

**File**: `src/components/DeviceControlPanel.tsx`

**Find** (around line 315):

```tsx
{/* Brightness Control */}
{hasBrightness && (
  <motion.div ...>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <SunRoomIcon className="h-5 w-5" />
        <Label className="text-base">Brightness</Label>
      </div>
      <span ...>{brightness}%</span>
    </div>
    <Slider
      value={[brightness]}
      onValueChange={handleBrightnessChange}
      ...
    />
  </motion.div>
)}
```

**Replace with**:

```tsx
{
  /* Enhanced Brightness Control */
}
{
  hasBrightness && (
    <BrightnessSlider
      value={brightness}
      onChange={async value => {
        await handleBrightnessChange([value])
      }}
      isUpdating={isUpdating}
      disabled={!device.enabled || device.status === 'offline'}
    />
  )
}
```

---

### 2.2 Replace Color Temperature Slider

**Find** (around line 420):

```tsx
{/* Color Temperature Control */}
{hasColorTemp && (
  <motion.div ...>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <ThermometerIcon className="h-5 w-5" />
        <Label className="text-base">Color Temperature</Label>
      </div>
      <span ...>{colorTemp}K</span>
    </div>
    <Slider
      value={[colorTemp]}
      onValueChange={handleColorTempChange}
      min={2000}
      max={6500}
      ...
    />
    <div className="text-muted-foreground flex justify-between text-xs">
      <span>Warm (2000K)</span>
      <span>Cool (6500K)</span>
    </div>
  </motion.div>
)}
```

**Replace with**:

```tsx
{
  /* Enhanced Color Temperature Control */
}
{
  hasColorTemp && (
    <ColorTemperatureSlider
      value={colorTemp}
      onChange={async kelvin => {
        await handleColorTempChange([kelvin])
      }}
      isUpdating={isUpdating}
      disabled={!device.enabled || device.status === 'offline'}
    />
  )
}
```

---

### 2.3 Add Color Wheel Picker

**Find** (around line 340 - Color Control section):

```tsx
{/* Color Control */}
{hasColor && (
  <motion.div ...>
    <div className="flex items-center gap-2">
      <Palette className="h-5 w-5" />
      <Label className="text-base">Color</Label>
    </div>
    <div className="flex gap-3">
      <div className="relative flex-1">
        <Input
          type="text"
          value={colorHex}
          onChange={...}
          ...
        />
        ...
      </div>
      <Input
        type="color"
        value={colorHex}
        onChange={...}
        ...
      />
    </div>
    <div className="flex gap-2">
      {/* Preset buttons */}
    </div>
  </motion.div>
)}
```

**Wrap in Tabs**:

```tsx
{/* Enhanced Color Control */}
{hasColor && (
  <motion.div ...>
    <Tabs defaultValue="quick" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          <Label className="text-base">Color</Label>
        </div>
        <TabsList className="h-8">
          <TabsTrigger value="quick" className="h-7 text-xs">
            Quick
          </TabsTrigger>
          <TabsTrigger value="wheel" className="h-7 text-xs">
            Wheel
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="quick" className="mt-0 space-y-3">
        {/* Existing hex input + presets */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Input
              type="text"
              value={colorHex}
              onChange={e => setColorHex(e.target.value.toUpperCase())}
              onBlur={() => handleColorChange(colorHex)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleColorChange(colorHex)
              }}
              placeholder="#FFFFFF"
              maxLength={7}
              disabled={!device.enabled || device.status === 'offline' || isUpdating}
              className="pr-12 font-mono"
            />
            <div
              className="absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2 rounded border-2 border-border"
              style={{ backgroundColor: colorHex }}
              aria-label="Current color preview"
            />
          </div>
          <Input
            type="color"
            value={colorHex}
            onChange={e => {
              setColorHex(e.target.value.toUpperCase())
              handleColorChange(e.target.value.toUpperCase())
            }}
            disabled={!device.enabled || device.status === 'offline' || isUpdating}
            className="h-10 w-16 cursor-pointer p-1"
          />
        </div>
        <div className="flex gap-2">
          {[
            '#FF0000',
            '#FF8800',
            '#FFFF00',
            '#00FF00',
            '#0088FF',
            '#4400FF',
            '#FF00FF',
          ].map(color => (
            <button
              key={color}
              type="button"
              onClick={() => {
                setColorHex(color)
                handleColorChange(color)
              }}
              disabled={!device.enabled || device.status === 'offline' || isUpdating}
              className="h-8 w-8 rounded-full ring-2 ring-border transition-all hover:scale-110 hover:ring-primary hover:ring-offset-2 disabled:opacity-50 disabled:hover:scale-100"
              style={{ backgroundColor: color }}
              title={color}
              aria-label={`Set color to ${color}`}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="wheel" className="mt-0">
        <ColorWheelPicker
          value={colorHex}
          onChange={(hex) => {
            setColorHex(hex)
            handleColorChange(hex)
          }}
          disabled={!device.enabled || device.status === 'offline' || isUpdating}
        />
      </TabsContent>
    </Tabs>
  </motion.div>
)}
```

---

## 🎯 Step 3: Test with Real Hue Devices

After integration, test with your 22 Hue lights:

### Single Device Test

1. Open DeviceControlPanel for any Hue light
2. Test brightness slider (0-100%)
3. Test color wheel picker (select various colors)
4. Test color temperature (2000K-6500K)
5. Verify response times (<500ms)
6. Check toast notifications appear
7. Confirm device state updates correctly

### Multi-Device Test

1. Test 5+ lights simultaneously
2. Verify no command conflicts
3. Check response times remain fast
4. Confirm all devices update independently

### Room Group Test (Future Feature)

1. Select entire room
2. Apply single color/brightness to all lights
3. Verify batch commands work
4. Check success rate

---

## 📊 Success Criteria

### Component Tests ✅

- [ ] Color wheel responds to click/drag
- [ ] Brightness slider has visible gradient
- [ ] Color temp slider shows warm-cool spectrum
- [ ] All animations are smooth (60fps)
- [ ] Loading states work correctly
- [ ] Disabled states prevent interaction
- [ ] Toast notifications appear appropriately

### Integration Tests ⏳

- [ ] All 3 components integrate without errors
- [ ] Hue API calls work (setBrightness, setColor, setColorTemperature)
- [ ] Response times <500ms
- [ ] State persists after changes
- [ ] UI updates match device state
- [ ] Error handling works (offline devices, API failures)

### Hardware Tests ⏳

- [ ] Tested with 10+ Hue lights
- [ ] 99%+ success rate over 1 hour
- [ ] No crashes or memory leaks
- [ ] Smooth experience on mobile/desktop

---

## 🚀 Next Steps After Integration

1. **Group Controls** (2-3 hours)
   - Add "Control All in Room" button
   - Implement batch API calls
   - Show progress for multiple devices

2. **Scene Activation** (1-2 hours)
   - One-click scene execution
   - Apply colors/brightness from scenes
   - Status feedback

3. **7-Day Stability Monitoring**
   - Daily usage tracking
   - API call logging
   - Success rate metrics

---

## 📝 Notes

- **Inline Styles**: Some inline styles (backgroundColor) are necessary for dynamic colors - safe to ignore linting warnings
- **Component Independence**: All 3 components work standalone and don't depend on each other
- **Performance**: Canvas rendering is optimized for one-time draw, no animation loops
- **Accessibility**: All components have ARIA labels and keyboard support
- **Type Safety**: 100% TypeScript coverage with strict mode

---

**Status**: ✅ Ready for Browser Testing
**Next**: Complete testing checklist, then integrate into DeviceControlPanel
