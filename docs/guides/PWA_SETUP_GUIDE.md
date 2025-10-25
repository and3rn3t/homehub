# PWA Setup Guide - HomeHub

**Status**: 95% Complete - Just need icons!

**Date**: October 15, 2025

---

## Current PWA Status

### ✅ What's Already Configured

| Feature              | Status             | File                              |
| -------------------- | ------------------ | --------------------------------- |
| Service Worker       | ✅ Complete        | `src/sw.ts`                       |
| PWA Manifest         | ✅ Generated       | `dist/manifest.webmanifest`       |
| Offline Support      | ✅ Working         | `public/offline.html`             |
| iOS Meta Tags        | ✅ Added           | `index.html`                      |
| Update Notifications | ✅ Implemented     | `src/components/UpdateBanner.tsx` |
| Cache Strategies     | ✅ 7 rules         | Phase 1 complete                  |
| Background Sync      | ✅ Offline queue   | Phase 2 complete                  |
| Manual Registration  | ✅ Clean lifecycle | Phase 3 complete                  |

### ❌ What's Missing (Critical!)

| Item                   | Status     | Priority     |
| ---------------------- | ---------- | ------------ |
| `icon-192.png`         | ❌ Missing | 🔴 Critical  |
| `icon-512.png`         | ❌ Missing | 🔴 Critical  |
| `apple-touch-icon.png` | ❌ Missing | 🔴 Critical  |
| `favicon.ico`          | ❌ Missing | 🟡 Important |

**Without icons, users won't see the "Add to Home Screen" prompt!**

---

## Step-by-Step: Complete Your PWA

### Step 1: Generate Icons (Choose One Method)

#### Method A: Use Sharp (Automated - Recommended)

```bash
# Install Sharp (one-time)
npm install sharp --save-dev

# Generate icons from your logo
node scripts/generate-pwa-icons.js path/to/logo.svg

# Or from a PNG
node scripts/generate-pwa-icons.js path/to/logo.png
```

**Pros**: Automated, consistent sizing, fast
**Cons**: Requires source image in high resolution

---

#### Method B: RealFaviconGenerator (Best Quality)

1. **Visit**: https://realfavicongenerator.net/
2. **Upload**: Your logo (SVG or 512×512px+ PNG)
3. **Configure**:
   - **iOS**: Select "Add a solid, plain background color" → Use `#4a9eff` (HomeHub blue)
   - **Android**: Enable "Maskable icon" → Adjust safe zone
   - **Windows**: Set tile color to `#4a9eff`
   - **macOS Safari**: Enable pinned tab icon
4. **Generate**: Click "Generate your Favicons and HTML code"
5. **Download**: Extract the package
6. **Copy Files** to `public/`:

```bash
# Required files (rename if needed):
icon-192.png          # From android-chrome-192x192.png
icon-512.png          # From android-chrome-512x512.png
apple-touch-icon.png  # Already named correctly
favicon.ico           # Already named correctly
```

**Pros**: Professional quality, comprehensive coverage
**Cons**: Manual process

---

#### Method C: PWA Builder (Microsoft Tool)

1. **Visit**: https://www.pwabuilder.com/imageGenerator
2. **Upload**: 512×512px+ image
3. **Padding**: Add 10-20% padding (for maskable safe zone)
4. **Generate**: Click "Download"
5. **Copy**: Extract and copy to `public/`

**Pros**: PWA-specific, maskable support
**Cons**: Less customization

---

#### Method D: Favicon.io (Quickest)

1. **Visit**: https://favicon.io/
2. **Choose**:
   - **From Text**: `H` in Inter font on `#4a9eff` background
   - **From Emoji**: 🏠 house emoji
   - **From Image**: Upload your logo
3. **Generate**: Click "Download"
4. **Rename** and copy to `public/`:
   - `android-chrome-192x192.png` → `icon-192.png`
   - `android-chrome-512x512.png` → `icon-512.png`
   - Keep `apple-touch-icon.png` as is
   - Keep `favicon.ico` as is

**Pros**: Fastest, no account needed
**Cons**: Basic options only

---

### Step 2: Verify Icon Files

```bash
# Check icons exist in public/
ls public/*.png public/*.ico

# Expected output:
# icon-192.png
# icon-512.png
# apple-touch-icon.png
# favicon.ico
```

---

### Step 3: Test Icon Sizes

```bash
# On macOS/Linux with ImageMagick:
identify public/icon-192.png   # Should be 192x192
identify public/icon-512.png   # Should be 512x512
identify public/apple-touch-icon.png  # Should be 180x180

# On Windows with PowerShell:
Add-Type -AssemblyName System.Drawing
[System.Drawing.Image]::FromFile("$(pwd)\public\icon-192.png").Size
[System.Drawing.Image]::FromFile("$(pwd)\public\icon-512.png").Size
[System.Drawing.Image]::FromFile("$(pwd)\public\apple-touch-icon.png").Size
```

---

### Step 4: Rebuild & Deploy

```bash
# Build with new icons
npm run build

# Verify icons are copied to dist/
ls dist/*.png dist/*.ico

# Preview locally
npm run preview

# Deploy to Cloudflare Pages (if ready)
git add public/*.png public/*.ico
git commit -m "Add PWA icons"
git push
```

---

### Step 5: Test PWA Installation

#### On Desktop (Chrome/Edge)

1. Open: `http://localhost:5173` (or your deployed URL)
2. **Check Service Worker**:
   - Open DevTools → Application → Service Workers
   - Should see: `sw.js` registered and activated
3. **Check Manifest**:
   - DevTools → Application → Manifest
   - Should show: HomeHub with icons preview
4. **Install Prompt**:
   - Look for install icon (⊕) in address bar
   - Or: Chrome menu → "Install HomeHub..."
5. **Click Install** → App opens in standalone window

---

#### On iOS (Safari)

1. Open: Your deployed URL on iPhone/iPad
2. Tap: Share button (box with arrow)
3. Scroll: Find "Add to Home Screen"
4. Tap: "Add"
5. **Result**: HomeHub icon on home screen with your custom icon

**iOS Notes**:

- Must be served over HTTPS (localhost ok for dev)
- Service worker must be registered
- Manifest must be valid
- Icons must exist

---

#### On Android (Chrome)

1. Open: Your deployed URL on Android
2. **Look for banner**: "Add HomeHub to Home screen"
3. Or: Chrome menu → "Install app"
4. Tap: "Install"
5. **Result**: App in app drawer and home screen

**Android Notes**:

- Requires HTTPS (except localhost)
- Must meet [PWA installability criteria](https://web.dev/install-criteria/)
- 512px icon shown on splash screen

---

## PWA Manifest Configuration

Your current manifest (auto-generated):

```json
{
  "name": "HomeHub",
  "short_name": "HomeHub",
  "description": "iOS-inspired home automation dashboard",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4a9eff",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

**Configuration Source**: `vite.config.ts` → `VitePWA({ manifest: {...} })`

---

## PWA Installability Checklist

Use this checklist to verify your PWA is installable:

### Required for Install Prompt

- [ ] ✅ **HTTPS**: Served over HTTPS (or localhost)
- [ ] ✅ **Service Worker**: Registered and activated
- [ ] ✅ **Web Manifest**: Valid manifest.webmanifest
- [ ] ❌ **Icons**: At least 192px and 512px icons
- [ ] ✅ **Start URL**: Specified in manifest
- [ ] ✅ **Display Mode**: Set to `standalone` or `fullscreen`
- [ ] ✅ **Name**: App name specified

### Recommended for Better Experience

- [ ] ❌ **Apple Touch Icon**: 180×180px for iOS
- [ ] ✅ **Theme Color**: Matches app branding
- [ ] ✅ **Background Color**: Smooth launch transition
- [ ] ✅ **Offline Support**: Works without network
- [ ] ✅ **Responsive**: Mobile-friendly UI
- [ ] ❌ **Favicon**: For browser tab

### Optional Enhancements

- [ ] ⏳ **Maskable Icon**: Adaptive icon for Android
- [ ] ⏳ **Screenshots**: App preview images
- [ ] ⏳ **Shortcuts**: Quick actions in app launcher
- [ ] ⏳ **Categories**: App categorization
- [ ] ⏳ **Share Target**: Receive shared content

---

## Testing Your PWA

### Chrome DevTools Lighthouse

```bash
# Run Lighthouse audit
npm run lighthouse

# Or manually in DevTools:
# 1. Open DevTools (F12)
# 2. Go to Lighthouse tab
# 3. Select "Progressive Web App"
# 4. Click "Generate report"
```

**Target Scores**:

- ✅ PWA Score: 100/100 (after icons added)
- ✅ Performance: 90+ (already optimized)
- ✅ Accessibility: 95+ (check remaining issues)
- ✅ Best Practices: 100 (already achieved)
- ✅ SEO: 100 (basic meta tags)

---

### PWA Builder Validation

1. Visit: https://www.pwabuilder.com/
2. Enter: Your deployed URL
3. Click: "Start"
4. Review: Report card for PWA features
5. Fix: Any red/yellow items

---

### Manual Testing Matrix

| Platform    | Browser          | Install Method             | Test Status      |
| ----------- | ---------------- | -------------------------- | ---------------- |
| Windows     | Chrome 120+      | Install icon in omnibox    | ⏳ Pending icons |
| Windows     | Edge 120+        | Install icon in omnibox    | ⏳ Pending icons |
| macOS       | Chrome 120+      | Install icon in omnibox    | ⏳ Pending icons |
| macOS       | Safari 17+       | Share → Add to Dock        | ⏳ Pending icons |
| iOS 16+     | Safari           | Share → Add to Home Screen | ⏳ Pending icons |
| Android 13+ | Chrome           | Install banner             | ⏳ Pending icons |
| Android 13+ | Samsung Internet | Install banner             | ⏳ Pending icons |

---

## Troubleshooting

### Issue: No Install Prompt Appears

**Check**:

1. Icons exist: `ls public/icon-*.png`
2. HTTPS enabled (or using localhost)
3. Service worker registered: DevTools → Application
4. Manifest valid: DevTools → Application → Manifest
5. No console errors

**Fix**:

```bash
# Clear browser data
# DevTools → Application → Clear storage → "Clear site data"

# Rebuild
npm run build

# Hard refresh
Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

---

### Issue: Icons Not Showing

**Check**:

1. Files in `public/`: `ls public/*.png`
2. Files in `dist/`: `ls dist/*.png`
3. Correct sizes: Use `identify` or PowerShell
4. No 404 errors: DevTools → Network

**Fix**:

```bash
# Verify files exist
ls -lh public/*.png

# Check manifest points to correct paths
cat dist/manifest.webmanifest | grep icon

# Rebuild to copy files
npm run build
```

---

### Issue: iOS Not Installing

**Check**:

1. Using Safari (required for iOS PWA)
2. HTTPS enabled (except localhost)
3. Apple touch icon exists: `ls public/apple-touch-icon.png`
4. Correct meta tags in `index.html`

**Fix**:

```bash
# Verify iOS meta tags exist
grep -i "apple-mobile-web-app" index.html

# Should see:
# <meta name="apple-mobile-web-app-capable" content="yes">
# <meta name="apple-mobile-web-app-title" content="HomeHub">
```

---

### Issue: Service Worker Not Updating

**Check**:

1. UpdateBanner appears with new version
2. Service worker in "waiting" state
3. Skip waiting handler present

**Fix**:

```bash
# DevTools → Application → Service Workers
# Click "skipWaiting" button manually

# Or close all tabs and reopen
```

---

## PWA Features by Platform

### iOS (Safari)

**Supported**:

- ✅ Add to Home Screen
- ✅ Standalone display mode
- ✅ Theme color (status bar)
- ✅ Service worker caching
- ✅ Offline support
- ✅ Push notifications (iOS 16.4+)

**Limitations**:

- ❌ Install prompt (must use Share menu)
- ❌ Background sync (limited)
- ❌ Maskable icons (always rounded squares)
- ⚠️ Storage limits (50MB soft, asks permission)

---

### Android (Chrome)

**Supported**:

- ✅ Install prompt banner
- ✅ Standalone display mode
- ✅ Splash screen with icon
- ✅ Maskable/adaptive icons
- ✅ Service worker (full support)
- ✅ Background sync
- ✅ Push notifications
- ✅ Share target API

**Limitations**:

- ⚠️ Storage quotas (varies by device)

---

### Desktop (Chrome/Edge)

**Supported**:

- ✅ Install from omnibox icon
- ✅ Standalone window
- ✅ Native-like titlebar
- ✅ Service worker (full support)
- ✅ Background sync
- ✅ Push notifications
- ✅ File handling API
- ✅ Window controls overlay

**Limitations**:

- ⚠️ Less discoverable than mobile

---

## Advanced PWA Features (Future)

### Phase 7: Add to Manifest

```typescript
// vite.config.ts - Enhanced manifest
manifest: {
  // ... existing config

  // App shortcuts (quick actions)
  shortcuts: [
    {
      name: "Dashboard",
      url: "/?tab=dashboard",
      icons: [{ src: "/shortcuts/dashboard.png", sizes: "96x96" }]
    },
    {
      name: "Scenes",
      url: "/?tab=scenes",
      icons: [{ src: "/shortcuts/scenes.png", sizes: "96x96" }]
    }
  ],

  // Screenshots for install prompt
  screenshots: [
    {
      src: "/screenshots/dashboard.png",
      sizes: "1280x720",
      type: "image/png"
    }
  ],

  // App categories
  categories: ["productivity", "utilities"],

  // Share target (receive shared URLs/text)
  share_target: {
    action: "/share",
    method: "POST",
    enctype: "multipart/form-data",
    params: {
      title: "title",
      text: "text",
      url: "url"
    }
  }
}
```

---

### Phase 8: Handle App Installs

```typescript
// src/hooks/use-pwa-install.ts
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const promptInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    console.log(`User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} install`)
    setDeferredPrompt(null)
    setIsInstallable(false)
  }

  return { isInstallable, promptInstall }
}
```

---

## Resources

### Official Documentation

- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Apple iOS Web Apps](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [Android PWA Guidelines](https://developer.chrome.com/docs/android/trusted-web-activity/)

### Tools

- [PWA Builder](https://www.pwabuilder.com/) - Validation and enhancement
- [RealFaviconGenerator](https://realfavicongenerator.net/) - Icon generation
- [Maskable.app](https://maskable.app/) - Test maskable icons
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - PWA auditing
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator) - CLI tool

### Testing

- [PWA Testing Guide](https://web.dev/pwa-checklist/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [WebPageTest](https://www.webpagetest.org/) - Performance testing

---

## Next Steps

1. **Generate Icons** (choose method above)
2. **Test Installation** on target devices
3. **Run Lighthouse Audit** to verify 100/100 PWA score
4. **Deploy to Production** (Cloudflare Pages with HTTPS)
5. **Monitor Adoption** (analytics for install events)

---

## Quick Reference

```bash
# Generate icons (after installing Sharp)
node scripts/generate-pwa-icons.js logo.svg

# Build with icons
npm run build

# Test locally
npm run preview

# Deploy
git add public/*.png && git commit -m "Add PWA icons" && git push

# Audit
npm run lighthouse
```

**Status After Icons**: 100% PWA Ready! 🎉
