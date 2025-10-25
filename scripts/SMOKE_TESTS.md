# Smoke Tests

Comprehensive smoke tests for HomeHub production deployment.

## 🎯 Overview

Three smoke test scripts to verify deployment health:

1. **Frontend Tests** (`smoke-test-frontend.js`) - Tests the React app
2. **Worker Tests** (`smoke-test-worker.js`) - Tests the Cloudflare Worker API
3. **All Tests** (`smoke-test-all.js`) - Runs both test suites

## 📦 Installation

Install Playwright for browser testing:

```bash
npm install --save-dev playwright
```

## 🚀 Usage

### Run All Tests (Recommended)

```bash
npm run smoke
```

### Run Individual Test Suites

```bash
# Frontend only
npm run smoke:frontend

# Worker only
npm run smoke:worker
```

## 📋 Test Coverage

### Frontend Tests (10 tests)

- ✅ Page loads with 200 OK
- ✅ HTML structure (title, root element)
- ✅ React app renders content
- ✅ JavaScript/CSS bundles load
- ✅ No console errors
- ✅ No failed network requests
- ✅ Worker API communication
- ✅ Navigation elements present
- ✅ Theme system active
- ✅ Performance metrics (load time, transfer size)

### Worker Tests (12 tests)

- ✅ Health check endpoint
- ✅ CORS configuration
- ✅ OPTIONS preflight requests
- ✅ List KV keys (GET /kv)
- ✅ Write to KV (POST /kv/:key)
- ✅ Read from KV (GET /kv/:key)
- ✅ Delete from KV (DELETE /kv/:key)
- ✅ Verify deletion (404 check)
- ✅ Error handling (invalid keys)
- ✅ Invalid route handling
- ✅ Cloudflare infrastructure headers
- ✅ Response time (<500ms target)

## 📊 Exit Codes

- `0` - All tests passed (or warnings only)
- `1` - One or more tests failed

## 🔧 Configuration

Tests target production URLs:

- **Frontend**: `https://homehub.andernet.dev`
- **Worker**: `https://homehub-kv-worker.andernet.workers.dev`

To test different environments, edit the URLs in the script files:

```javascript
const FRONTEND_URL = 'https://your-domain.com'
const WORKER_URL = 'https://your-worker.workers.dev'
```

## 🧪 Example Output

```bash
$ npm run smoke

🧪 HomeHub Production Deployment - Comprehensive Smoke Tests
======================================================================
Testing:
  • Frontend: https://homehub.andernet.dev
  • Worker:   https://homehub-kv-worker.andernet.workers.dev
======================================================================

🔧 Worker API Tests
======================================================================
✅ Health endpoint returns 200
✅ CORS headers present
✅ Write operation succeeds
...

📄 Frontend App Tests
======================================================================
✅ Page loads with 200 OK
✅ React app renders content
✅ No console errors
...

📊 Final Test Summary
======================================================================
✅ Worker API Tests
✅ Frontend App Tests

⏱️  Total Duration: 12.34s
✅ Passed: 2/2

🎉 ALL TESTS PASSED - DEPLOYMENT VERIFIED!
```

## 🐛 Troubleshooting

### Playwright Installation Issues

```bash
# Install Playwright browsers
npx playwright install chromium
```

### Timeout Errors

- Check network connectivity
- Verify production URLs are accessible
- Increase timeout values in scripts (default: 30s frontend, 10s worker)

### KV Eventual Consistency

- Worker tests may show warnings for read-after-write operations
- This is normal due to Cloudflare KV's eventual consistency model
- Warnings don't fail the test suite

## 📝 CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Run Smoke Tests
  run: npm run smoke
```

## 🔄 When to Run

Run smoke tests:

- ✅ After every production deployment
- ✅ After environment variable changes
- ✅ After worker updates
- ✅ Before announcing new features
- ✅ During incident investigations

## 📖 Related Documentation

- [Deployment Guide](../docs/deployment/CLOUDFLARE_DEPLOYMENT.md)
- [Post-Deployment Logging Setup](../POST_DEPLOYMENT_LOGGING_SETUP.md)
- [Architecture Overview](../docs/guides/ARCHITECTURE.md)
