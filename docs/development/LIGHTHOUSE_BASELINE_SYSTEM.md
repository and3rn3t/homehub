# Lighthouse Performance Baseline System

**Status**: ✅ Complete (October 14, 2025)
**Category**: Development Tools
**Phase**: Validation & Monitoring

## Overview

Comprehensive Lighthouse performance tracking system for HomeHub. Establishes baselines, tracks improvements, and monitors Core Web Vitals over time.

## Quick Start

### 1. Run Initial Baseline

```bash
# Start dev server
npm run dev

# In another terminal, create baseline
npm run lighthouse:baseline -- --save
```

### 2. Track Performance

```bash
# Make some changes to your code...

# Compare against baseline
npm run lighthouse:baseline -- --compare
```

### 3. Mobile Testing

```bash
npm run lighthouse:mobile -- --save
npm run lighthouse:mobile -- --compare
```

## Available Scripts

| Script                              | Description                          |
| ----------------------------------- | ------------------------------------ |
| `npm run lighthouse:baseline`       | Run desktop audit                    |
| `npm run lighthouse:mobile`         | Run mobile audit (iPhone 13 Pro, 3G) |
| `npm run lighthouse:compare`        | Compare desktop vs baseline          |
| `npm run lighthouse:compare:mobile` | Compare mobile vs baseline           |
| `npm run lighthouse:ci`             | Desktop CI check (compare + save)    |
| `npm run lighthouse:ci:mobile`      | Mobile CI check (compare + save)     |

## Script Options

```bash
# Custom URL
npm run lighthouse:baseline -- --url=https://homehub.pages.dev

# Save as baseline
npm run lighthouse:baseline -- --save

# Compare with baseline
npm run lighthouse:baseline -- --compare

# Verbose output
npm run lighthouse:baseline -- --verbose

# Combined: compare and save new baseline
npm run lighthouse:baseline -- --compare --save
```

## Directory Structure

```
lighthouse/
├── config.js                    # Desktop configuration
├── config-mobile.js             # Mobile configuration
├── run-baseline.js              # Runner script
├── README.md                    # Full documentation
├── .gitignore                   # Git ignore rules
├── baselines/                   # Performance baselines
│   ├── baseline-desktop-latest.json
│   ├── baseline-mobile-latest.json
│   └── README.md
└── reports/                     # Full HTML reports
    ├── report-desktop-*.html
    ├── report-mobile-*.html
    └── README.md
```

## Performance Targets

### Desktop (1920x1080, 10 Mbps)

| Metric                  | Target | Critical | Description                |
| ----------------------- | ------ | -------- | -------------------------- |
| **Performance Score**   | 90+    | 70+      | Overall performance rating |
| **Accessibility Score** | 90+    | 80+      | WCAG compliance            |
| **FCP**                 | <1.5s  | <2.5s    | First Contentful Paint     |
| **LCP**                 | <2.5s  | <4.0s    | Largest Contentful Paint   |
| **TTI**                 | <3.0s  | <5.0s    | Time to Interactive        |
| **TBT**                 | <300ms | <600ms   | Total Blocking Time        |
| **CLS**                 | <0.1   | <0.25    | Cumulative Layout Shift    |

### Mobile (iPhone 13 Pro, 3G)

| Metric                  | Target | Critical | Description                |
| ----------------------- | ------ | -------- | -------------------------- |
| **Performance Score**   | 80+    | 60+      | Overall performance rating |
| **Accessibility Score** | 90+    | 80+      | WCAG compliance            |
| **FCP**                 | <2.5s  | <4.0s    | First Contentful Paint     |
| **LCP**                 | <4.0s  | <6.0s    | Largest Contentful Paint   |
| **TTI**                 | <5.0s  | <7.5s    | Time to Interactive        |
| **TBT**                 | <600ms | <1000ms  | Total Blocking Time        |
| **CLS**                 | <0.1   | <0.25    | Cumulative Layout Shift    |

## Features

### ✅ Desktop Testing

- 1920x1080 resolution
- 10 Mbps connection
- No CPU throttling
- 3-run average for consistency

### ✅ Mobile Testing

- iPhone 13 Pro emulation (390x844)
- 3G connection (1.6 Mbps)
- 4x CPU throttling
- Touch target validation

### ✅ Baseline Tracking

- Save performance snapshots
- Compare against historical data
- Track trends over time
- Automated regression detection

### ✅ Comprehensive Reports

- Full HTML reports with screenshots
- Core Web Vitals breakdown
- Actionable recommendations
- Diagnostic information

### ✅ CI/CD Ready

- Automated baseline comparison
- Fail on performance regression
- GitHub Actions compatible
- Continuous monitoring

## Output Examples

### Successful Run

```
============================================================
🏠 HomeHub Lighthouse Performance Baseline
============================================================

🚀 Launching Chrome...
📊 Running Lighthouse on http://localhost:5173...
   Device: Desktop (1920x1080)
   Runs: 3 (averaging results)

📈 Performance Scores:
   Performance:      95
   Accessibility:    92
   Best Practices:   96
   PWA:              75

⏱️  Core Web Vitals:
   FCP:  847ms
   LCP:  1234ms
   TTI:  2456ms
   SI:   1678ms
   TBT:  123ms
   CLS:  0.05

📄 Full report saved: report-desktop-1728934567890.html

💾 Baseline saved: baseline-desktop-1728934567890.json
   Location: C:\git\homehub\lighthouse\baselines\baseline-desktop-1728934567890.json

============================================================
✅ Baseline run complete!
============================================================
```

### Comparison Run

```
📊 Comparison with Baseline:
   Performance:      +2.5%
   Accessibility:    +0.0%
   Best Practices:   +1.0%
   PWA:              +5.0%

   FCP:  -153ms (-15.3%)
   LCP:  -234ms (-15.9%)
   TTI:  -356ms (-12.7%)
   SI:   -178ms (-9.6%)
   TBT:  -23ms (-15.8%)
```

## Usage Workflows

### Weekly Performance Check

```bash
# Monday: Save baseline
npm run lighthouse:baseline -- --save

# Throughout week: Make improvements
git commit -am "Optimize bundle size"

# Friday: Compare progress
npm run lighthouse:baseline -- --compare
```

### Pre-Release Validation

```bash
# Before release
npm run lighthouse:baseline -- --compare
npm run lighthouse:mobile -- --compare

# If good, save as release baseline
npm run lighthouse:baseline -- --save
npm run lighthouse:mobile -- --save

# Tag baseline with version
cp lighthouse/baselines/baseline-desktop-latest.json \
   lighthouse/baselines/baseline-desktop-v1.0.0.json
```

### Performance Optimization

```bash
# 1. Establish baseline
npm run lighthouse:baseline -- --save

# 2. Make optimization (e.g., lazy load images)
# ... edit code ...

# 3. Test impact
npm run lighthouse:baseline -- --compare

# 4. If improved, save new baseline
npm run lighthouse:baseline -- --save
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Performance Check

on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build app
        run: npm run build

      - name: Start server
        run: npm run preview &

      - name: Wait for server
        run: sleep 5

      - name: Run Lighthouse
        run: npm run lighthouse:ci

      - name: Upload report
        uses: actions/upload-artifact@v4
        with:
          name: lighthouse-report
          path: lighthouse/reports/
```

## Troubleshooting

### Chrome Not Found

```bash
# Windows (winget)
winget install Google.Chrome

# macOS (Homebrew)
brew install --cask google-chrome

# Linux (apt)
sudo apt install google-chrome-stable
```

### Port Already in Use

Change Vite port in `vite.config.ts`:

```ts
server: {
  port: 5174,
}
```

Then run with custom URL:

```bash
npm run lighthouse:baseline -- --url=http://localhost:5174
```

### Inconsistent Results

Run multiple times for stability:

```bash
# Run 5 times and average mentally
for i in {1..5}; do npm run lighthouse:baseline; done
```

Or increase runs in config files (change `runs: 3` to `runs: 5`).

### Memory Issues

```bash
# Close other applications
# Kill existing Chrome processes

# Windows
taskkill /F /IM chrome.exe

# Linux/macOS
pkill chrome
```

## Best Practices

### 1. Regular Baseline Updates

- Save baselines weekly
- Tag baselines with version numbers
- Keep 10 most recent baselines

### 2. Before Major Changes

- Establish baseline before optimization work
- Compare after each significant change
- Document improvements in commit messages

### 3. Mobile Testing

- Test mobile separately from desktop
- Use mobile baselines for mobile optimizations
- Consider both WiFi and 3G scenarios

### 4. Report Review

- Open full HTML reports for details
- Focus on "Opportunities" section
- Implement top 3 recommendations first

### 5. Version Control

- Commit latest baselines to git
- Archive important milestones
- Document significant changes in release notes

## Performance Tips

Based on Lighthouse recommendations:

### 1. Images

- Use WebP format
- Lazy load below-fold images
- Proper sizing with `srcset`
- Add `loading="lazy"` attribute

### 2. JavaScript

- Code splitting with dynamic imports
- Tree-shake unused code
- Defer non-critical JS
- Minimize main thread work

### 3. CSS

- Remove unused styles
- Inline critical CSS
- Defer non-critical CSS
- Use CSS containment

### 4. Fonts

- Preload critical fonts
- Use `font-display: swap`
- Subset fonts
- WOFF2 format

### 5. Caching

- Service worker for offline support
- HTTP caching headers
- CDN for static assets
- Cache API for dynamic content

## Resources

- [Lighthouse Documentation](https://github.com/GoogleChrome/lighthouse)
- [Web.dev Performance Guide](https://web.dev/performance/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Lighthouse Scoring](https://web.dev/performance-scoring/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

## Next Steps

1. ✅ Install dependencies (lighthouse, chrome-launcher)
2. ✅ Add npm scripts to package.json
3. 🚀 **Run initial baseline**: `npm run lighthouse:baseline -- --save`
4. 📊 **View HTML report** in browser
5. 🔄 **Track weekly** for continuous improvement
6. 🤖 **Add to CI/CD** for automated checks

## Related Documentation

- `lighthouse/README.md` - Full setup and usage guide
- `lighthouse/baselines/README.md` - Baseline file management
- `lighthouse/reports/README.md` - Report viewing and sharing
- `docs/guides/BEST_PRACTICES.md` - General development practices
- `docs/development/NEXT_STEPS.md` - Roadmap and priorities
