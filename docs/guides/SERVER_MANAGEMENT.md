# Server Management Scripts

Quick reference for starting and stopping HomeHub development servers.

## Starting Servers

### Option 1: All Servers in Separate Windows (Recommended) ⭐

```bash
npm run dev:servers
```

This opens **3 separate terminal windows**:

1. **Vite Dev Server** - Frontend (http://localhost:5173)
2. **KV Worker** - Storage API (http://localhost:8787)
3. **Arlo Proxy Worker** - Camera API (http://localhost:8788)

**Pros**:

- ✅ Each server has its own window
- ✅ Easy to see logs for each service
- ✅ Can restart individual servers without affecting others
- ✅ No mixed console output

**Cons**:

- ❌ Opens multiple windows (can clutter taskbar)

---

### Option 2: All Servers in One Terminal (Concurrently)

```bash
npm run dev:all
```

Runs all 3 servers in a single terminal using `concurrently`.

**Pros**:

- ✅ Single terminal window
- ✅ All logs in one place

**Cons**:

- ❌ Mixed console output (harder to read)
- ❌ Must stop all servers together (Ctrl+C stops all)

---

### Option 3: Frontend + Arlo Proxy Only

```bash
npm run dev:full
```

Runs only Vite and Arlo Proxy (skips KV Worker).

**Use when**: Testing camera features only, don't need KV storage.

---

### Option 4: Individual Servers

Start each server manually in separate terminals:

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run worker:dev

# Terminal 3
npm run proxy:dev
```

---

## Stopping Servers

### Stop All Servers Automatically

```bash
npm run stop:servers
```

This PowerShell script kills all processes on ports 5173, 8787, and 8788.

**Or manually**:

- If using `dev:servers`: Close each terminal window
- If using `dev:all` or `dev:full`: Press `Ctrl+C` in the terminal

---

## URLs

| Service        | URL                   | Purpose                 |
| -------------- | --------------------- | ----------------------- |
| **Frontend**   | http://localhost:5173 | Main HomeHub UI         |
| **KV Worker**  | http://localhost:8787 | Key-value storage API   |
| **Arlo Proxy** | http://localhost:8788 | CORS proxy for Arlo API |

---

## Troubleshooting

### "Port already in use" error

**Cause**: A server is already running on that port.

**Fix**:

```bash
npm run stop:servers
```

Or manually kill the process:

```powershell
# Find process on port 5173
Get-NetTCPConnection -LocalPort 5173 | Select-Object OwningProcess
# Kill it
Stop-Process -Id <PID> -Force
```

---

### Servers won't start

**Check**:

1. ✅ All dependencies installed: `npm install`
2. ✅ Workers dependencies installed: `cd workers && npm install`
3. ✅ No port conflicts: `npm run stop:servers`

---

### KV Worker fails to start

**Common issues**:

- Missing `wrangler.toml` configuration
- No KV namespace created
- Wrangler not logged in: `wrangler login`

**Fix**:

```bash
cd workers
wrangler kv:namespace create "HOMEHUB_KV" --preview
```

---

## Quick Start (New Machine Setup)

```bash
# 1. Install all dependencies
npm install
cd workers && npm install && cd ..

# 2. Login to Cloudflare (if using KV)
wrangler login

# 3. Start all servers
npm run dev:servers

# 4. Open browser
# Navigate to http://localhost:5173
```

---

## Scripts Reference

| Command                | Description                             | Windows   |
| ---------------------- | --------------------------------------- | --------- |
| `npm run dev:servers`  | ⭐ Start all servers (separate windows) | 3 windows |
| `npm run dev:all`      | Start all servers (one terminal)        | 1 window  |
| `npm run dev:full`     | Start Vite + Arlo Proxy only            | 1 window  |
| `npm run stop:servers` | Stop all servers                        | -         |
| `npm run dev`          | Start Vite only                         | 1 window  |
| `npm run worker:dev`   | Start KV Worker only                    | 1 window  |
| `npm run proxy:dev`    | Start Arlo Proxy only                   | 1 window  |

---

## Files

- **Start Script**: `scripts/start-all-servers.ps1`
- **Stop Script**: `scripts/stop-all-servers.ps1`
- **Package Scripts**: `package.json` (lines 21-24)

---

**💡 Tip**: Bookmark this page for quick reference when starting development sessions!
