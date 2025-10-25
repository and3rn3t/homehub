# HomeHub Keyboard Shortcuts Reference

**Version**: 1.0
**Last Updated**: October 16, 2025
**WCAG Compliance**: 2.1.1 Keyboard (Level A)

---

## Overview

HomeHub is fully keyboard accessible, allowing users to navigate and control all features without a mouse. This guide documents all keyboard shortcuts and navigation patterns.

---

## Global Navigation

### Basic Movement

| Key             | Action                               | Context              |
| --------------- | ------------------------------------ | -------------------- |
| **Tab**         | Move focus to next element           | Always available     |
| **Shift + Tab** | Move focus to previous element       | Always available     |
| **Enter**       | Activate focused button/link/control | Interactive elements |
| **Space**       | Activate focused button/control      | Interactive elements |
| **Escape**      | Close modal/dialog                   | When modal is open   |

### Skip Links

| Key Sequence           | Action                                                |
| ---------------------- | ----------------------------------------------------- |
| **Tab** (on page load) | Reveal "Skip to main content" link                    |
| **Enter**              | Jump directly to Dashboard content (bypasses 11 tabs) |

**Benefit**: Saves 10-15 tab stops when navigating to main content.

---

## Dashboard

### Status Cards

| Key                    | Action                                       |
| ---------------------- | -------------------------------------------- |
| **Tab**                | Navigate between Online/Offline/Alerts cards |
| **Enter** or **Space** | (Currently read-only, no action)             |

**Note**: Status cards are marked with `role="status"` for screen readers and announce device counts dynamically.

### Device Cards

| Key                    | Action                        | Example                |
| ---------------------- | ----------------------------- | ---------------------- |
| **Tab**                | Navigate between device cards | Focus next device      |
| **Enter** or **Space** | Open device control panel     | Show advanced controls |

**ARIA Support**: Each card announces device name, status, and action (e.g., "Living Room Light - online - Click to open advanced controls").

### Favorite Devices Panel

| Key                    | Action                                 |
| ---------------------- | -------------------------------------- |
| **Tab**                | Navigate between favorite device cards |
| **Enter** or **Space** | Toggle device on/off                   |
| **Tab**                | Access "Show All Devices" button       |

---

## Color Wheel Picker

When focused on the color wheel (inside device control panel):

### Hue Adjustment

| Key             | Action                           | Increment  |
| --------------- | -------------------------------- | ---------- |
| **Right Arrow** | Increase hue (clockwise)         | +5 degrees |
| **Left Arrow**  | Decrease hue (counter-clockwise) | -5 degrees |

**Range**: 0-360 degrees (wraps at boundaries)

### Saturation Adjustment

| Key            | Action                           | Increment |
| -------------- | -------------------------------- | --------- |
| **Up Arrow**   | Increase saturation (more vivid) | +5%       |
| **Down Arrow** | Decrease saturation (more muted) | -5%       |

**Range**: 0-100%

### Brightness Adjustment

| Key             | Action              | Increment |
| --------------- | ------------------- | --------- |
| **+** or **=**  | Increase brightness | +5%       |
| **-** or **\_** | Decrease brightness | -5%       |

**Range**: 0-100%

### Tips

- **Hold key**: Repeat adjustments quickly
- **Fine control**: Use 5-unit increments for precise adjustments
- **Visual feedback**: Color updates in real-time
- **Screen reader**: Announces current HSV values

**Example Workflow**:

1. Tab to color wheel
2. Press **Right Arrow** 10 times → Hue increases by 50°
3. Press **Up Arrow** 5 times → Saturation increases by 25%
4. Press **+** 3 times → Brightness increases by 15%

---

## Rooms

### Room Cards

| Key                                              | Action                      |
| ------------------------------------------------ | --------------------------- |
| **Tab**                                          | Navigate between room cards |
| **(Planned)** Enter/Space to expand room details |

### Room Templates (Create Room)

| Key                    | Action                          | Example                             |
| ---------------------- | ------------------------------- | ----------------------------------- |
| **Tab**                | Navigate between room templates | Living Room → Bedroom → Kitchen     |
| **Enter** or **Space** | Create room from template       | Create "Living Room" with 3 devices |

**Templates Available**:

- Living Room (Sofa icon)
- Bedroom (Bed icon)
- Kitchen (Chef hat icon)
- Bathroom (Droplet icon)
- Office (Briefcase icon)
- Garage (Car icon)

---

## Settings

### Accessibility Tab

Navigate to Settings → Accessibility:

| Key                    | Action                           | Control                        |
| ---------------------- | -------------------------------- | ------------------------------ |
| **Tab**                | Move to Colorblind Mode dropdown | Select menu                    |
| **Enter** or **Space** | Open dropdown                    | Show 5 modes                   |
| **Up/Down Arrow**      | Navigate mode options            | Default → Red-Green Safe → ... |
| **Enter**              | Select mode                      | Apply new palette              |
| **Tab**                | Move to High Contrast toggle     | Switch control                 |
| **Space**              | Toggle high contrast on/off      | Enable/disable                 |

**Colorblind Modes**:

1. Default
2. Red-Green Safe (Protanopia/Deuteranopia)
3. Blue-Yellow Safe (Tritanopia)
4. Monochrome (Achromatopsia)
5. High Contrast (Low vision)

---

## Keyboard-Only Navigation Tips

### Best Practices

1. **Use Tab liberally**: Don't try to remember positions, just Tab through
2. **Watch for focus rings**: Blue outline shows current position
3. **Use skip links**: Save time by skipping navigation
4. **Arrow keys in pickers**: Color wheel, sliders, dropdowns
5. **Enter vs Space**: Generally interchangeable for activation

### Common Patterns

**Opening a device**:

1. Tab to Dashboard
2. Tab to target device card
3. Press Enter → Control panel opens
4. Tab to color wheel
5. Use arrow keys to adjust color
6. Tab to brightness slider
7. Use arrow keys to adjust brightness
8. Press Escape → Panel closes

**Changing colorblind mode**:

1. Tab to Settings (or Alt+, on some systems)
2. Tab to Accessibility tab
3. Tab to Colorblind Mode dropdown
4. Press Enter → Dropdown opens
5. Use arrow keys → Select mode
6. Press Enter → Mode applies

**Creating a room**:

1. Tab to Rooms section
2. Tab to "Living Room" template
3. Press Enter → Room created
4. (Future: Edit room name, add devices)

---

## Accessibility Features

### Screen Reader Support

**Tested with**:

- VoiceOver (macOS/iOS)
- NVDA (Windows)
- JAWS (Windows)

**Key announcements**:

- "27 devices online, status" (status cards)
- "Living Room Light - online - Click to open advanced controls" (device cards)
- "Activate Movie Time scene" (scene buttons)
- "Color picker showing #FF5733. Use arrow keys to adjust hue and saturation..." (color wheel)

### Reduced Motion

HomeHub respects system-level motion preferences:

**macOS**: System Settings → Accessibility → Display → Reduce Motion
**Windows**: Settings → Ease of Access → Display → Show animations
**iOS**: Settings → Accessibility → Motion → Reduce Motion

When enabled:

- ✅ Spring animations disabled
- ✅ Framer Motion transitions set to 0.01ms
- ✅ CSS transitions minimized
- ✅ Full functionality preserved

### High Contrast Mode

Enable in Settings → Accessibility → High Contrast Mode:

**Visual changes**:

- Pure white cards (light mode) or very dark cards (dark mode)
- Nearly black text (light) or nearly white text (dark)
- 2px borders (vs 1px default)
- 10:1+ contrast ratio (WCAG AAA)
- Glass effects removed for clarity

**Compatible with**:

- ✅ All colorblind modes
- ✅ Reduced motion
- ✅ Screen readers
- ✅ Keyboard navigation

---

## Troubleshooting

### Focus Not Visible

**Issue**: Can't see where I am when pressing Tab

**Solution**:

1. Enable High Contrast Mode (Settings → Accessibility)
2. Check browser zoom level (Cmd+0 to reset)
3. Update browser to latest version

### Keyboard Shortcuts Not Working

**Issue**: Enter/Space doesn't activate elements

**Solution**:

1. Ensure element is focused (blue outline visible)
2. Try both Enter and Space (some elements prefer one)
3. Check if modal is open (Escape to close)
4. Refresh page (Cmd+R or F5)

### Color Wheel Not Responding

**Issue**: Arrow keys don't change color

**Solution**:

1. Tab to color wheel (must be focused)
2. Look for focus ring around wheel
3. Try clicking wheel once to ensure focus
4. Check if device control panel is open

### Skip Link Not Appearing

**Issue**: Tab doesn't show skip link

**Solution**:

1. Refresh page and press Tab immediately
2. Try Shift+Tab if you've tabbed past it
3. Check browser zoom level (100% recommended)
4. Enable High Contrast Mode for better visibility

---

## Future Enhancements

Planned keyboard shortcuts (not yet implemented):

| Shortcut           | Action                          | Status  |
| ------------------ | ------------------------------- | ------- |
| **Cmd/Ctrl + /**   | Show keyboard shortcuts modal   | Planned |
| **Cmd/Ctrl + K**   | Quick search/command palette    | Planned |
| **1-9**            | Jump to tab 1-9                 | Planned |
| **Cmd/Ctrl + [/]** | Navigate tabs left/right        | Planned |
| **Home/End**       | Jump to first/last item in list | Planned |
| **Page Up/Down**   | Scroll by page in long lists    | Planned |

---

## Related Documentation

- [ACCESSIBILITY_IMPLEMENTATION_COMPLETE.md](../development/ACCESSIBILITY_IMPLEMENTATION_COMPLETE.md) - Full implementation details
- [UI_UX_ACCESSIBILITY_AUDIT.md](../development/UI_UX_ACCESSIBILITY_AUDIT.md) - Original audit
- [HIGH_CONTRAST_AND_SKIP_LINKS_IMPLEMENTATION.md](../development/HIGH_CONTRAST_AND_SKIP_LINKS_IMPLEMENTATION.md) - Technical docs
- [COLORBLIND_MODE_IMPLEMENTATION.md](../development/COLORBLIND_MODE_IMPLEMENTATION.md) - Colorblind mode guide

---

## Feedback

If you encounter keyboard navigation issues or have suggestions for new shortcuts:

1. Open an issue on GitHub
2. Include browser and OS information
3. Describe expected vs actual behavior
4. Note if you're using assistive technologies

**Accessibility is a priority** - we're committed to making HomeHub usable by everyone.

---

**Document Status**: Production Ready
**Tested With**: Chrome 120+, Safari 17+, Firefox 121+, Edge 120+
**Last Verified**: October 16, 2025
