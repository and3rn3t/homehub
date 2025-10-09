# HomeHub KV Worker

Cloudflare Worker API for HomeHub's key-value storage.

## Setup

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Create KV Namespace

```bash
# Production namespace
wrangler kv:namespace create "HOMEHUB_KV"

# Preview namespace (for development)
wrangler kv:namespace create "HOMEHUB_KV" --preview
```

Copy the namespace IDs to `wrangler.toml`.

### 4. Deploy Worker

```bash
npm run deploy
```

## API Endpoints

### GET /kv/:key

Get a value from KV store.

**Response:**

```json
{
  "key": "devices",
  "value": [...],
  "timestamp": 1234567890
}
```

### POST /kv/:key

Set a value in KV store.

**Request:**

```json
{
  "value": {...}
}
```

**Response:**

```json
{
  "key": "devices",
  "success": true,
  "timestamp": 1234567890
}
```

### DELETE /kv/:key

Delete a key from KV store.

**Response:**

```json
{
  "key": "devices",
  "success": true
}
```

### GET /kv

List all keys (for debugging).

**Response:**

```json
{
  "keys": ["devices", "rooms", "scenes"]
}
```

## Local Development

```bash
npm run dev
```

Worker runs at `http://localhost:8787`

## Environment Variables

Set in Cloudflare dashboard or via `wrangler secret put`:

- `AUTH_TOKEN` (optional): API authentication token
- `CORS_ORIGIN`: Allowed CORS origin (default: *)

## Security

For production, add authentication:

```typescript
if (request.headers.get('Authorization') !== `Bearer ${env.AUTH_TOKEN}`) {
  return new Response('Unauthorized', { status: 401 })
}
```
