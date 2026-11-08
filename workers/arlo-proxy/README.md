# HomeHub Arlo Proxy

Cloudflare Worker that sits between the browser and the Arlo cloud API. It exists for two reasons:

1. **CORS**: `myapi.arlo.com` does not allow direct browser requests.
2. **Token custody**: it is the only place the Arlo session token lives. The browser uploads the
   token once and afterwards only sees metadata (captured/expires times). An XSS bug in the app
   cannot read it, because it is not in `localStorage`, memory or any response.

## Routes

| Route                  | Purpose                                                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /health`          | Public liveness check                                                                                                                                         |
| `GET /session`         | Token metadata `{ exists, capturedAt, expiresAt, source }`, never the secret                                                                                  |
| `PUT /session`         | Store a token: `{ authorization, xcloudid?, authVersion?, expiresAt? }`. Omit `xcloudid` on a refresh to reuse the stored one. Lifetime is capped at 36 hours |
| `DELETE /session`      | Forget the token                                                                                                                                              |
| `/proxy/<encoded-url>` | Media/CDN passthrough, restricted to `https://*.arlo.com`, sent **without** credentials                                                                       |
| anything else          | Forwarded to `https://myapi.arlo.com/<path>` with the stored `authorization`, `auth-version` and `xcloudid` injected                                          |

Client-supplied `authorization`, `xcloudid`, `auth-version`, `cookie` and `Cf-*` headers are never
forwarded upstream. If Arlo rejects the stored token (401/403) the response carries
`x-homehub-arlo: token-rejected`; with no stored token the proxy answers 401
`{ "error": "arlo_session_missing" }`.

## Security model

- **Fail closed**: every route except `/health` needs a valid Cloudflare Access JWT (or the
  optional `AUTH_TOKEN` service token). Verification is shared with the KV worker (`../src/auth.ts`).
- **CORS** headers only for origins in `ALLOWED_ORIGINS`; never `*`. Same-origin traffic through the
  Pages Function needs none.
- **No public URL** (`workers_dev = false`). The app reaches it through the `ARLO_PROXY` service
  binding via `functions/api/arlo/[[path]].ts`, which serves `/api/arlo/*`.
- The token is stored in its own KV namespace (`ARLO_KV`), separate from the app-state KV that the
  browser can read through the KV worker.
- Logs contain method, upstream host and status only. Paths and queries can carry signed credentials.

## Setup

```bash
# 1. Create the token namespace once, then paste the returned id into wrangler.toml (ARLO_KV)
npx wrangler kv namespace create ARLO_SESSION

# 2. Deploy (from the repo root)
npm run proxy:deploy
```

Deploy only after the Pages Function and the Access application are in place; see
`docs/deployment/SECURITY.md` for the rollout order. Entering a token: Security tab, "Refresh
token" (paste the cURL command or headers copied from `my.arlo.com`).

## Local development

```bash
# workers/arlo-proxy/.dev.vars (gitignored)
AUTH_TOKEN=<random string>

# .env.local (gitignored), same value, deliberately not VITE_-prefixed
KV_DEV_AUTH_TOKEN=<same string>

npm run proxy:dev   # worker on :8788
npm run dev         # Vite proxies /api/arlo/* to it and adds the token server-side
```

## Tests

`npx vitest run workers/arlo-proxy` covers auth, session custody, header injection and stripping,
host restrictions and CORS.
