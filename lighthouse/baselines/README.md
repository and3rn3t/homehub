# Lighthouse Performance Baselines

This directory stores performance baseline measurements for tracking HomeHub's performance over time.

## File Naming Convention

- `baseline-desktop-latest.json` - Most recent desktop baseline
- `baseline-mobile-latest.json` - Most recent mobile baseline
- `baseline-desktop-{timestamp}.json` - Historical desktop baselines
- `baseline-mobile-{timestamp}.json` - Historical mobile baselines

## Baseline Schema

```json
{
  "scores": {
    "performance": 0.95,
    "accessibility": 0.92,
    "bestPractices": 0.96,
    "pwa": 0.75
  },
  "metrics": {
    "firstContentfulPaint": 847,
    "largestContentfulPaint": 1234,
    "interactive": 2456,
    "speedIndex": 1678,
    "totalBlockingTime": 123,
    "cumulativeLayoutShift": 0.05
  },
  "timing": {
    "timestamp": "2025-10-14T20:47:00.000Z",
    "formFactor": "desktop",
    "url": "http://localhost:5173"
  }
}
```

## Usage

Baselines are automatically created when you run:

```bash
npm run lighthouse:baseline -- --save
```

Compare current performance against baseline:

```bash
npm run lighthouse:baseline -- --compare
```

## Recommended Tracking

1. **Weekly baselines** - Track performance trends over development
2. **Pre/post optimization** - Measure impact of performance improvements
3. **Release baselines** - Tag baselines with version numbers for history

## History Management

Keep 10 most recent baselines:

```bash
# List all baselines
ls -lt lighthouse/baselines/

# Clean old baselines (keep 10 most recent)
ls -t lighthouse/baselines/baseline-*.json | tail -n +11 | xargs rm
```
