# GitHub CI/CD Monitoring Scripts

Quick reference for checking GitHub Actions CI/CD workflow status from VS Code and terminal.

---

## 🚀 Quick Start

### Check Latest CI Run

```bash
npm run ci:check
```

### Watch Until Complete

```bash
npm run ci:watch
```

### Open in Browser

```bash
npm run ci:open
```

---

## 📋 NPM Scripts

| Command                    | Description                   | Output                         |
| -------------------------- | ----------------------------- | ------------------------------ |
| `npm run ci:check`         | Show latest workflow run      | Status, commit, duration, URL  |
| `npm run ci:check:all`     | Show last 5 workflow runs     | Multiple run summaries         |
| `npm run ci:check:verbose` | Show with job details         | Includes individual job status |
| `npm run ci:watch`         | Poll every 10s until complete | Live updates, auto-exit        |
| `npm run ci:open`          | Open latest run in browser    | Opens GitHub Actions page      |

---

## 🖥️ VS Code Tasks

Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and type "Tasks: Run Task", then select:

### Available Tasks

1. **CI: Check Status** 📊
   - Quick status check of latest run
   - Shows commit, branch, duration
   - Displays workflow URL

2. **CI: Check All Runs** 📋
   - Lists last 5 workflow runs
   - Compare recent runs
   - See historical patterns

3. **CI: Watch Until Complete** 👀
   - Monitors workflow in real-time
   - Updates every 10 seconds
   - Auto-exits when done

4. **CI: Watch with Notifications (PowerShell)** 🔔
   - Windows desktop notifications
   - Rich formatting
   - Opens browser on completion

5. **CI: Open in Browser** 🌐
   - Opens GitHub Actions page
   - No terminal output

6. **Run All Tests** 🧪
   - Execute full test suite (175 tests)
   - Default test task

7. **Run Tests with Coverage** 📊
   - Generate coverage reports
   - Shows coverage percentages

8. **Full Validation** ✅
   - Type-check + lint + format
   - Default build task

### Keyboard Shortcuts

You can bind tasks to keyboard shortcuts in VS Code:

1. Open `Preferences: Open Keyboard Shortcuts (JSON)`
2. Add custom bindings:

```json
[
  {
    "key": "ctrl+shift+c",
    "command": "workbench.action.tasks.runTask",
    "args": "CI: Check Status"
  },
  {
    "key": "ctrl+shift+w",
    "command": "workbench.action.tasks.runTask",
    "args": "CI: Watch Until Complete"
  }
]
```

---

## 🔧 PowerShell Script (Advanced)

For Windows users with more features:

### Basic Usage

```powershell
.\scripts\check-ci.ps1
```

### Watch Mode with Notifications

```powershell
.\scripts\check-ci.ps1 -Watch -Notify
```

### Show All Runs

```powershell
.\scripts\check-ci.ps1 -All
```

### Open in Browser

```powershell
.\scripts\check-ci.ps1 -Open
```

### Verbose Mode (with Job Details)

```powershell
.\scripts\check-ci.ps1 -Verbose
```

### Combined Options

```powershell
.\scripts\check-ci.ps1 -Watch -Notify -Open -Verbose
```

---

## 📊 Output Examples

### Quick Check

```
Checking CI/CD status for and3rn3t/homehub...

Latest workflow run:

✅ COMPLETED ✅ success
Commit:   feat: Add CI/CD pipeline with coverage badges
Branch:   main (3312e52)
Started:  2 minutes ago (2025-10-13 13:29:06)
Duration: 3m 42s
URL:      https://github.com/and3rn3t/homehub/actions/runs/123456789
```

### Watch Mode

```
👀 Watching CI/CD status (Ctrl+C to stop)...

⏳ IN_PROGRESS
Commit:   feat: Add new feature
Branch:   main (abc1234)
Duration: 1m 23s

⏳ Still running... Checking again in 10 seconds

✅ Workflow completed with status: success
```

### All Runs

```
Last 5 workflow runs:

───────────────────────────────────────────────────────
Run #1
✅ COMPLETED ✅ success
Commit:   feat: Add CI/CD pipeline
Duration: 3m 42s

───────────────────────────────────────────────────────
Run #2
❌ COMPLETED ❌ failure
Commit:   fix: TypeScript errors
Duration: 2m 15s

───────────────────────────────────────────────────────
Run #3
✅ COMPLETED ✅ success
Commit:   test: Add test suite
Duration: 4m 08s
```

---

## 🔐 GitHub Token (Optional)

For higher API rate limits, set a GitHub token:

### Windows (PowerShell)

```powershell
$env:GITHUB_TOKEN = "ghp_your_token_here"
```

### macOS/Linux (Bash)

```bash
export GITHUB_TOKEN="ghp_your_token_here"
```

### Permanent Setup

Add to your shell profile:

**Windows** (`$PROFILE` in PowerShell):

```powershell
$env:GITHUB_TOKEN = "ghp_your_token_here"
```

**macOS/Linux** (`~/.bashrc` or `~/.zshrc`):

```bash
export GITHUB_TOKEN="ghp_your_token_here"
```

### Create a Token

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `workflow`
4. Copy token and set environment variable

**Without token**: 60 requests/hour
**With token**: 5,000 requests/hour

---

## 🎯 Common Use Cases

### Before Pushing Code

```bash
# Run full validation locally
npm run validate
npm test

# Push and watch CI
git push
npm run ci:watch
```

### After Pushing

```bash
# Quick check
npm run ci:check

# If still running, watch it
npm run ci:watch

# Or open in browser
npm run ci:open
```

### Debugging Failed Runs

```bash
# Check with verbose output
npm run ci:check:verbose

# See recent history
npm run ci:check:all

# Open in browser for logs
npm run ci:open
```

### During Development

```bash
# In one terminal: watch CI
npm run ci:watch

# In another terminal: keep working
npm run dev
```

---

## 🔍 Status Indicators

| Symbol | Status                  | Meaning                    |
| ------ | ----------------------- | -------------------------- |
| ✅     | `completed` / `success` | Workflow passed all checks |
| ❌     | `completed` / `failure` | Workflow failed            |
| ⏳     | `in_progress`           | Currently running          |
| ⏸️     | `queued` / `waiting`    | Waiting to start           |
| ⚫     | `cancelled`             | Manually cancelled         |
| ⏭️     | `skipped`               | Step was skipped           |
| ⏱️     | `timed_out`             | Exceeded time limit        |
| ⚠️     | `action_required`       | Manual action needed       |

---

## 🛠️ Troubleshooting

### Script Not Found

```bash
# Make sure scripts are executable
chmod +x scripts/check-ci.js scripts/check-ci.ps1
```

### Permission Denied (PowerShell)

```powershell
# Allow script execution
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### API Rate Limit

```bash
# Set GitHub token (see above)
# Or wait for rate limit to reset (1 hour)
```

### No Workflow Runs Found

- Make sure you've pushed commits
- Check that `.github/workflows/ci.yml` exists
- Verify workflow has been triggered

---

## 📚 Related Commands

| Command                 | Purpose                  |
| ----------------------- | ------------------------ |
| `npm test`              | Run tests locally        |
| `npm run test:coverage` | Generate coverage report |
| `npm run validate`      | Run all quality checks   |
| `npm run lint`          | Check code style         |
| `npm run type-check`    | Check TypeScript         |
| `git push`              | Push and trigger CI      |

---

## 🎉 Tips & Tricks

1. **Alias for Quick Access** (add to `~/.bashrc` or `~/.zshrc`):

   ```bash
   alias ci='npm run ci:check'
   alias ciw='npm run ci:watch'
   ```

2. **Watch in Background** (macOS/Linux):

   ```bash
   npm run ci:watch &
   ```

3. **Chain Commands**:

   ```bash
   npm run validate && git push && npm run ci:watch
   ```

4. **Desktop Notifications** (PowerShell only):

   ```powershell
   .\scripts\check-ci.ps1 -Watch -Notify
   ```

5. **Open Multiple Terminals**:
   - Terminal 1: `npm run dev` (development server)
   - Terminal 2: `npm run ci:watch` (monitor CI)
   - Terminal 3: Free for git commands

---

## 📝 Script Locations

- **Node.js Script**: `scripts/check-ci.js`
- **PowerShell Script**: `scripts/check-ci.ps1`
- **VS Code Tasks**: `.vscode/tasks.json`
- **NPM Scripts**: `package.json`
- **This Guide**: `docs/guides/CI_MONITORING.md`

---

## 🔗 GitHub Actions URL

Direct link to your workflows:

```
https://github.com/and3rn3t/homehub/actions
```

View specific workflow:

```
https://github.com/and3rn3t/homehub/actions/workflows/ci.yml
```

---

**Last Updated**: October 13, 2025
