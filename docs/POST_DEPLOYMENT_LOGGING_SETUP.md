# Post-Deployment: Cloudflare Logging Setup

**Status**: ✅ Code Ready | ⏳ Deployment Pending
**Estimated Time**: 15-30 minutes
**Prerequisites**: App successfully deployed to production

---

## 📋 What's Already Done

✅ **Phase 3B Complete** - All discovery services updated:

- 6 files modified (mDNSScanner, SSDPScanner, ProtocolDetector, HTTPScanner, DiscoveryManager, TPLinkAdapter)
- 26 console calls replaced with `logger.debug()` / `logger.error()`
- Zero TypeScript errors, build passes successfully

✅ **Logger Integration** (`src/lib/logger.ts`):

- `sendToMonitoring()` sends logs to `/api/logs` endpoint
- Production-only (checks `import.meta.env.PROD`)
- Warn/error levels only (reduces noise)
- Structured error context with stack traces

✅ **Worker Endpoints** (`workers/src/index.ts`):

- POST `/api/logs` - Store log entries (30-day TTL)
- GET `/api/logs` - Retrieve recent errors (last 100)
- `LogEntry` interface defined
- Recent-errors cache implementation

✅ **Documentation**:

- `docs/deployment/CLOUDFLARE_LOGGING_SETUP.md` (577 lines)
- `docs/development/CLOUDFLARE_LOGGING_IMPLEMENTATION.md` (250 lines)
- Complete setup guide, troubleshooting, examples

---

## 🚀 Post-Deployment Setup (5 Steps)

### Step 1: Create LOGS_KV Namespace (2 minutes)

```powershell
# Navigate to workers directory
cd workers

# Create production namespace
wrangler kv:namespace create "LOGS_KV"
# Output: Created namespace with ID: abc123...

# Create preview namespace (for wrangler dev)
wrangler kv:namespace create "LOGS_KV" --preview
# Output: Created namespace with ID: def456...
```

**Save these IDs** - you'll need them in Step 2.

---

### Step 2: Update wrangler.toml (3 minutes)

Open `workers/wrangler.toml` and add the KV namespace binding:

```toml
# ... existing configuration ...

[[kv_namespaces]]
binding = "LOGS_KV"
id = "abc123..."  # Replace with your production ID from Step 1
preview_id = "def456..."  # Replace with your preview ID from Step 1
```

**Note**: The `binding` name **must be** `LOGS_KV` to match the worker code.

---

### Step 3: Add Environment Variable (1 minute)

Add app version to your `.env` file (or `.env.production`):

```bash
# Add to .env or .env.production
VITE_APP_VERSION=1.0.0
```

This version appears in log entries for debugging.

---

### Step 4: Deploy Worker (3 minutes)

```powershell
# Still in workers/ directory
wrangler deploy

# Output should show:
# ✨ Deployment complete!
# https://homehub-worker.<your-subdomain>.workers.dev
```

**Verify deployment**:

```powershell
# Test logging endpoint (should return empty array initially)
curl https://homehub-worker.<your-subdomain>.workers.dev/api/logs
```

---

### Step 5: Test Logging (5 minutes)

#### A. Manual Test (POST a log entry)

```powershell
# Send a test error log
curl -X POST https://homehub-worker.<your-subdomain>.workers.dev/api/logs `
  -H "Content-Type: application/json" `
  -d '{
    "level": "error",
    "message": "Test error from setup",
    "timestamp": "2025-10-12T20:00:00.000Z",
    "context": {
      "error": {
        "message": "This is a test error",
        "stack": "Error: Test\n  at setup.test"
      }
    },
    "metadata": {
      "userAgent": "Setup Script",
      "url": "/setup-test"
    }
  }'

# Response should be: {"success":true}
```

#### B. Retrieve Logs (GET)

```powershell
# Fetch recent errors
curl https://homehub-worker.<your-subdomain>.workers.dev/api/logs

# Should return your test error:
# {
#   "errors": [
#     {
#       "level": "error",
#       "message": "Test error from setup",
#       ...
#     }
#   ],
#   "count": 1
# }
```

#### C. Production Test (Trigger Real Error)

1. **Open your production app**: `https://<your-pages-url>.pages.dev`
2. **Open Browser DevTools** → Console
3. **Trigger an error** (e.g., try to control an offline device)
4. **Check Cloudflare Dashboard**:
   - Go to Workers & Pages → `homehub-worker` → KV → `LOGS_KV`
   - You should see keys like `log:2025-10-12T20:15:30.123Z:abc123`
5. **Query logs via API**:

   ```powershell
   curl https://homehub-worker.<your-subdomain>.workers.dev/api/logs
   ```

---

## 🎯 Success Criteria

✅ **LOGS_KV namespace created** (production + preview)
✅ **wrangler.toml updated** with namespace IDs
✅ **Worker deployed** successfully
✅ **Test log stored** in KV (manual curl test passed)
✅ **Production errors captured** (real app errors appear in logs)

---

## 🔍 Verification Checklist

Run through this checklist to ensure everything works:

- [ ] POST `/api/logs` returns `{"success":true}`
- [ ] GET `/api/logs` returns array of log entries
- [ ] Cloudflare Dashboard shows `LOGS_KV` namespace with data
- [ ] Production app errors appear in logs within 1 minute
- [ ] `recent-errors` cache updates correctly (max 100 entries)
- [ ] 30-day TTL is set (check key expiration in dashboard)

---

## 📊 Monitoring Your Logs

### Option 1: API Endpoint (Quick Check)

```powershell
# Get recent errors anytime
curl https://homehub-worker.<your-subdomain>.workers.dev/api/logs | jq
```

### Option 2: Cloudflare Dashboard (Visual)

1. Go to **Workers & Pages** → `homehub-worker`
2. Click **KV** → `LOGS_KV`
3. Browse keys (format: `log:timestamp:id`)
4. Check `recent-errors` key for cached list

### Option 3: ErrorMonitor Component (Future Enhancement)

See `docs/deployment/CLOUDFLARE_LOGGING_SETUP.md` (lines 370-500) for a React component that displays logs in your app's UI.

**Implementation time**: ~1 hour
**Priority**: Low (nice-to-have dashboard feature)

---

## 🛠️ Troubleshooting

### Issue: "KV namespace not found"

**Symptom**: Worker returns 500 error, logs show "env.LOGS_KV is undefined"

**Fix**:

```powershell
# Verify namespace exists
wrangler kv:namespace list

# Re-check wrangler.toml binding name (must be "LOGS_KV")
# Redeploy worker
wrangler deploy
```

---

### Issue: "CORS error when posting logs"

**Symptom**: Browser console shows CORS error, logs not appearing

**Fix**: Add CORS headers to worker (already implemented in code, but verify):

```typescript
// workers/src/index.ts (lines 195-223)
// Should have:
return new Response(JSON.stringify({ success: true }), {
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // ✅ Required
  },
})
```

---

### Issue: "Logs not appearing in production"

**Checklist**:

1. ✅ Is `import.meta.env.PROD` true? (logging only works in production)
2. ✅ Is `VITE_APP_VERSION` set in build? (`npm run build` with .env.production)
3. ✅ Are you testing warn/error levels? (debug logs aren't sent to monitoring)
4. ✅ Check browser Network tab - is POST to `/api/logs` succeeding?

**Debug command**:

```javascript
// In production app console:
console.error('Test error for monitoring')
// Wait 5 seconds, then check GET /api/logs
```

---

## 📈 What's Being Logged

### Current Implementation (Phase 3B Complete)

**Discovery Services** (26 calls replaced):

- ❌ **Not logged**: Debug messages (scans, progress) - stripped in production
- ✅ **Logged**: Errors (network failures, parse errors, API errors)

**Frontend Components** (existing):

- ✅ API errors (KV store failures)
- ✅ Device control errors
- ✅ Automation execution errors

**Example Log Entry**:

```json
{
  "level": "error",
  "message": "Failed to fetch device description",
  "timestamp": "2025-10-12T20:15:30.123Z",
  "context": {
    "error": {
      "message": "Network timeout",
      "stack": "Error: timeout\n  at HTTPScanner.fetchDeviceDescription..."
    },
    "url": "http://192.168.1.100/description.xml"
  },
  "metadata": {
    "userAgent": "Mozilla/5.0...",
    "url": "https://homehub.pages.dev/",
    "appVersion": "1.0.0"
  }
}
```

---

## 🔮 Future Enhancements (Optional)

These are **not required** for basic logging but can be added later:

### 1. ErrorMonitor Dashboard Component (1 hour)

- React component showing recent errors in app UI
- Real-time error count badge
- Filter by level, search by message
- **Priority**: Medium (nice dev tool)

### 2. Email Alerts (30 minutes)

- Cloudflare Worker Cron job
- Send daily digest of errors
- Requires: Mailgun/SendGrid integration
- **Priority**: Low (manual checking is fine)

### 3. Retention Management (15 minutes)

- Increase TTL for critical errors
- Archive old logs to R2 storage
- **Priority**: Low (30 days is plenty)

### 4. Log Filtering (30 minutes)

- Query by date range
- Filter by error type
- Group by component
- **Priority**: Medium (as app grows)

---

## 📝 Documentation References

For detailed information, see:

1. **`docs/deployment/CLOUDFLARE_LOGGING_SETUP.md`** (577 lines)
   - Complete setup guide
   - Architecture diagrams
   - Security considerations
   - Advanced querying

2. **`docs/development/CLOUDFLARE_LOGGING_IMPLEMENTATION.md`** (250 lines)
   - What changed and why
   - Benefits vs. Sentry
   - Deployment checklist
   - Future roadmap

3. **`LOGGING_AND_ERROR_HANDLING_TODO.md`**
   - Original implementation plan
   - Phase 3B progress tracking

---

## ✅ When You're Done

After completing all 5 steps, **update this section**:

```markdown
## Setup Complete ✅

**Completion Date**: [YYYY-MM-DD]
**LOGS_KV Production ID**: [your-id-here]
**Worker URL**: [your-worker-url]
**First Log Timestamp**: [YYYY-MM-DD HH:MM:SS]

**Verification Results**:
- [x] Manual POST test passed
- [x] GET endpoint returns logs
- [x] Production errors captured
- [x] 30-day TTL verified
```

---

## 🎉 Benefits of This Approach

**Why post-deployment logging is smart**:

1. ✅ **Faster Launch**: Ship production app without blocking on monitoring
2. ✅ **Real Data**: Monitor actual production errors, not dev noise
3. ✅ **Zero Risk**: If logging fails, app still works perfectly
4. ✅ **Incremental**: Add monitoring without re-testing entire deployment
5. ✅ **Free**: $0/month vs Sentry's $26/month

**Code is ready** - just needs 15 minutes of wrangler commands! 🚀

---

## 📞 Need Help?

If you encounter issues:

1. **Check worker logs**: `wrangler tail` (live log streaming)
2. **Verify KV access**: Cloudflare Dashboard → KV → Permissions
3. **Test locally**: `wrangler dev` (runs worker on localhost)
4. **Review docs**: `docs/deployment/CLOUDFLARE_LOGGING_SETUP.md`

**Common gotchas**:

- KV namespace binding name **must be** `LOGS_KV` (case-sensitive)
- Worker must be deployed **after** KV namespace is created
- CORS errors? Check `Access-Control-Allow-Origin` header
- Logs not showing? Verify `import.meta.env.PROD` is `true`

---

**Ready when you are!** Complete your deployment first, then come back to this guide. 🎯
