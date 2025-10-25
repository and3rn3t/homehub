# Arlo API Proxy Worker

Cloudflare Worker that proxies requests to Arlo Cloud API to bypass CORS restrictions.

## Why This Exists

Arlo's API (`myapi.arlo.com`) doesn't allow direct browser requests due to CORS (Cross-Origin Resource Sharing) restrictions. This proxy worker:

1. ✅ Accepts requests from your HomeHub app
2. ✅ Forwards them to Arlo API with proper headers
3. ✅ Returns responses with CORS headers enabled
4. ✅ Keeps your auth tokens secure (never stored/logged)

## Development

### Start Local Proxy Server

```bash
npm run proxy:dev
```

This starts the worker at `http://localhost:8788`

### Start Full Dev Environment (App + Proxy)

```bash
npm run dev:full
```

This runs both:

- Vite dev server at `http://localhost:5173` (HomeHub app)
- Wrangler proxy at `http://localhost:8788` (Arlo proxy)

## Deployment

### Deploy to Cloudflare Workers

```bash
npm run proxy:deploy
```

This deploys the worker to Cloudflare's edge network.

### Get Worker URL

After deployment, Cloudflare will provide a URL like:

```
https://homehub-arlo-proxy.your-subdomain.workers.dev
```

### Update ArloAdapter

Update `src/services/devices/ArloAdapter.ts` line 32:

```typescript
const ARLO_API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:8788'
  : 'https://homehub-arlo-proxy.YOUR-SUBDOMAIN.workers.dev' // ← Update this
```

## How It Works

### Request Flow

```
HomeHub App (localhost:5173)
    ↓
Cloudflare Worker Proxy (localhost:8788 or workers.dev)
    ↓
Arlo Cloud API (myapi.arlo.com)
    ↓
Response + CORS Headers
    ↓
HomeHub App
```

### Example Request

**App sends:**

```
GET http://localhost:8788/hmsweb/users/devices
Headers:
  - Authorization: 2_oVQxGhmXyVsFJcZo...
  - Auth-Version: 2
  - xcloudid: K5HYEUA3-2400-336-127845809
```

**Proxy forwards to:**

```
GET https://myapi.arlo.com/hmsweb/users/devices
Headers:
  - Authorization: 2_oVQxGhmXyVsFJcZo...
  - Auth-Version: 2
  - xcloudid: K5HYEUA3-2400-336-127845809
```

**Proxy returns:**

```
Response: 200 OK
Headers:
  - Access-Control-Allow-Origin: *
  - Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
  - Access-Control-Allow-Headers: Content-Type, Authorization, Auth-Version, xcloudid
Body: { success: true, data: [...] }
```

## Security Notes

- **No Token Storage**: Worker never stores auth tokens
- **No Logging**: Worker logs only request paths (not headers/body)
- **Pass-Through Only**: Worker forwards requests as-is
- **CORS Headers**: Enables browser access while maintaining security

## Testing

### Test Proxy Locally

1. Start proxy: `npm run proxy:dev`
2. Test with curl:

```bash
curl http://localhost:8788/hmsweb/users/devices \
  -H "Authorization: 2_YOUR_TOKEN_HERE" \
  -H "Auth-Version: 2" \
  -H "xcloudid: YOUR_XCLOUDID_HERE"
```

3. Should return Arlo device list

### Test with HomeHub App

1. Start full dev: `npm run dev:full`
2. Open `http://localhost:5173`
3. Navigate to Security tab
4. Should load real Arlo cameras without CORS errors

## Troubleshooting

### Port 8788 Already in Use

Change port in `package.json`:

```json
"proxy:dev": "wrangler dev workers/arlo-proxy/index.ts --port 8789"
```

Update `ArloAdapter.ts`:

```typescript
const ARLO_API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:8789' // ← Changed
  : '...'
```

### Worker Not Forwarding Headers

Check worker logs:

```bash
wrangler tail homehub-arlo-proxy
```

### CORS Errors Still Occurring

1. Verify proxy is running: `curl http://localhost:8788`
2. Check browser DevTools → Network tab → verify requests going to `localhost:8788`
3. Check response headers include `Access-Control-Allow-Origin: *`

## Production Considerations

### Rate Limiting (Recommended)

Add to `wrangler.toml`:

```toml
[env.production]
rate_limit = { requests = 100, period = 60 }
```

### Custom Domain

Add custom route:

```toml
routes = [
  { pattern = "arlo.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

### Environment Variables

For production secrets:

```bash
wrangler secret put ARLO_API_KEY
```

## Cost

- **Free Tier**: 100,000 requests/day
- **Paid Plans**: $0.50 per million requests

For typical HomeHub usage (personal use, 1-5 users):

- Free tier is more than sufficient
- ~1,000 requests/day = 30,000/month = **$0.00**

## References

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
