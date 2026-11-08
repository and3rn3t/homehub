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
