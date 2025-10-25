# 🚀 Quick Setup Guide

**Time to complete**: 30 minutes (critical items only)

---

## ⚡ Super Quick Start (5 minutes)

```bash
# 1. Run setup script
./scripts/setup.ps1    # Windows PowerShell
# or
./scripts/setup.sh     # Mac/Linux

# 2. Open in VS Code
code .

# 3. Install extensions when prompted
# Click "Install All"

# 4. Start development
npm run worker:dev     # Terminal 1
npm run dev            # Terminal 2
```

---

## 🔴 Critical Setup (Must Do Before Coding)

### 1. Environment File (2 min)

```bash
cp .env.example .env
# Keep defaults for now
```

### 2. Install Dependencies (3 min)

```bash
npm install
cd workers && npm install && cd ..
```

### 3. VS Code Extensions (5 min)

- Open project: `code .`
- Click "Install All" when prompted
- Reload VS Code

### 4. Test Local Dev (5 min)

```bash
# Terminal 1
npm run worker:dev

# Terminal 2
npm run dev

# Open: http://localhost:5173
```

**Done!** You can start coding now. ✅

---

## 🟡 Important Setup (Do Soon)

### 5. Cloudflare Account (15 min)

```bash
# a. Sign up at https://dash.cloudflare.com/sign-up

# b. Login via CLI
npx wrangler login

# c. Create KV namespaces
cd workers
npx wrangler kv:namespace create "HOMEHUB_KV"
npx wrangler kv:namespace create "HOMEHUB_KV" --preview

# d. Update workers/wrangler.toml with IDs returned above
```

**Note**: You can develop locally without this, but need it for deployment.

---

## 🟢 Optional Setup (Nice to Have)

### 6. Git Hooks

```bash
npm install --save-dev husky lint-staged
npx husky init
```

### 7. Node Version Manager

```bash
# nvm (Mac/Linux)
nvm use

# Or volta (Windows recommended)
# Auto-reads .volta.json
```

---

## ✅ Verification Checklist

Before you start coding:

- [ ] `.env` file exists
- [ ] Dependencies installed (`node_modules/` exists)
- [ ] VS Code extensions installed
- [ ] `npm run dev` works
- [ ] `npm run worker:dev` works
- [ ] App loads at <http://localhost:5173>

---

## 🆘 Quick Troubleshooting

| Problem             | Solution                                           |
| ------------------- | -------------------------------------------------- |
| Port already in use | `npx kill-port 5173` or `npx kill-port 8787`       |
| ESLint not working  | Reload VS Code: `Ctrl+Shift+P` → "Reload Window"   |
| TypeScript errors   | `rm -rf node_modules/.cache && npm run type-check` |
| Worker won't start  | Check `workers/wrangler.toml` configuration        |

---

## 📚 Full Documentation

See [docs/SETUP_CHECKLIST.md](./docs/SETUP_CHECKLIST.md) for complete details.

---

## 🎯 Commands Reference

| Command              | What It Does               |
| -------------------- | -------------------------- |
| `npm run dev`        | Start frontend (port 5173) |
| `npm run worker:dev` | Start worker (port 8787)   |
| `npm run build`      | Build for production       |
| `npm run lint`       | Check code quality         |
| `npm run format`     | Auto-format code           |
| `npm run validate`   | Run all checks             |
| `npm run type-check` | Check TypeScript           |

---

**Ready to code!** 🚀

See [docs/](./docs/) for architecture, best practices, and deployment guides.
