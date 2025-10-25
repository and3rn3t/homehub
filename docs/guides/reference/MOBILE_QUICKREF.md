# Mobile-Friendly Quick Reference

**Quick Guide** for making HomeHub components mobile-friendly on iOS.

## Safe Area Classes (Use These!)

### Bottom Navigation / Tab Bars

```tsx
<div className="safe-bottom fixed bottom-0">
  {/* Content automatically clears home indicator */}
</div>
```

### Top Headers / Modals

```tsx
<div className="safe-top fixed top-0">
  {/* Content automatically avoids notch/Dynamic Island */}
</div>
```

### Horizontal Content Padding

```tsx
<div className="safe-x px-4">{/* Adds padding for side safe areas + your custom padding */}</div>
```

### All Sides

```tsx
<div className="safe-all p-6">{/* Full safe-area padding on all sides */}</div>
```

## Touch Target Class

```tsx
<button className="touch-target">{/* Guarantees 44×44px minimum (Apple's guideline) */}</button>
```

## Mobile Scroll Optimization

```tsx
<div className="mobile-scroll overflow-y-auto">{/* Smooth momentum scrolling on iOS */}</div>
```

## Responsive Utilities

### Text Sizing

```tsx
<span className="text-xs sm:text-sm md:text-base">
  {/* Scales from mobile → tablet → desktop */}
</span>
```

### Padding

```tsx
<div className="px-2 sm:px-4 md:px-6">{/* Tight on mobile, comfortable on desktop */}</div>
```

### Grid Columns

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
  {/* 1 column mobile, 2 tablet, 3 desktop */}
</div>
```

## Common Patterns

### Tab Bar (Bottom Navigation)

```tsx
<nav className="safe-bottom fixed inset-x-0 bottom-0 pb-2 sm:pb-4">
  {/* Responsive padding + safe-area support */}
</nav>
```

### Sub-Navigation Tabs

```tsx
<TabsList className="safe-x h-12 px-2 sm:px-6">
  <TabsTrigger className="touch-target px-3 text-xs sm:px-4 sm:text-sm">Tab</TabsTrigger>
</TabsList>
```

### Horizontal Scrolling Tabs

```tsx
<div className="scrollbar-hide overflow-x-auto">
  <TabsList className="scrollbar-hide flex-nowrap">
    <TabsTrigger className="touch-target whitespace-nowrap">Long Tab Name</TabsTrigger>
  </TabsList>
</div>
```

### Modal/Dialog

```tsx
<Dialog>
  <DialogContent className="safe-all max-h-[90vh]">
    {/* Content stays within safe areas */}
  </DialogContent>
</Dialog>
```

### Full-Height Page

```tsx
<div className="mobile-scroll safe-mb flex h-full flex-col overflow-y-auto pb-20">
  {/* pb-20 reserves space for tab bar */}
</div>
```

## Device Testing

### Via Browser DevTools

1. Open Chrome DevTools (F12)
2. Click device toolbar (Cmd/Ctrl + Shift + M)
3. Select "iPhone 14 Pro" or "iPhone 15 Pro"
4. Toggle "Show device frame" to see notch/island

### Via Physical iPhone

1. Get your computer's local IP:

   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1

   # Windows
   ipconfig | findstr "IPv4"
   ```

2. Start dev server:

   ```bash
   npm run dev
   ```

3. On iPhone (same WiFi), visit:

   ```
   http://192.168.x.x:5173
   ```

4. Add to Home Screen for full PWA experience

## Testing Checklist

Mobile (iPhone):

- [ ] Tab bar doesn't overlap home indicator
- [ ] Header avoids notch/Dynamic Island
- [ ] All buttons easily tappable with thumb
- [ ] Content scrolls smoothly
- [ ] No accidental zooming

Tablet (iPad):

- [ ] Layout uses multi-column grids
- [ ] Touch targets still comfortable
- [ ] Horizontal space utilized well

Desktop:

- [ ] Safe-area classes don't affect layout
- [ ] Hover states work properly
- [ ] Content not overly centered/narrow

## Common Mistakes to Avoid

❌ **Fixed bottom without safe-area**:

```tsx
<div className="fixed bottom-0">  {/* BAD - overlaps home indicator */}
```

✅ **Fixed bottom with safe-area**:

```tsx
<div className="safe-bottom fixed bottom-0 pb-2">  {/* GOOD */}
```

---

❌ **Small touch targets**:

```tsx
<button className="p-1">  {/* BAD - too small for thumbs */}
```

✅ **Proper touch targets**:

```tsx
<button className="touch-target p-3">  {/* GOOD - 44×44px minimum */}
```

---

❌ **Tiny mobile text**:

```tsx
<span className="text-xs">  {/* BAD - hard to read */}
```

✅ **Responsive text**:

```tsx
<span className="text-sm sm:text-base">  {/* GOOD - scales up */}
```

---

❌ **No horizontal scroll fallback**:

```tsx
<div className="flex">
  {/* BAD - 10 tabs squashed on mobile */}
  {tabs.map(tab => (
    <Tab>{tab}</Tab>
  ))}
</div>
```

✅ **Horizontal scroll for overflow**:

```tsx
<div className="scrollbar-hide flex overflow-x-auto">
  {/* GOOD - scrollable if needed */}
  {tabs.map(tab => (
    <Tab className="whitespace-nowrap">{tab}</Tab>
  ))}
</div>
```

## CSS Variables Available

```css
/* Use in custom CSS if needed */
var(--safe-area-inset-top)     /* Top notch/island */
var(--safe-area-inset-bottom)  /* Bottom home indicator */
var(--safe-area-inset-left)    /* Left edge (landscape) */
var(--safe-area-inset-right)   /* Right edge (landscape) */
```

Example:

```css
.custom-header {
  padding-top: max(1rem, var(--safe-area-inset-top));
}
```

## Need More Help?

See full documentation:

- `docs/development/MOBILE_OPTIMIZATION_COMPLETE.md`
- `docs/history/PHASE_1.3.5_RESPONSIVE.md`
