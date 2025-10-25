# Arlo Wildcard Proxy - Architecture Documentation

**Date**: October 14, 2025
**Component**: `workers/arlo-proxy/index.ts`
**Status**: ✅ Complete

## Overview

The Arlo Wildcard Proxy is a Cloudflare Worker that proxies **any** `*.arlo.com` domain request to bypass CORS restrictions. This makes the system resilient to Arlo's infrastructure changes (e.g., new CDN domains, API endpoints).

## Problem Statement

### Original Issue

When the browser tried to load camera thumbnails, it made direct requests to Arlo's CDN:

```
GET https://arlolastimage-z2.arlo.com/bd5438f548ec4730966aa68a65c99f24/.../lastImage.jpg
Origin: http://localhost:5173
```

**Result**: CORS error - Arlo's CDN doesn't allow cross-origin requests from arbitrary domains.

### Architecture Fragility

Hardcoding specific Arlo domains (e.g., `myapi.arlo.com`, `arlolastimage-z2.arlo.com`) creates maintenance burden:

- Arlo frequently changes CDN infrastructure
- New services may use different subdomains
- Each new domain requires code updates

## Solution: Wildcard Proxy

### Design Principle

**Proxy ANY Arlo domain through a single endpoint with security validation**

Instead of:

```typescript
// ❌ Fragile: Hardcoded domains
if (url.includes('myapi.arlo.com')) {
  /* proxy */
}
if (url.includes('arlolastimage-z2.arlo.com')) {
  /* proxy */
}
if (url.includes('arlostreaming21203-z2-prod.wowza.arlo.com')) {
  /* proxy */
}
// ... what about arlolastimage-z3? z4? new-cdn-2026.arlo.com?
```

We use:

```typescript
// ✅ Resilient: Wildcard with validation
if (targetHost.endsWith('.arlo.com') || targetHost === 'arlo.com') {
  // Proxy any Arlo domain
}
```

## Implementation

### Worker Endpoint Formats

#### 1. Standard API Requests (Default)

```
Request:  GET https://arlo-proxy.workers.dev/hmsweb/users/devices
Proxies:  GET https://myapi.arlo.com/hmsweb/users/devices
```

**Use Case**: Arlo Cloud API calls (authentication, device management, commands)

#### 2. Wildcard Proxy (New)

```
Request:  GET https://arlo-proxy.workers.dev/proxy/<encoded-url>
Proxies:  GET <decoded-url> (if *.arlo.com)
```

**Use Cases**:

- Camera snapshots: `arlolastimage-z2.arlo.com`, `arlolastimage-z3.arlo.com`, etc.
- Video streaming: `arlostreaming*.wowza.arlo.com`
- Future CDNs: Any new `*.arlo.com` subdomain

### Security Validation

```typescript
const parsedUrl = new URL(targetUrl)
const targetHost = parsedUrl.hostname

// Whitelist validation
if (!targetHost.endsWith('.arlo.com') && targetHost !== 'arlo.com') {
  return new Response(
    JSON.stringify({
      error: 'Invalid domain',
      message: 'Only *.arlo.com domains are allowed through this proxy',
    }),
    { status: 403 }
  )
}
```

**Security Features**:

1. **Domain Whitelist**: Only `*.arlo.com` and `arlo.com` allowed
2. **No Open Proxy**: Cannot proxy arbitrary internet URLs
3. **Prevents Abuse**: Blocks attempts to use proxy for non-Arlo resources
4. **Logging**: All requests logged with domain name for monitoring

### Example Requests

#### Snapshot Image

```javascript
// Original URL (CORS blocked)
const arloUrl = 'https://arlolastimage-z2.arlo.com/.../lastImage.jpg?AWSAccessKeyId=...'

// Proxied URL
const proxyUrl = 'http://localhost:8788/proxy/' + encodeURIComponent(arloUrl)
// Result: http://localhost:8788/proxy/https%3A%2F%2Farlolastimage-z2.arlo.com%2F...

// Browser fetches from localhost:8788 (same-origin), worker fetches from Arlo
fetch(proxyUrl) // ✅ Works! No CORS error
```

#### Video Stream Manifest

```javascript
// DASH manifest from Wowza CDN
const streamUrl = 'https://arlostreaming21203-z2-prod.wowza.arlo.com:80/.../stream.mpd'

// No proxy needed for DASH.js (it handles CORS differently)
// But if needed in future:
const proxyUrl = `http://localhost:8788/proxy/${encodeURIComponent(streamUrl)}`
```

#### Future-Proof Example

```javascript
// Arlo launches new CDN in 2026
const newCdnUrl = 'https://arlo-cdn-2026-us-west.arlo.com/v2/images/camera123.webp'

// No code changes needed! Wildcard proxy handles it automatically
const proxyUrl = `http://localhost:8788/proxy/${encodeURIComponent(newCdnUrl)}`
```

## Client-Side Integration

### Helper Function

```typescript
/**
 * Proxy Arlo URLs through our worker to bypass CORS
 */
function getProxiedUrl(arloUrl: string | undefined): string {
  if (!arloUrl) return ''

  // If URL is already from our proxy, return as-is
  if (arloUrl.includes('localhost:8788') || arloUrl.includes('arlo-proxy')) {
    return arloUrl
  }

  // Only proxy Arlo domains
  if (arloUrl.includes('.arlo.com')) {
    const proxyBaseUrl = import.meta.env.VITE_ARLO_PROXY_URL || 'http://localhost:8788'
    return `${proxyBaseUrl}/proxy/${encodeURIComponent(arloUrl)}`
  }

  // Return original URL for non-Arlo domains
  return arloUrl
}
```

### Usage Examples

#### CameraDetailsModal.tsx

```typescript
// Snapshot display
useEffect(() => {
  if (!camera || !open) return

  const refreshSnapshot = () => {
    setSnapshotUrl(getProxiedUrl(camera.snapshotUrl))
  }

  refreshSnapshot()
  const interval = setInterval(refreshSnapshot, 10000)
  return () => clearInterval(interval)
}, [camera, open])

// Snapshot download
const handleDownloadSnapshot = async () => {
  const proxiedUrl = getProxiedUrl(camera.snapshotUrl)
  const response = await fetch(proxiedUrl)
  const blob = await response.blob()
  // ... trigger download
}
```

#### UniversalVideoPlayer.tsx

```typescript
// Snapshot fallback
if (error && snapshotUrl) {
  const proxiedSnapshotUrl = getProxiedUrl(snapshotUrl)
  return <img src={proxiedSnapshotUrl} alt={cameraName} />
}
```

## Request Flow Diagram

```
┌──────────────┐
│   Browser    │
│ localhost:   │
│     5173     │
└──────┬───────┘
       │
       │ 1. fetch('http://localhost:8788/proxy/https%3A%2F%2Farlolastimage-z2.arlo.com%2F...')
       ▼
┌──────────────┐
│ Arlo Proxy   │
│   Worker     │
│ localhost:   │
│     8788     │
└──────┬───────┘
       │
       │ 2. Decode URL: https://arlolastimage-z2.arlo.com/...
       │ 3. Validate: ends with '.arlo.com'? ✅
       │ 4. Fetch from Arlo CDN
       ▼
┌──────────────┐
│  Arlo CDN    │
│ arlolastimage│
│ -z2.arlo.com │
└──────┬───────┘
       │
       │ 5. Return image + CORS headers
       ▼
┌──────────────┐
│   Browser    │
│ (renders img)│
└──────────────┘
```

## Configuration

### Environment Variables

```bash
# .env (optional)
VITE_ARLO_PROXY_URL=http://localhost:8788

# Production
VITE_ARLO_PROXY_URL=https://arlo-proxy.your-domain.workers.dev
```

### Worker Deployment

```bash
# Development
npm run proxy:dev   # Starts on localhost:8788

# Production
cd workers/arlo-proxy
wrangler deploy
```

## Benefits

### 1. **Future-Proof Architecture**

- ✅ Handles ANY new Arlo subdomain automatically
- ✅ No code changes when Arlo updates infrastructure
- ✅ Works with CDNs, APIs, streaming servers, etc.

### 2. **Security**

- ✅ Whitelist validation (only `*.arlo.com`)
- ✅ No open proxy vulnerability
- ✅ All requests logged for monitoring

### 3. **Performance**

- ✅ Single worker handles all Arlo domains
- ✅ No multiple proxy endpoints to maintain
- ✅ Cloudflare edge caching for repeated resources

### 4. **Developer Experience**

- ✅ Simple `getProxiedUrl()` helper function
- ✅ Works with any `fetch()` or `<img>` tag
- ✅ Automatic detection of Arlo URLs

## Testing

### Test Cases

1. **Snapshot Images**

   ```bash
   # Direct (CORS error)
   curl 'https://arlolastimage-z2.arlo.com/.../lastImage.jpg' \
     -H 'Origin: http://localhost:5173'
   # Result: CORS error

   # Through proxy (success)
   curl 'http://localhost:8788/proxy/https%3A%2F%2Farlolastimage-z2.arlo.com%2F...%2FlastImage.jpg'
   # Result: 200 OK with image
   ```

2. **Security Validation**

   ```bash
   # Valid Arlo domain
   curl 'http://localhost:8788/proxy/https%3A%2F%2Fnew-cdn.arlo.com%2Ftest'
   # Result: 200 (or 404 if doesn't exist, but proxy works)

   # Invalid domain (blocked)
   curl 'http://localhost:8788/proxy/https%3A%2F%2Fevil.com%2Fmalware.exe'
   # Result: 403 Forbidden - "Only *.arlo.com domains are allowed"
   ```

3. **URL Encoding**

   ```bash
   # Complex URL with query params
   curl 'http://localhost:8788/proxy/https%3A%2F%2Farlolastimage-z2.arlo.com%2Fimage.jpg%3FAWSAccessKeyId%3DAKIA...%26Expires%3D1760565744%26Signature%3Da52wIJec...'
   # Result: 200 OK with image
   ```

### Integration Testing

1. Open camera modal in app
2. Check browser DevTools Network tab
3. Verify snapshot loads: `localhost:8788/proxy/https%3A%2F%2Farlolastimage-z2.arlo.com%2F...`
4. Click "Download Snapshot" - should download image
5. Click "Refresh Snapshot" - should fetch new image through proxy

## Known Arlo Domains (Auto-Handled)

Current Arlo infrastructure (as of October 2025):

- `myapi.arlo.com` - Main API
- `arlolastimage-z2.arlo.com` - Snapshot images
- `arlostreaming21203-z2-prod.wowza.arlo.com` - DASH video streams
- `*.arlo.com` - Any future subdomains

**All automatically proxied with no code changes!**

## Troubleshooting

### Issue: 403 Forbidden

**Cause**: Trying to proxy non-Arlo domain
**Solution**: Verify URL contains `.arlo.com`

### Issue: 404 Not Found

**Cause**: Arlo resource doesn't exist (expired, moved)
**Solution**: Check Arlo API, refresh authentication token

### Issue: Images not loading

**Cause**: Worker not running
**Solution**: Run `npm run proxy:dev` or check worker logs

### Issue: Double encoding

**Cause**: URL encoded twice
**Solution**: Check if `getProxiedUrl()` already applied, don't re-encode

## Future Enhancements

1. **Caching**: Cache snapshot images in worker KV for faster loads
2. **Rate Limiting**: Add rate limiting to prevent abuse
3. **Analytics**: Track which Arlo domains are used most
4. **Compression**: Compress images on-the-fly for bandwidth savings
5. **WebP Conversion**: Convert JPEGs to WebP for better compression
6. **Smart Retry**: Retry failed requests with exponential backoff

## Related Files

- **Worker**: `workers/arlo-proxy/index.ts` (138 lines)
- **Helper**: `src/components/CameraDetailsModal.tsx` (lines 24-43)
- **Helper**: `src/components/UniversalVideoPlayer.tsx` (lines 10-29)
- **Documentation**: `docs/guides/SERVER_MANAGEMENT.md`

---

**Result**: Arlo Wildcard Proxy provides a robust, future-proof solution for bypassing CORS on ANY Arlo domain with built-in security validation. No more hardcoded domains or code updates when Arlo changes infrastructure! 🎉
