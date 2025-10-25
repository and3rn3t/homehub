# Favicon Assets

This directory contains the favicon and icon assets for HomeHub.

## Files

- **favicon.svg** - Primary favicon (SVG format, scales perfectly)
  - iOS blue gradient background (oklch(0.65 0.15 250) → oklch(0.55 0.15 250))
  - White house icon with green lightning bolt accent
  - 32x32 viewBox, 7px border radius

- **apple-touch-icon.png** - iOS home screen icon (180x180 PNG)
  - TODO: Generate from SVG using a converter or design tool
  - Recommended: Use https://realfavicongenerator.net/ to generate all sizes

## Generating PNG Icons

To generate PNG versions from the SVG:

### Option 1: Using ImageMagick

```bash
# Install ImageMagick
# Windows: choco install imagemagick
# macOS: brew install imagemagick

# Generate apple-touch-icon
magick -background none -density 300 favicon.svg -resize 180x180 apple-touch-icon.png
```

### Option 2: Online Tool

Visit https://realfavicongenerator.net/ and upload `favicon.svg` to generate:

- apple-touch-icon.png (180x180)
- favicon-32x32.png
- favicon-16x16.png
- manifest.json for PWA support

### Option 3: Figma/Sketch/Design Tool

1. Open favicon.svg in your design tool
2. Export as PNG at 180x180 for Apple Touch Icon
3. Export additional sizes if needed

## Design Specifications

**Colors:**

- Primary: iOS Blue `oklch(0.6 0.15 250)`
- Accent: iOS Green `oklch(0.7 0.15 145)`
- Icon: White `#FFFFFF`

**Dimensions:**

- SVG: 32x32 viewBox
- Apple Touch Icon: 180x180px
- Standard Favicon: 32x32px, 16x16px

**Border Radius:**

- iOS-style rounded corners (7px on 32x32 canvas = ~22% radius)
