# How to Find the Correct Arlo API Request

## ❌ Problem: You Captured the Wrong Request

The error "Failed to parse URL" means you captured an **OPTIONS request** (CORS preflight) instead of the actual API request.

### What You Captured (WRONG ❌)

```
Method: OPTIONS
URL: /notify/A2819C7XA0386?eventId=...
Purpose: CORS preflight check
Has Auth: NO ❌
```

### What You Need (CORRECT ✅)

```
Method: GET or POST
URL: /hmsweb/users/devices
Purpose: Actual API data
Has Auth: YES ✅ (Bearer token)
```

---

## 📋 Step-by-Step: Finding the Correct Request

### Step 1: Open Chrome DevTools Network Tab

1. Go to https://my.arlo.com/ (stay logged in)
2. Press **F12** to open DevTools
3. Click **Network** tab
4. Check **"Preserve log"** checkbox
5. **IMPORTANT**: Click the filter dropdown and select **"Fetch/XHR"** (not "All")

```
[All] [Fetch/XHR] [JS] [CSS] [Img] [Media] [Font] [Doc] [WS] [Wasm] [Manifest] [Other]
       ↑↑↑↑↑↑↑↑↑↑
       SELECT THIS!
```

### Step 2: Trigger an API Request

Do ONE of these actions:

- Click on any camera thumbnail
- Click "Devices" in left menu
- Refresh the page while logged in

### Step 3: Identify the Correct Request

Look in the Network tab for requests with these characteristics:

#### ✅ CORRECT REQUEST (Use This!)

| Property   | Value                   |
| ---------- | ----------------------- |
| **Method** | GET (not OPTIONS)       |
| **Domain** | myapi.arlo.com          |
| **Path**   | `/hmsweb/users/devices` |
| **Status** | 200 OK                  |
| **Size**   | 5-50 KB (has data)      |

**Visual Identification:**

```
Name: devices
Method: GET
Status: 200
Type: xhr
Size: 15.2 KB
```

#### ❌ WRONG REQUESTS (Don't Use These!)

| Method  | Path        | Why Wrong                |
| ------- | ----------- | ------------------------ |
| OPTIONS | /notify/... | CORS preflight (no auth) |
| OPTIONS | /devices    | CORS preflight (no auth) |
| GET     | /static/... | Static assets (no auth)  |
| GET     | /img/...    | Images (no auth)         |

### Step 4: Copy as cURL

1. Find the **GET** request to `/hmsweb/users/devices`
2. **Right-click** on that request
3. Hover over **"Copy"**
4. Select **"Copy as cURL (bash)"**

```
Right-click menu:
├── Copy
│   ├── Copy link address
│   ├── Copy as cURL (bash)  ← ✅ CLICK THIS!
│   ├── Copy as PowerShell   ← ❌ DON'T USE THIS!
│   └── Copy as fetch
```

### Step 5: Verify the Copied cURL

Your clipboard should now contain something like:

```bash
curl 'https://myapi.arlo.com/hmsweb/users/devices' \
  -H 'accept: application/json' \
  -H 'authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'auth-version: 2' \
  -H 'cookie: session_id=abc123...' \
  ...
```

**Key indicators you got the right one:**

- ✅ Starts with `curl 'https://myapi.arlo.com/hmsweb/`
- ✅ Has `-H 'authorization: Bearer ...` header
- ✅ Has `-H 'auth-version: 2'` header
- ✅ Has `-H 'cookie: ...'` header (usually)
- ✅ Is several hundred lines long (lots of headers)

### Step 6: Save to File

1. Open: `scripts/arlo-captured-request.txt`
2. **Delete everything** in the file
3. **Paste** the cURL command
4. **Save** the file

### Step 7: Run Parser

```bash
node scripts/parse-curl-to-json.js
```

**Expected output:**

```
✅ Loaded cURL command from: scripts/arlo-captured-request.txt
   Length: 1234 bytes

🔍 Parsing cURL command...

✅ URL: https://myapi.arlo.com/hmsweb/users/devices
✅ Method: GET
✅ Headers: 15 found
✅ Cookies: 3 found
```

---

## 🔍 Visual Guide: Network Tab

```
Name                Method  Status  Type    Size
────────────────────────────────────────────────
❌ devices          OPTIONS 204     preflight 0 B     ← Skip this
✅ devices          GET     200     xhr       15.2 KB ← Use this!
❌ notify/A2819...  OPTIONS 204     preflight 0 B     ← Skip this
❌ notify/A2819...  POST    200     xhr       234 B   ← Not devices
```

**Filter by "Fetch/XHR" to hide everything except API calls!**

---

## 🆘 Still Having Issues?

### Issue: Can't find `/hmsweb/users/devices` request

**Try these actions to trigger it:**

1. Click "Devices" in left sidebar
2. Click any camera thumbnail
3. Refresh page (Ctrl+R) while logged in
4. Navigate to Settings → My Devices

### Issue: Request shows up but disappears

**Solution:**

1. Check **"Preserve log"** checkbox (top of Network tab)
2. Requests will persist even after page navigation

### Issue: All requests show "Failed" or "Blocked"

**Reasons:**

1. Not logged in → Login to my.arlo.com first
2. Session expired → Clear cache, login again
3. Network issue → Check internet connection

### Issue: Authorization header is missing

**Solution:**

1. Make sure you're logged in
2. Capture request immediately after login
3. Don't use Incognito mode
4. Don't use a different browser

---

## ✅ Success Checklist

Before running the parser, verify:

- [ ] Logged into my.arlo.com in Chrome
- [ ] Network tab open with "Preserve log" enabled
- [ ] Filtered by "Fetch/XHR" (not "All")
- [ ] Found GET request to `/hmsweb/users/devices`
- [ ] Request shows Status 200 (not 204 or 403)
- [ ] Copied as "cURL (bash)" not PowerShell
- [ ] Pasted into `scripts/arlo-captured-request.txt`
- [ ] File starts with `curl 'https://myapi.arlo.com/hmsweb/`
- [ ] File is 1-5 KB in size (not 0 bytes)

---

## 🚀 After Capturing Correct Request

Run the master script:

```powershell
pwsh scripts/arlo-reverse-engineer.ps1 -Phase 3
```

Or manually:

```bash
node scripts/parse-curl-to-json.js
node scripts/test-arlo-exact-request.js
```

---

**Created**: October 13, 2025
**For**: Arlo HTTP Interceptor Reverse Engineering
**Purpose**: Help users find the correct API request in Chrome DevTools
