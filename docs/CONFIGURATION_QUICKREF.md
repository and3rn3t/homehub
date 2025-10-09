# 🚀 HomeHub Configuration Quick Reference

## 📋 File Structure

```text
homehub/
├── .vscode/
│   ├── settings.json         # VS Code workspace settings
│   └── extensions.json       # Recommended extensions
├── docs/
│   └── CONFIGURATION.md      # Full configuration guide
├── src/
│   └── types/
│       └── env.d.ts          # Environment variable types
├── workers/
│   └── tsconfig.json         # Worker TypeScript config
├── .editorconfig             # Editor formatting rules
├── .env.example              # Environment template
├── .eslintrc.js              # ESLint configuration
├── .gitignore                # Git ignore patterns
├── .prettierrc.json          # Prettier formatting
├── .prettierignore           # Prettier ignore patterns
├── tsconfig.base.json        # Shared TypeScript config
└── tsconfig.json             # Main TypeScript config
```

## 🎯 Key Commands

| Command                 | Description                            |
| ----------------------- | -------------------------------------- |
| `npm run dev`           | Start Vite dev server (port 5173)      |
| `npm run worker:dev`    | Start Worker dev server (port 8787)    |
| `npm run build`         | Build frontend for production          |
| `npm run worker:deploy` | Deploy Worker to Cloudflare            |
| `npm run lint`          | Check for linting errors               |
| `npm run lint:fix`      | Auto-fix linting errors                |
| `npm run format`        | Format code with Prettier              |
| `npm run format:check`  | Check code formatting                  |
| `npm run type-check`    | Run TypeScript compiler check          |
| `npm run validate`      | Run all checks (lint + format + types) |

## 🔧 Configuration Hierarchy

```
tsconfig.base.json (shared)
    ├── tsconfig.json (frontend)
    └── workers/tsconfig.json (backend)

.editorconfig (all editors)
    ├── VS Code (.vscode/settings.json)
    └── Other editors

.prettierrc.json (formatting)
    └── eslint.config.js (linting)
```

## 🌍 Environment Variables

### Frontend (.env)

```bash
VITE_KV_API_URL=http://localhost:8787
VITE_KV_AUTH_TOKEN=optional-token
```

### Worker (workers/.dev.vars)

```bash
AUTH_TOKEN=optional-token
ENVIRONMENT=development
```

## ✨ VS Code Setup

1. Install recommended extensions (prompt appears on first open)
2. Reload VS Code after installing extensions
3. Settings auto-apply from `.vscode/settings.json`

## 🎨 Code Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes (`'`)
- **Semicolons**: No (`;`)
- **Line Width**: 100 characters
- **Line Endings**: LF (`\n`)

## 🔍 Type Safety

All imports should use path aliases:

```typescript
import { useKV } from '@/hooks/use-kv' // ✅ Good
import { useKV } from '../hooks/use-kv' // ❌ Bad
```

## 🚨 Before Commit

```bash
npm run validate  # Ensures everything passes
```

## 📖 Need More Info?

See [docs/CONFIGURATION.md](./CONFIGURATION.md) for full details.
