# 🚀 Pre-Development Setup Checklist

Complete this checklist **before starting development** to ensure a smooth workflow and prevent common issues.

---

## 📊 Setup Progress Overview

```mermaid
graph LR
    A[Environment] --> B[Dependencies]
    B --> C[Cloudflare]
    C --> D[Git Setup]
    D --> E[VS Code]
    E --> F[Ready to Code!]

    style A fill:#f59e0b,stroke:#333,stroke-width:2px,color:#fff
    style B fill:#f59e0b,stroke:#333,stroke-width:2px,color:#fff
    style C fill:#f59e0b,stroke:#333,stroke-width:2px,color:#fff
    style D fill:#10b981,stroke:#333,stroke-width:2px,color:#fff
    style E fill:#10b981,stroke:#333,stroke-width:2px,color:#fff
    style F fill:#22c55e,stroke:#333,stroke-width:2px,color:#fff
```

---

## ✅ Current Status

### Already Configured ✓

- [x] TypeScript configuration (shared base + project-specific)
- [x] ESLint + Prettier setup
- [x] EditorConfig for cross-editor consistency
- [x] VS Code workspace settings
- [x] Git ignore patterns
- [x] Project documentation
- [x] Extension recommendations

---

## 📋 Complete Setup Checklist

### 1️⃣ **Node.js Version Management** 🟡 Recommended

**Status**: ⚠️ Needs configuration
**Time**: 5 minutes
**Priority**: Medium

**Why**: Ensures everyone uses the same Node.js version.

✅ **Done**: Created `.nvmrc` and `.volta.json` files

**Next Steps**:

#### Option A: Using nvm (Node Version Manager)

```bash
# Install nvm first: https://github.com/nvm-sh/nvm

# Then use it:
nvm use          # Automatically uses version from .nvmrc
nvm install      # If version not installed yet
```

#### Option B: Using Volta (Recommended for Windows)

```bash
# Install Volta: https://volta.sh/

# Then:
cd c:\git\homehub
# Volta automatically reads .volta.json and uses correct versions
```

#### Option C: Manual

```bash
# Verify your Node.js version:
node --version   # Should be v20.19.0 or compatible

# If wrong version, install from: https://nodejs.org/
```

---

### 2️⃣ **Environment Variables** 🔴 Required

**Status**: ⚠️ Needs configuration
**Time**: 5 minutes
**Priority**: Critical

**Why**: Required for app to connect to Cloudflare Worker API.

**Steps**:

```bash
# 1. Copy the example file
cp .env.example .env

# 2. Edit .env with your values
# For now, keep default for local development:
VITE_KV_API_URL=http://localhost:8787
```

**Important**: The `.env` file is gitignored - never commit it!

---

### 3️⃣ **Install Dependencies** 🔴 Required

**Status**: ⚠️ Needs installation
**Time**: 2-3 minutes
**Priority**: Critical

**Steps**:

```bash
# Install main project dependencies
npm install

# Install worker dependencies
cd workers
npm install
cd ..
```

**Verify**:

```bash
# Check that node_modules exists
ls node_modules        # Should show packages
ls workers/node_modules  # Should show packages
```

---

### 4️⃣ **Cloudflare Account Setup** 🔴 Required for Deployment

**Status**: ⚠️ Needs configuration
**Time**: 10-15 minutes
**Priority**: High (for deployment)

#### 4a. Create Cloudflare Account

1. Go to <https://dash.cloudflare.com/sign-up>
2. Sign up (free tier is fine!)
3. Verify your email

#### 4b. Install Wrangler CLI

```bash
# Install globally
npm install -g wrangler

# Or use npx (no global install needed)
npx wrangler --version
```

#### 4c. Login to Cloudflare

```bash
# This opens browser for authentication
npx wrangler login
```

#### 4d. Create KV Namespace

```bash
cd workers

# Create production namespace
npx wrangler kv:namespace create "HOMEHUB_KV"
# Returns: id = "abc123..."

# Create preview namespace (for testing)
npx wrangler kv:namespace create "HOMEHUB_KV" --preview
# Returns: preview_id = "xyz789..."
```

#### 4e. Update `workers/wrangler.toml`

```toml
# Replace YOUR_NAMESPACE_ID and YOUR_PREVIEW_NAMESPACE_ID with actual IDs
kv_namespaces = [
  { binding = "HOMEHUB_KV", id = "abc123...", preview_id = "xyz789..." }
]
```

---

### 5️⃣ **Git Configuration** 🟡 Recommended

**Status**: ⚠️ Needs configuration
**Time**: 5 minutes
**Priority**: Medium

#### 5a. Configure Git User

```bash
# Set your name and email
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Or globally:
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

#### 5b. Set Up Git Hooks (Optional but Recommended)

**Install Husky for Git Hooks**:

```bash
npm install --save-dev husky lint-staged
npx husky init
```

**Create Pre-Commit Hook**:

```bash
# .husky/pre-commit
#!/bin/sh
npm run validate
```

**Add to package.json**:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

#### 5c. Configure Line Endings (Windows)

```bash
# Ensure consistent line endings
git config core.autocrlf false
git config core.eol lf
```

---

### 6️⃣ **VS Code Extensions** 🔴 Required

**Status**: ⚠️ Needs installation
**Time**: 5 minutes
**Priority**: Critical

**Steps**:

1. Open project in VS Code: `code .`
2. When prompted: **"This workspace has extension recommendations"**
3. Click **"Install All"**
4. Reload window: `Ctrl+Shift+P` → "Reload Window"

**Or manually**:

```bash
# Via Command Palette
Ctrl+Shift+P → "Extensions: Show Recommended Extensions"
# Click Install on each
```

**Verify Installation**:

- [ ] ESLint extension active (check status bar)
- [ ] Prettier set as default formatter
- [ ] Tailwind CSS autocomplete working
- [ ] Open `.tsx` file and save - should auto-format

**Reference**: See [EXTENSIONS_QUICKREF.md](./EXTENSIONS_QUICKREF.md)

---

### 7️⃣ **Verify TypeScript Setup** 🟡 Recommended

**Status**: ⚠️ Needs verification
**Time**: 2 minutes
**Priority**: Medium

```bash
# Check for TypeScript errors
npm run type-check

# Should output: "No errors found"
```

**If errors appear**: Run validation to see all issues:

```bash
npm run validate
```

---

### 8️⃣ **Test Local Development** 🔴 Required

**Status**: ⚠️ Needs testing
**Time**: 5 minutes
**Priority**: Critical

#### 8a. Start Worker (Terminal 1)

```bash
npm run worker:dev
# Should start on http://localhost:8787
```

#### 8b. Start Frontend (Terminal 2)

```bash
npm run dev
# Should start on http://localhost:5173
```

#### 8c. Verify

1. Open <http://localhost:5173> in browser
2. You should see HomeHub dashboard
3. Check browser console - no errors
4. Toggle a device - should save to localStorage

**Troubleshooting**:

- If Worker fails: Check port 8787 is free
- If Frontend fails: Check port 5173 is free
- If KV fails: Worker needs proper wrangler.toml config

---

### 9️⃣ **Code Quality Checks** 🟡 Recommended

**Status**: ⚠️ Needs verification
**Time**: 3 minutes
**Priority**: Medium

Run all validation checks:

```bash
# Run everything at once
npm run validate

# Or individually:
npm run type-check     # TypeScript
npm run lint           # ESLint
npm run format:check   # Prettier
```

**Expected Result**: All checks should pass ✅

**If issues found**:

```bash
# Auto-fix what's possible
npm run lint:fix
npm run format
```

---

### 🔟 **Documentation Review** 🟢 Optional

**Status**: ✅ Complete
**Time**: 10-15 minutes
**Priority**: Low (but valuable)

**Recommended Reading Order**:

1. [README.md](../README.md) - Project overview
2. [CONFIGURATION_QUICKREF.md](./CONFIGURATION_QUICKREF.md) - Config summary
3. [EXTENSIONS_QUICKREF.md](../EXTENSIONS_QUICKREF.md) - Extensions guide
4. [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
5. [BEST_PRACTICES.md](./BEST_PRACTICES.md) - Coding standards

**Reference Documentation** (as needed):

- [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) - Deployment guide
- [CONFIGURATION.md](./CONFIGURATION.md) - Full config details
- [EXTENSIONS_GUIDE.md](./EXTENSIONS_GUIDE.md) - Extension details
- [SECURITY.md](./SECURITY.md) - Security guidelines

---

### 1️⃣1️⃣ **Optional: Database GUI** 🟢 Optional

**Status**: ⚠️ Optional setup
**Time**: 5 minutes
**Priority**: Low

**For viewing KV data**:

```bash
# Option 1: Wrangler CLI
npx wrangler kv:key list --namespace-id=YOUR_NAMESPACE_ID

# Option 2: Cloudflare Dashboard
# Visit: https://dash.cloudflare.com
# Navigate: Workers & Pages → KV → Your namespace
```

---

### 1️⃣2️⃣ **Optional: Performance Monitoring** 🟢 Optional

**Status**: ⚠️ Optional setup
**Time**: 10 minutes
**Priority**: Low

**Consider adding**:

- **Sentry** - Error tracking
- **Cloudflare Analytics** - Performance metrics
- **Lighthouse CI** - Performance budgets

**Not needed for initial development**.

---

## 🎯 Quick Start Script

Save this as `setup.sh` (or `setup.ps1` for PowerShell):

```bash
#!/bin/bash

echo "🚀 HomeHub Development Setup"
echo "=============================="

# 1. Copy environment file
if [ ! -f .env ]; then
  echo "📝 Creating .env file..."
  cp .env.example .env
  echo "✅ .env created (edit if needed)"
else
  echo "✅ .env already exists"
fi

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm install
cd workers && npm install && cd ..
echo "✅ Dependencies installed"

# 3. Verify setup
echo "🔍 Running validation..."
npm run validate

# 4. Show next steps
echo ""
echo "✨ Setup complete! Next steps:"
echo "1. Configure Cloudflare (see checklist)"
echo "2. Install VS Code extensions"
echo "3. Run 'npm run dev' to start developing"
```

**Run it**:

```bash
chmod +x setup.sh
./setup.sh
```

---

## ✅ Final Verification Checklist

Before you start coding, verify:

### Environment

- [ ] Node.js v20.19.0 installed (or compatible)
- [ ] `.env` file exists and configured
- [ ] All dependencies installed (`node_modules/` exists)

### Cloudflare

- [ ] Cloudflare account created
- [ ] Wrangler CLI installed and logged in
- [ ] KV namespaces created
- [ ] `workers/wrangler.toml` updated with KV IDs

### Development Tools

- [ ] VS Code extensions installed
- [ ] ESLint working (see inline errors)
- [ ] Prettier formatting on save
- [ ] Tailwind autocomplete working

### Verification

- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `npm run format:check` passes
- [ ] `npm run worker:dev` starts successfully
- [ ] `npm run dev` starts successfully
- [ ] App loads in browser at <http://localhost:5173>

### Optional

- [ ] Git hooks configured (Husky)
- [ ] Documentation reviewed
- [ ] Git user configured

---

## 🚨 Common Issues & Solutions

### Issue: "Command not found: npm"

**Solution**: Install Node.js from <https://nodejs.org/>

### Issue: "Port 5173 already in use"

**Solution**:

```bash
# Kill process on port
npx kill-port 5173
# Or use different port
npm run dev -- --port 3000
```

### Issue: "Cannot find module '@types/node'"

**Solution**:

```bash
npm install --save-dev @types/node
```

### Issue: "ESLint not working in VS Code"

**Solution**:

1. Install ESLint extension
2. Reload window: `Ctrl+Shift+P` → "Reload Window"
3. Check output: `Ctrl+Shift+P` → "ESLint: Show Output Channel"

### Issue: "Worker fails to start"

**Solution**: Check `workers/wrangler.toml` has valid KV namespace IDs

### Issue: "TypeScript errors everywhere"

**Solution**:

```bash
# Clear cache and rebuild
rm -rf node_modules/.cache
npm run type-check
```

---

## 📞 Getting Help

If you're stuck:

1. **Check Documentation**: `docs/` folder has detailed guides
2. **Check Issues**: Look for similar problems in project issues
3. **Cloudflare Docs**: <https://developers.cloudflare.com/>
4. **VS Code Docs**: <https://code.visualstudio.com/docs>

---

## 🎉 Ready to Code

Once all critical items (🔴) are complete:

```bash
# Terminal 1: Start Worker
npm run worker:dev

# Terminal 2: Start Frontend
npm run dev

# Open browser
# http://localhost:5173
```

**Happy coding!** 🚀

---

## 📊 Setup Time Estimate

| Section            | Time   | Priority     |
| ------------------ | ------ | ------------ |
| Node.js Version    | 5 min  | Medium       |
| Environment Vars   | 5 min  | **Critical** |
| Install Deps       | 3 min  | **Critical** |
| Cloudflare Setup   | 15 min | **Critical** |
| Git Config         | 5 min  | Medium       |
| VS Code Extensions | 5 min  | **Critical** |
| Verify TypeScript  | 2 min  | Medium       |
| Test Local Dev     | 5 min  | **Critical** |
| Code Quality       | 3 min  | Medium       |
| Documentation      | 15 min | Low          |

**Total Time**: ~30 min (critical items only) | ~60 min (everything)
