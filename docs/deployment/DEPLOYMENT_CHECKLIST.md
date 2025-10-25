# 🚀 Deployment Checklist

**Last Updated**: January 2025  
**Status**: Ready for Cloudflare deployment

---

## ✅ Pre-Deployment Verification

### Code Migration

- [x] Removed GitHub Spark dependency
- [x] Updated all 20+ components to use custom `useKV` hook
- [x] Removed `spark.meta.json`
- [x] Updated `package.json` (removed Spark, added deploy scripts)
- [x] Updated `vite.config.ts` (removed Spark plugins)
- [x] Created Cloudflare Worker (REST API)
- [x] Created custom `useKV` hook (caching + optimistic updates)
- [x] Updated documentation (README, copilot instructions)

### Local Testing

- [ ] Run `npm install` successfully
- [ ] Run `npm run dev` without errors
- [ ] Test all 11 sections render correctly
- [ ] Add/edit/delete devices, rooms, scenes
- [ ] Refresh browser - verify data persists in localStorage
- [ ] Check browser console - no errors
- [ ] Check Network tab - no failed requests (Worker not deployed yet)

---

## 🔧 Cloudflare Worker Setup

### 1. Install Worker Dependencies

```bash
cd workers
npm install
```

**Expected packages**:

- `@cloudflare/workers-types`
- `typescript`
- `wrangler`

### 2. Login to Cloudflare

```bash
wrangler login
```

Opens browser to authenticate. Select your Cloudflare account.

### 3. Create KV Namespaces

```bash
# Production namespace
wrangler kv:namespace create "HOMEHUB_KV"

# Preview namespace (for local dev)
wrangler kv:namespace create "HOMEHUB_KV" --preview
```

**Save these IDs!** You'll get output like:

```text
✅ [[kv_namespaces]]
binding = "HOMEHUB_KV"
id = "abc123def456..."  # SAVE THIS
preview_id = "xyz789uvw012..."  # SAVE THIS
```

### 4. Update Worker Configuration

Edit `workers/wrangler.toml`, replace namespace IDs:

```toml
kv_namespaces = [
  { binding = "HOMEHUB_KV", id = "YOUR_PRODUCTION_ID", preview_id = "YOUR_PREVIEW_ID" }
]
```

### 5. Deploy Worker

```bash
npm run deploy
```

**Save the Worker URL** from output:

```text
Published homehub-kv-worker (1.23 sec)
  https://homehub-kv-worker.your-subdomain.workers.dev
```

### 6. Test Worker

```bash
# Health check
curl https://your-worker-url.workers.dev/health

# Should return:
# {"status":"healthy","environment":"production","timestamp":1704067200}

# Test write
curl -X POST https://your-worker-url.workers.dev/kv/test \
  -H "Content-Type: application/json" \
  -d '{"value":"Hello Cloudflare!"}'

# Test read
curl https://your-worker-url.workers.dev/kv/test
# Should return: {"value":"Hello Cloudflare!"}
```

---

## 🌐 Frontend Configuration

### 1. Update Environment File

Edit `.env` in project root:

```env
VITE_KV_API_URL=https://your-worker-url.workers.dev
# VITE_KV_AUTH_TOKEN=optional-secret-token
```

### 2. Test Local Development

```bash
# Terminal 1: Run Worker locally
cd workers
npm run dev

# Terminal 2: Run React app
cd ..
npm run dev
```

Open <http://localhost:5173>

**Test checklist**:

- [ ] Dashboard renders without errors
- [ ] Add a device → appears in UI
- [ ] Refresh page → device still there ✅
- [ ] Check DevTools Network → see POST to `/kv/devices`
- [ ] Check localStorage → see cached data

### 3. Build for Production

```bash
npm run build
```

**Expected output**:

- Vite builds successfully
- No TypeScript errors
- `dist/` folder created with optimized assets

---

## ☁️ Cloudflare Pages Deployment

### Option A: GitHub Integration (Recommended)

1. **Push to GitHub**

   ```bash
   git add .
   git commit -m "Migrate to Cloudflare infrastructure"
   git push origin main
   ```

2. **Connect to Cloudflare Pages**
   - Go to <https://dash.cloudflare.com>
   - Navigate to **Workers & Pages** → **Create application** → **Pages**
   - Click **Connect to Git**
   - Select your `homehub` repository
   - Configure build:
     - **Build command**: `npm run build`
     - **Build output directory**: `dist`
     - **Node version**: `20`

3. **Set Environment Variables**
   - In Pages project settings → **Environment variables**
   - Add: `VITE_KV_API_URL` = `https://your-worker-url.workers.dev`
   - Apply to: **Production** and **Preview**

4. **Deploy**
   - Click **Save and Deploy**
   - Wait ~3 minutes for first deployment

5. **Get Your URL**
   - Cloudflare provides: `https://homehub.pages.dev`
   - Or add custom domain in settings

### Option B: CLI Deployment

```bash
# Install Wrangler globally if not already
npm install -g wrangler

# Deploy from dist/ folder
npm run build
wrangler pages deploy dist --project-name homehub
```

---

## 🧪 Production Testing

### 1. Test Deployed App

Open your Cloudflare Pages URL (e.g., `https://homehub.pages.dev`)

**Test checklist**:

- [ ] Dashboard loads without errors
- [ ] All 11 tabs accessible
- [ ] Add device → persists after refresh
- [ ] Create scene → persists after refresh
- [ ] Flow designer loads and renders nodes
- [ ] Check browser console → no errors
- [ ] Check Network tab → Worker requests succeed

### 2. Test Data Persistence

1. Add a device called "Test Light"
2. Close browser tab
3. Reopen app → device should still exist ✅
4. Clear localStorage in DevTools
5. Refresh → device still exists (loaded from Cloudflare KV) ✅

### 3. Test Worker Health

```bash
curl https://your-worker-url.workers.dev/health
```

Should return `200 OK` with:

```json
{
  "status": "healthy",
  "environment": "production",
  "timestamp": 1704067200
}
```

### 4. Performance Check

- **Lighthouse Score**: Run in Chrome DevTools
  - Target: 90+ Performance, 100 Accessibility
- **Network Latency**: Check in DevTools Network tab
  - Target: <200ms for KV API calls
- **First Contentful Paint**: Should be <1 second

---

## 🔐 Optional: Add Authentication

### Set Auth Token in Worker

```bash
cd workers
wrangler secret put AUTH_TOKEN
# Enter your secure token (generate with: openssl rand -base64 32)
```

### Uncomment Auth Check in Worker

Edit `workers/src/index.ts`, find:

```typescript
// if (!checkAuth(request, env)) {
//   return errorResponse('Unauthorized', 401)
// }
```

Remove comment markers:

```typescript
if (!checkAuth(request, env)) {
  return errorResponse('Unauthorized', 401)
}
```

### Update Frontend .env

Add auth token:

```env
VITE_KV_AUTH_TOKEN=your-secure-token
```

### Redeploy Both

```bash
# Redeploy worker
cd workers
npm run deploy

# Redeploy pages (if using GitHub, push changes)
cd ..
git add .
git commit -m "Add authentication"
git push
```

---

## 📊 Monitoring Setup

### Worker Analytics

1. Go to Cloudflare Dashboard → **Workers & Pages**
2. Select `homehub-kv-worker`
3. View **Metrics** tab:
   - Requests per second
   - Errors
   - Execution time
   - CPU time

### KV Storage Monitoring

1. In Cloudflare Dashboard → **Workers & Pages** → **KV**
2. View `HOMEHUB_KV` namespace
3. Monitor:
   - Storage used (1GB free tier limit)
   - Read/write operations
   - Key count

### Pages Analytics

1. In Pages project settings → **Analytics**
2. Enable **Web Analytics** (free)
3. View:
   - Page views
   - Unique visitors
   - Core Web Vitals

---

## 🚨 Troubleshooting

### Issue: "Failed to fetch" errors in app

**Cause**: Worker URL not configured or Worker not deployed

**Fix**:

1. Verify `.env` has correct `VITE_KV_API_URL`
2. Check Worker is deployed: `wrangler deployments list`
3. Test Worker health endpoint: `curl https://your-worker-url.workers.dev/health`

### Issue: CORS errors in browser console

**Cause**: CORS headers missing (shouldn't happen with deployed Worker)

**Fix**:

- Verify Worker is deployed (not just local)
- Check Worker logs: `cd workers && wrangler tail`
- Ensure Worker returns CORS headers in response

### Issue: Data not persisting

**Cause**: KV namespace not bound correctly

**Fix**:

1. Check `workers/wrangler.toml` has correct namespace IDs
2. Redeploy Worker: `cd workers && npm run deploy`
3. Verify in Cloudflare Dashboard → **KV** that namespace exists

### Issue: TypeScript build errors

**Cause**: Type definitions missing

**Fix**:

```bash
npm install
rm -rf node_modules package-lock.json
npm install
```

### Issue: Worker build fails

**Cause**: Missing dependencies in workers/

**Fix**:

```bash
cd workers
rm -rf node_modules package-lock.json
npm install
```

---

## ✅ Post-Deployment Checklist

- [ ] Worker deployed and healthy
- [ ] Pages deployed successfully
- [ ] Environment variables set correctly
- [ ] Data persists across browser sessions
- [ ] All 11 sections load without errors
- [ ] Performance meets targets (Lighthouse 90+)
- [ ] No console errors in production
- [ ] Custom domain added (optional)
- [ ] Analytics enabled
- [ ] Documentation updated with URLs

---

## 🎉 Deployment Complete

Your HomeHub is now live on Cloudflare's global edge network!

**Access your app**:

- Production: <https://homehub.pages.dev> (or your custom domain)
- Worker API: <https://your-worker-url.workers.dev>

**Next Steps**:

1. Share URL with friends/family for testing
2. Monitor analytics for usage patterns
3. Start planning Phase 2 (real device integration)
4. Join Cloudflare Discord for support

**Resources**:

- Cloudflare Dashboard: <https://dash.cloudflare.com>
- Worker Logs: `cd workers && wrangler tail`
- Pages Logs: Cloudflare Dashboard → Pages → Project → Deployments
- Documentation: `docs/CLOUDFLARE_DEPLOYMENT.md`

---

**Questions?** See `docs/CLOUDFLARE_DEPLOYMENT.md` for detailed guide.  
**Issues?** Check troubleshooting section above.  
**Success?** Celebrate! 🎊 You just deployed a full-stack app to Cloudflare's edge network!
