# Lighthouse Performance Tracking

This directory contains Lighthouse configuration, baseline measurements, and performance tracking tools for HomeHub.

## Quick Start

### 1. Run Initial Baseline (Desktop)

```bash
# Start dev server first
npm run dev

# In another terminal, run baseline
npm run lighthouse:baseline -- --save
```

### 2. Run Mobile Baseline

```bash
npm run lighthouse:mobile -- --save
```

### 3. Compare Against Baseline

```bash
# Desktop comparison
npm run lighthouse:baseline -- --compare

# Mobile comparison
npm run lighthouse:mobile -- --compare
```

## Directory Structure

```
lighthouse/
├── config.js              # Desktop Lighthouse configuration
├── config-mobile.js       # Mobile Lighthouse configuration
├── run-baseline.js        # Baseline runner script
├── baselines/             # Saved baseline measurements
│   ├── baseline-desktop-latest.json
│   ├── baseline-mobile-latest.json
│   └── baseline-*.json    # Timestamped baselines
└── reports/               # Full HTML reports
    └── report-*.html      # Timestamped reports
```

## Available Scripts

Add these to `package.json` scripts:

```json
{
  "lighthouse:baseline": "node lighthouse/run-baseline.js",
  "lighthouse:mobile": "node lighthouse/run-baseline.js --mobile",
  "lighthouse:compare": "node lighthouse/run-baseline.js --compare",
  "lighthouse:ci": "node lighthouse/run-baseline.js --compare --save"
}
```

## Performance Targets

### Desktop (1920x1080, 10 Mbps)

| Metric                         | Target | Critical |
| ------------------------------ | ------ | -------- |
| Performance Score              | 90+    | 70+      |
| Accessibility Score            | 90+    | 80+      |
| FCP (First Contentful Paint)   | <1.5s  | <2.5s    |
| LCP (Largest Contentful Paint) | <2.5s  | <4.0s    |
| TTI (Time to Interactive)      | <3.0s  | <5.0s    |
| TBT (Total Blocking Time)      | <300ms | <600ms   |
| CLS (Cumulative Layout Shift)  | <0.1   | <0.25    |

### Mobile (iPhone 13 Pro, 3G)

| Metric              | Target | Critical |
| ------------------- | ------ | -------- |
| Performance Score   | 80+    | 60+      |
| Accessibility Score | 90+    | 80+      |
| FCP                 | <2.5s  | <4.0s    |
| LCP                 | <4.0s  | <6.0s    |
| TTI                 | <5.0s  | <7.5s    |
| TBT                 | <600ms | <1000ms  |
| CLS                 | <0.1   | <0.25    |

## Usage Examples

### Basic Run

```bash
npm run lighthouse:baseline
```

### Save as Baseline

```bash
npm run lighthouse:baseline -- --save
```

### Compare Performance

```bash
# Make some changes to your code...
npm run lighthouse:baseline -- --compare
```

### Test Custom URL

```bash
npm run lighthouse:baseline -- --url=https://homehub.pages.dev
```

### Mobile Testing

```bash
npm run lighthouse:mobile -- --save --compare
```

### Verbose Output

```bash
npm run lighthouse:baseline -- --verbose
```

## CI/CD Integration

For continuous performance monitoring:

```bash
# Run and compare against baseline (fails if regression detected)
npm run lighthouse:ci
```

Add to GitHub Actions:

```yaml
- name: Performance Baseline Check
  run: |
    npm run dev &
    sleep 5
    npm run lighthouse:ci
```

## Interpreting Results

### Scores (0-100)

- **90-100**: Excellent (green)
- **50-89**: Needs improvement (yellow)
- **0-49**: Poor (red)

### Core Web Vitals

- **FCP (First Contentful Paint)**: When first content appears
- **LCP (Largest Contentful Paint)**: When main content is visible
- **TTI (Time to Interactive)**: When page is fully interactive
- **TBT (Total Blocking Time)**: Time page is blocked from responding
- **CLS (Cumulative Layout Shift)**: Visual stability metric

### Performance Tips

1. **Lazy load images** - Use `loading="lazy"` for below-fold images
2. **Code splitting** - Split large bundles with dynamic imports
3. **Optimize assets** - Compress images, minify CSS/JS
4. **Cache effectively** - Use service workers and HTTP caching
5. **Reduce JS payload** - Tree-shake unused code, use smaller libraries
6. **Minimize main thread work** - Defer non-critical JavaScript

## Tracking Progress

### Historical Comparison

```bash
# Run baseline weekly and compare trends
ls -la lighthouse/baselines/
```

### View Full Reports

```bash
# Open latest HTML report in browser
open lighthouse/reports/report-desktop-*.html
```

## Troubleshooting

### Chrome Not Found

Install Chrome or Chromium:

```bash
# Windows (winget)
winget install Google.Chrome

# macOS (Homebrew)
brew install --cask google-chrome
```

### Port Already in Use

Change dev server port in `vite.config.ts`:

```ts
server: {
  port: 5174, // Use different port
}
```

### Inconsistent Results

Run multiple tests and average:

```bash
# Run 5 times and compare
for i in {1..5}; do npm run lighthouse:baseline -- --save; done
```

### Memory Issues

Close other Chrome tabs and applications:

```bash
# Kill existing Chrome processes (Linux/macOS)
pkill chrome

# Windows
taskkill /F /IM chrome.exe
```

## Next Steps

1. ✅ Install dependencies: `npm install --save-dev chrome-launcher`
2. 🔄 Add npm scripts to `package.json`
3. 🚀 Run initial baseline: `npm run lighthouse:baseline -- --save`
4. 📊 Track improvements over time
5. 🔁 Integrate into CI/CD pipeline

## Resources

- [Web.dev Performance Guide](https://web.dev/performance/)
- [Lighthouse Scoring](https://web.dev/performance-scoring/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
