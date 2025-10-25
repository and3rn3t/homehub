# Lighthouse Performance Baseline System - Installation Summary

**Date**: October 14, 2025
**Status**: ✅ Complete and Ready to Use

## What Was Installed

### Dependencies

```json
{
  "lighthouse": "^12.8.2",
  "chrome-launcher": "^1.2.1"
}
```

### New Scripts

```json
{
  "lighthouse:baseline": "node lighthouse/run-baseline.js",
  "lighthouse:mobile": "node lighthouse/run-baseline.js --mobile",
  "lighthouse:compare": "node lighthouse/run-baseline.js --compare",
  "lighthouse:compare:mobile": "node lighthouse/run-baseline.js --mobile --compare",
  "lighthouse:ci": "node lighthouse/run-baseline.js --compare --save",
  "lighthouse:ci:mobile": "node lighthouse/run-baseline.js --mobile --compare --save"
}
```

## Files Created

### Core System

```
lighthouse/
├── config.js                    # Desktop configuration (1920x1080, 10 Mbps)
├── config-mobile.js             # Mobile configuration (iPhone 13 Pro, 3G)
├── run-baseline.js              # Main runner script (380 lines)
├── README.md                    # Complete documentation
├── .gitignore                   # Git ignore rules
├── baselines/
│   ├── README.md
│   └── .gitkeep
└── reports/
    ├── README.md
    └── .gitkeep
```

### Documentation

```
docs/
├── development/
│   └── LIGHTHOUSE_BASELINE_SYSTEM.md    # Complete guide
└── guides/
    └── reference/
        └── LIGHTHOUSE_QUICKREF.md       # Quick reference
```

## Next Steps

### 1. Run Your First Baseline (Required)

```bash
# Start dev server
npm run dev

# In another terminal
npm run lighthouse:baseline -- --save
```

This creates your initial performance snapshot.

### 2. View the Report

The script will output the path to an HTML report. Open it in your browser:

```bash
# Example output
📄 Full report saved: report-desktop-1728934567890.html

# Open in browser (Windows)
start lighthouse/reports/report-desktop-*.html
```

### 3. Optional: Mobile Baseline

```bash
npm run lighthouse:mobile -- --save
```

### 4. Weekly Performance Check

```bash
# After making changes
npm run lighthouse:baseline -- --compare
```

## Features Overview

### ✅ Desktop Testing

- 1920x1080 resolution
- 10 Mbps connection simulation
- No CPU throttling
- Optimized for desktop experience

### ✅ Mobile Testing

- iPhone 13 Pro emulation (390x844)
- 3G connection (1.6 Mbps)
- 4x CPU throttling
- Touch target validation

### ✅ Baseline Tracking

- Save performance snapshots
- Compare new runs against baseline
- Track improvements over time
- Detect performance regressions

### ✅ Comprehensive Metrics

**Scores (0-100)**:

- Performance
- Accessibility
- Best Practices
- PWA

**Core Web Vitals**:

- FCP (First Contentful Paint)
- LCP (Largest Contentful Paint)
- TTI (Time to Interactive)
- SI (Speed Index)
- TBT (Total Blocking Time)
- CLS (Cumulative Layout Shift)

### ✅ CI/CD Ready

- Automated comparison
- Fail on regression
- GitHub Actions compatible

## Performance Targets

### Desktop Targets

| Metric      | Target | Critical |
| ----------- | ------ | -------- |
| Performance | 90+    | 70+      |
| FCP         | <1.5s  | <2.5s    |
| LCP         | <2.5s  | <4.0s    |
| TTI         | <3.0s  | <5.0s    |
| TBT         | <300ms | <600ms   |
| CLS         | <0.1   | <0.25    |

### Mobile Targets

| Metric      | Target | Critical |
| ----------- | ------ | -------- |
| Performance | 80+    | 60+      |
| FCP         | <2.5s  | <4.0s    |
| LCP         | <4.0s  | <6.0s    |
| TTI         | <5.0s  | <7.5s    |
| TBT         | <600ms | <1000ms  |
| CLS         | <0.1   | <0.25    |

## Quick Reference

### Common Commands

```bash
# Desktop audit
npm run lighthouse:baseline

# Mobile audit
npm run lighthouse:mobile

# Compare with baseline (desktop)
npm run lighthouse:compare

# Compare with baseline (mobile)
npm run lighthouse:compare:mobile

# Save and compare (CI mode)
npm run lighthouse:ci
```

### CLI Options

```bash
# Custom URL
npm run lighthouse:baseline -- --url=https://homehub.pages.dev

# Save as baseline
npm run lighthouse:baseline -- --save

# Compare with baseline
npm run lighthouse:baseline -- --compare

# Verbose output
npm run lighthouse:baseline -- --verbose
```

## Expected Output

When you run your first baseline:

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
   Location: C:\git\homehub\lighthouse\baselines\...

============================================================
✅ Baseline run complete!
============================================================
```

## Best Practices

### 1. Save Initial Baseline

Run with `--save` to establish your starting point.

### 2. Compare Regularly

Run `--compare` weekly to track progress.

### 3. Test Both Desktop and Mobile

Different devices have different constraints.

### 4. Review Full Reports

Open HTML reports for detailed recommendations.

### 5. Version Control

Keep latest baselines in git for CI/CD reference.

## Integration Ideas

### GitHub Actions

```yaml
- name: Performance Check
  run: |
    npm run dev &
    sleep 5
    npm run lighthouse:ci
```

### Pre-Commit Hook

```bash
npm run lighthouse:compare
```

### Weekly Automation

```bash
# cron job
0 9 * * 1 npm run lighthouse:baseline -- --save
```

## Troubleshooting

### Chrome Not Found

```bash
# Install Google Chrome
winget install Google.Chrome
```

### Port Already in Use

```bash
# Use custom port
npm run lighthouse:baseline -- --url=http://localhost:5174
```

### Inconsistent Results

Run multiple times or increase runs in config (change `runs: 3` to `runs: 5`).

## Documentation

- **Full Guide**: `lighthouse/README.md`
- **Dev Guide**: `docs/development/LIGHTHOUSE_BASELINE_SYSTEM.md`
- **Quick Ref**: `docs/guides/reference/LIGHTHOUSE_QUICKREF.md`
- **Baselines**: `lighthouse/baselines/README.md`
- **Reports**: `lighthouse/reports/README.md`

## Success Metrics

After running your first baseline, you should have:

- ✅ Baseline JSON file saved
- ✅ HTML report generated
- ✅ Performance scores displayed
- ✅ Core Web Vitals measured
- ✅ Comparison system ready

## Support Resources

- [Lighthouse Documentation](https://github.com/GoogleChrome/lighthouse)
- [Web.dev Performance](https://web.dev/performance/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Lighthouse Scoring](https://web.dev/performance-scoring/)

---

## 🚀 Ready to Start

Run your first baseline now:

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run baseline
npm run lighthouse:baseline -- --save
```

Then open the generated HTML report to see your performance scores!

---

**Installation Complete** ✅
**System Ready** ✅
**Documentation Complete** ✅
