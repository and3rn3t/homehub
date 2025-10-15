# Lighthouse Quick Reference

One-page cheat sheet for HomeHub performance testing

## Setup (One-Time)

```bash
npm install --save-dev lighthouse chrome-launcher
```

## Daily Usage

### Desktop Testing

```bash
# Run audit
npm run lighthouse:baseline

# Save as baseline
npm run lighthouse:baseline -- --save

# Compare with baseline
npm run lighthouse:baseline -- --compare
```

### Mobile Testing

```bash
# Run mobile audit
npm run lighthouse:mobile

# Save mobile baseline
npm run lighthouse:mobile -- --save

# Compare mobile
npm run lighthouse:mobile -- --compare
```

## CLI Options

| Option        | Description                                 |
| ------------- | ------------------------------------------- |
| `--url=<url>` | Custom URL (default: http://localhost:5173) |
| `--mobile`    | Run mobile tests (iPhone 13 Pro, 3G)        |
| `--save`      | Save results as baseline                    |
| `--compare`   | Compare against baseline                    |
| `--verbose`   | Show detailed output                        |

## Score Interpretation

| Score  | Rating            | Color     |
| ------ | ----------------- | --------- |
| 90-100 | Excellent         | 🟢 Green  |
| 50-89  | Needs Improvement | 🟡 Yellow |
| 0-49   | Poor              | 🔴 Red    |

## Target Metrics

### Desktop

- Performance: **90+**
- FCP: **<1.5s**
- LCP: **<2.5s**
- TTI: **<3.0s**
- TBT: **<300ms**
- CLS: **<0.1**

### Mobile

- Performance: **80+**
- FCP: **<2.5s**
- LCP: **<4.0s**
- TTI: **<5.0s**
- TBT: **<600ms**
- CLS: **<0.1**

## Common Tasks

### Weekly Performance Check

```bash
npm run lighthouse:baseline -- --compare
```

### Save Release Baseline

```bash
npm run lighthouse:baseline -- --save
npm run lighthouse:mobile -- --save
```

### Test Production URL

```bash
npm run lighthouse:baseline -- --url=https://homehub.pages.dev
```

## File Locations

- **Config**: `lighthouse/config.js`, `lighthouse/config-mobile.js`
- **Runner**: `lighthouse/run-baseline.js`
- **Baselines**: `lighthouse/baselines/baseline-*.json`
- **Reports**: `lighthouse/reports/report-*.html`

## Quick Fixes

### Improve Performance

1. **Lazy load images**: Add `loading="lazy"`
2. **Code splitting**: Use dynamic imports
3. **Optimize images**: Use WebP format
4. **Defer JavaScript**: Move scripts to end
5. **Enable caching**: Add service worker

### Improve Accessibility

1. **Alt text**: Add to all images
2. **ARIA labels**: Label interactive elements
3. **Color contrast**: Check contrast ratios
4. **Keyboard nav**: Test tab navigation
5. **Focus indicators**: Visible focus styles

### Improve PWA Score

1. **Add manifest**: `public/manifest.json`
2. **Service worker**: Cache assets offline
3. **Icons**: 192x192 and 512x512 PNG
4. **Theme color**: Meta tag for mobile
5. **HTTPS**: Always use secure connection

## CI/CD Integration

```bash
# Add to GitHub Actions
npm run lighthouse:ci
```

Fails if performance regresses vs baseline.

## Troubleshooting

| Issue                | Solution                        |
| -------------------- | ------------------------------- |
| Chrome not found     | Install Google Chrome           |
| Port in use          | Use `--url` with different port |
| Inconsistent results | Run multiple times              |
| Memory errors        | Close other apps, kill Chrome   |

## Resources

- Full docs: `lighthouse/README.md`
- Dev guide: `docs/development/LIGHTHOUSE_BASELINE_SYSTEM.md`
- Web.dev: https://web.dev/performance/

---

**💡 Pro Tip**: Save baselines weekly and track trends over time!
