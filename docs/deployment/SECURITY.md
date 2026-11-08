# KV Worker Security

The KV worker (`workers/src/index.ts`) **fails closed**: every route except `GET /health`
returns `401` unless the request carries one of:

1. A valid **Cloudflare Access JWT** (`Cf-Access-Jwt-Assertion`) — browser traffic
2. A valid **service token** (`Authorization: Bearer <AUTH_TOKEN>`) — scripts/CLI

With neither configured, nothing but `/health` is reachable.

## Configuration

| Name                 | Kind       | Purpose                                                                          |
| -------------------- | ---------- | -------------------------------------------------------------------------------- |
| `ACCESS_TEAM_DOMAIN` | var        | e.g. `your-team.cloudflareaccess.com` (JWT issuer + JWKS source)                 |
| `ACCESS_AUD`         | var        | Audience tag of the Access application protecting the site                       |
| `AUTH_TOKEN`         | **secret** | Optional service token: `wrangler secret put AUTH_TOKEN`                         |
| `ALLOWED_ORIGINS`    | var        | Comma-separated origins that receive CORS headers (dev: `http://localhost:5173`) |
| `WRITE_LIMITER`      | binding    | Rate limit for `POST`/`DELETE` (60 / minute / IP)                                |

CORS headers are only sent for origins in `ALLOWED_ORIGINS`. Same-origin traffic through the
Pages Function needs none.

## Never put secrets in `VITE_*`

Anything prefixed `VITE_` is inlined into the public JS bundle. Do not store tokens there.

## Rollout order

1. Create the Access application for the Pages domain (email allowlist policy); note its AUD tag.
2. Set `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD` in `workers/wrangler.toml`.
3. Ship the Pages Function + service binding (issue #322) so the browser reaches the worker same-origin.
4. Deploy the worker (`workers_dev = false` removes the public `workers.dev` URL).
5. Rotate/remove any previously used `AUTH_TOKEN`.

Deploying step 4 before step 3 cuts the app off from its backend.

## Deployment environment

Deploy the **default** environment only (`npm run deploy` in `workers/`). Wrangler does not
inherit `vars` or bindings (KV, rate limit) into `[env.*]` sections, so `deploy:production` and
`deploy:staging` produce a worker without the Access config. It fails closed (401 on everything
except `/health`) rather than exposing data, but it is not a working deployment.

## Key rotation

Access signing keys are cached for 10 minutes. A token with an unknown key ID triggers at most one
refetch per minute, shared across concurrent requests, so unauthenticated traffic cannot drive
unbounded certificate fetches.

## Local development

The worker rejects unauthenticated requests locally too. The Vite dev server proxies `/kv` and
`/api/logs` to `http://localhost:8787` and adds the service token **server-side**, so nothing
secret enters the browser bundle:

1. `workers/.dev.vars` (gitignored): `AUTH_TOKEN=<random string>`
2. `.env.local` (gitignored): `KV_DEV_AUTH_TOKEN=<same string>` (deliberately not `VITE_`-prefixed)
3. `npm run dev:all`

Leave `VITE_KV_API_URL` unset; the app then calls the dev server's own origin.

## Arlo proxy and token custody

The Arlo session token is held by the Arlo proxy worker (`workers/arlo-proxy`), never by the
browser. It has the same fail-closed Access check as the KV worker, no public URL, and is reached
through the `ARLO_PROXY` service binding at `/api/arlo/*`. Details: `workers/arlo-proxy/README.md`.

Rollout, in order:

1. `npx wrangler kv namespace create ARLO_SESSION`; paste the id into `workers/arlo-proxy/wrangler.toml`
2. Merge, so Pages deploys the Function and the `ARLO_PROXY` binding
3. `npm run proxy:deploy` (replaces the old open proxy and removes its public URL)
4. Open the Security tab once; a token left in `localStorage` by an older version is uploaded to the
   proxy and deleted from the browser automatically. Otherwise paste a fresh token.

Local development additionally needs `AUTH_TOKEN` in `workers/arlo-proxy/.dev.vars` (same value as
`KV_DEV_AUTH_TOKEN`) and `npm run proxy:dev`.
