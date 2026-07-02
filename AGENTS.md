# AGENTS.md — HomeHub

iOS-inspired smart home dashboard: device control, live camera streaming (Arlo), mobile-optimized. React 19 + Cloudflare.

## Stack

- React 19 + TypeScript + Vite, npm (Node `>=24`, `.nvmrc` pinned)
- Radix UI, Tailwind, dnd-kit, react-hook-form
- Cloudflare Pages (`wrangler.toml`, project `homehub`) + separate workers:
  - `workers/` — main worker (`npm run worker:dev` / `worker:deploy`)
  - `workers/arlo-proxy/` — camera proxy (`npm run proxy:dev`, port 8788)
- Tests: Vitest (unit/integration/a11y in `tests/`), Playwright e2e, Lighthouse baselines

## Commands

```bash
npm install
npm run dev          # frontend only
npm run dev:full     # frontend + arlo proxy
npm run dev:all      # frontend + worker + proxy
npm run validate     # type-check && lint && format:check ← done-gate
npm run test:run     # vitest once
npm run test:e2e     # playwright
npm run smoke        # smoke-test frontend + worker
npm run deploy       # only when asked
```

## Conventions

- Some helper scripts are PowerShell (`scripts/*.ps1`) — Windows-oriented; prefer the node/npm equivalents on macOS/Linux.
- Camera/Arlo test scripts (`test:arlo:*`) hit real services; don't run them unprompted.
- `src/prd.md` documents product intent.
- Conventional commits: `type(scope): description`.
- Don't commit or deploy unless explicitly asked.
