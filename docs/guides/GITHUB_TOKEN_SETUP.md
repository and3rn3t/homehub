# GitHub Personal Access Token Setup

Quick guide to create a GitHub token for CI monitoring scripts and API access.

---

## 🎯 Why You Need a Token

Without a token:

- **Rate Limit**: 60 API requests per hour
- **Public data only**: Can't access private repositories

With a token:

- **Rate Limit**: 5,000 API requests per hour
- **Full access**: Private repos, workflow runs, detailed logs
- **Better for**: Frequent CI checks, automation scripts, development workflows

---

## 🔐 Creating Your Token

### Step 1: Go to GitHub Settings

Open this URL in your browser:

```
https://github.com/settings/tokens
```

Or navigate manually:

1. Click your profile picture (top-right corner)
2. Select **Settings**
3. Scroll to bottom of sidebar → **Developer settings**
4. Click **Personal access tokens** → **Tokens (classic)**

### Step 2: Generate New Token

1. Click **"Generate new token (classic)"** button
2. You'll be asked to confirm your password

### Step 3: Configure Token Settings

**Note/Name**: Give it a descriptive name

```
HomeHub CI Monitoring
```

**Expiration**: Choose how long the token should work

- **30 days** - Most secure (recommended for testing)
- **60 days** - Good for active development
- **90 days** - For longer projects
- **No expiration** - Less secure but convenient

**Select scopes**: Check these boxes

✅ **repo** (Full control of private repositories)

- Includes: `repo:status`, `repo_deployment`, `public_repo`, `repo:invite`, `security_events`
- Needed for: Accessing workflow runs, reading repository data

✅ **workflow** (Update GitHub Action workflows)

- Needed for: Viewing workflow runs, checking CI status

**Optional** (not needed for CI monitoring):

- ⬜ `admin:org` - Organization management
- ⬜ `admin:repo_hook` - Repository webhooks
- ⬜ `delete_repo` - Delete repositories

### Step 4: Generate and Copy Token

1. Scroll to bottom and click **"Generate token"**
2. **IMPORTANT**: Copy the token immediately!

   ```
   ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. ⚠️ **You cannot see this token again!** Store it securely.

---

## 💾 Storing Your Token

### Option 1: Environment Variable (Temporary - This Session Only)

**Windows PowerShell**:

```powershell
$env:GITHUB_TOKEN = "ghp_your_token_here"
```

**Windows CMD**:

```cmd
set GITHUB_TOKEN=ghp_your_token_here
```

**macOS/Linux (Bash/Zsh)**:

```bash
export GITHUB_TOKEN="ghp_your_token_here"
```

**Verify it's set**:

```powershell
# PowerShell
echo $env:GITHUB_TOKEN

# Bash/Zsh
echo $GITHUB_TOKEN
```

### Option 2: PowerShell Profile (Permanent - Every PowerShell Session)

**Find your profile location**:

```powershell
$PROFILE
```

Example output:

```
C:\Users\YourName\Documents\PowerShell\Microsoft.PowerShell_profile.ps1
```

**Create/edit the profile**:

```powershell
# Create profile if it doesn't exist
if (!(Test-Path -Path $PROFILE)) {
    New-Item -ItemType File -Path $PROFILE -Force
}

# Open in VS Code
code $PROFILE
```

**Add this line**:

```powershell
# GitHub Personal Access Token for CI monitoring
$env:GITHUB_TOKEN = "ghp_your_token_here"
```

**Reload profile**:

```powershell
. $PROFILE
```

### Option 3: Bash/Zsh Profile (macOS/Linux)

**Edit your shell profile**:

```bash
# For Bash
nano ~/.bashrc

# For Zsh (macOS default)
nano ~/.zshrc
```

**Add this line**:

```bash
# GitHub Personal Access Token
export GITHUB_TOKEN="ghp_your_token_here"
```

**Reload profile**:

```bash
# For Bash
source ~/.bashrc

# For Zsh
source ~/.zshrc
```

### Option 4: VS Code Settings (Project-Specific)

**Not recommended** - Tokens in files can be accidentally committed to Git!

If you must, use `.env` file with `.gitignore`:

```bash
# Create .env file (already in .gitignore)
echo "GITHUB_TOKEN=ghp_your_token_here" > .env
```

---

## ✅ Testing Your Token

### Test with CI Script

```bash
npm run ci:check
```

**Expected output** (with token):

```
Checking CI/CD status for and3rn3t/homehub...

Latest workflow run:

✅ COMPLETED ✅ success
Commit: ...
```

**Without token** (rate limited):

```
Checking CI/CD status for and3rn3t/homehub...
(Works but limited to 60 requests/hour)
```

### Test with GitHub CLI

```bash
gh auth status
```

### Test with curl

```bash
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user
```

Should return your GitHub user information.

---

## 🔒 Security Best Practices

### DO ✅

1. **Store tokens securely**
   - Use environment variables
   - Never commit tokens to Git

2. **Use minimal scopes**
   - Only grant permissions you need
   - CI monitoring needs: `repo`, `workflow`

3. **Set expiration dates**
   - Rotate tokens regularly
   - Use 30-90 day expiration

4. **Use separate tokens**
   - Different token for each tool/script
   - Easier to revoke if compromised

5. **Check .gitignore**
   - Ensure `.env` is ignored
   - Never expose tokens in code

### DON'T ❌

1. **Don't commit tokens to Git**

   ```bash
   # BAD - Token visible in repository
   const token = "ghp_xxxxx"
   ```

2. **Don't share tokens**
   - Each person should create their own
   - Don't send tokens via email/Slack

3. **Don't use in public repos**
   - GitHub Actions have built-in tokens
   - Use secrets for CI/CD

4. **Don't grant unnecessary permissions**
   - More permissions = more risk
   - Review scope requirements

---

## 🔄 Revoking/Regenerating Tokens

### If Token is Compromised

1. Go to: https://github.com/settings/tokens
2. Find the token in the list
3. Click **"Delete"** or **"Revoke"**
4. Generate a new token
5. Update your environment variable

### If Token Expired

1. Go to: https://github.com/settings/tokens
2. Click the token name
3. Click **"Regenerate token"**
4. Copy the new token
5. Update your environment variable

---

## 📝 Token Scopes Reference

For CI monitoring, you need:

| Scope             | Permission               | Required?                 |
| ----------------- | ------------------------ | ------------------------- |
| `repo`            | Full repository access   | ✅ Yes                    |
| `repo:status`     | Commit status access     | ✅ Yes (included in repo) |
| `workflow`        | GitHub Actions workflows | ✅ Yes                    |
| `read:org`        | Organization data        | ⬜ No                     |
| `user`            | User profile data        | ⬜ No                     |
| `admin:repo_hook` | Repository webhooks      | ⬜ No                     |

---

## 🐛 Troubleshooting

### "Bad credentials" Error

**Problem**: Token is invalid or expired

**Solution**:

1. Check token format: `ghp_` followed by 36 characters
2. Verify token hasn't expired
3. Regenerate token if needed

### "Not Found" Error

**Problem**: Token doesn't have required permissions

**Solution**:

1. Check token scopes include `repo` and `workflow`
2. Regenerate with correct permissions

### Rate Limit Still Low

**Problem**: Token not being used

**Solution**:

```powershell
# Verify token is set
echo $env:GITHUB_TOKEN

# Should show: ghp_xxxxx...
# If blank, token isn't set
```

### Token Not Persisting

**Problem**: Environment variable resets after closing terminal

**Solution**:

- Add to PowerShell profile (see Option 2 above)
- Or set system environment variable:
  1. Windows Search → "Environment Variables"
  2. User variables → New
  3. Name: `GITHUB_TOKEN`
  4. Value: `ghp_your_token_here`

---

## 🎯 Quick Reference

### Create Token

```
https://github.com/settings/tokens → Generate new token (classic)
Scopes: repo, workflow
```

### Set Token (PowerShell)

```powershell
$env:GITHUB_TOKEN = "ghp_your_token_here"
```

### Test Token

```bash
npm run ci:check
```

### Permanent Setup (PowerShell)

```powershell
Add-Content $PROFILE "`n`$env:GITHUB_TOKEN = 'ghp_your_token_here'"
```

---

## 📚 Related Documentation

- [GitHub Token Documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [CI Monitoring Guide](CI_MONITORING.md)
- [GitHub Actions Security](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)

---

**Last Updated**: October 13, 2025
