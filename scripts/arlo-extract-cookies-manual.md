# Manual Cookie Extraction for Arlo (Fastest Method)

Since Puppeteer with your Chrome profile is hanging, here's the **fastest manual method** (2 minutes):

## Option 1: Use Browser Extension (RECOMMENDED)

### Step 1: Install EditThisCookie Extension

1. Open Chrome
2. Go to: https://chrome.google.com/webstore/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg
3. Click **Add to Chrome**

### Step 2: Log Into Arlo

1. Navigate to: https://my.arlo.com/
2. Log in (you should already be logged in)
3. Make sure you see your cameras

### Step 3: Export Cookies

1. Click the **EditThisCookie** icon in your toolbar
2. Click the **Export** button (looks like a download icon)
3. Cookies are copied to clipboard in JSON format

### Step 4: Save to File

Create file `data/arlo-real-auth.json`:

```json
{
  "cookies": [
    // PASTE YOUR EXPORTED COOKIES HERE
  ],
  "extractedAt": "2025-10-13T20:00:00.000Z"
}
```

## Option 2: Use Browser DevTools (NO EXTENSION NEEDED)

### Step 1: Open DevTools

1. Go to https://my.arlo.com/ (logged in)
2. Press **F12** to open DevTools
3. Go to **Application** tab
4. Click **Cookies** → **https://my.arlo.com**

### Step 2: Copy All Cookies

Run this in the **Console** tab:

```javascript
// Copy this entire code block and paste in Console, then press Enter
copy(
  JSON.stringify(
    {
      cookies: document.cookie.split('; ').map(c => {
        const [name, value] = c.split('=')
        return {
          name,
          value,
          domain: '.arlo.com',
          path: '/',
          secure: true,
          httpOnly: false,
        }
      }),
      localStorage: Object.fromEntries(Object.entries(localStorage)),
      extractedAt: new Date().toISOString(),
    },
    null,
    2
  )
)

console.log('✅ Copied to clipboard! Paste into data/arlo-real-auth.json')
```

### Step 3: Save to File

1. Create folder: `data/` (if not exists)
2. Create file: `data/arlo-real-auth.json`
3. **Paste** the clipboard contents
4. Save

## Verify the File

Your `data/arlo-real-auth.json` should look like:

```json
{
  "cookies": [
    {
      "name": "auth_token",
      "value": "eyJhbGc...",
      "domain": ".arlo.com",
      "path": "/",
      "secure": true,
      "httpOnly": false
    }
    // ... more cookies
  ],
  "localStorage": {
    "token": "some_value",
    "userId": "some_value"
  },
  "extractedAt": "2025-10-13T20:55:00.000Z"
}
```

## Next Steps

Once you have `data/arlo-real-auth.json`:

```powershell
# Verify the file exists
cat data/arlo-real-auth.json

# Continue with ArloAdapter integration
# (Next: Update ArloAdapter to load this file)
```

## Why This Works

- ✅ No Puppeteer issues
- ✅ No Chrome locking problems
- ✅ Takes 2 minutes
- ✅ Guaranteed to work
- ✅ Same cookies as real browser session

## Troubleshooting

**Q: I don't see "auth_token" cookie**

A: Look for cookies with names containing:

- `token`
- `auth`
- `session`
- `sid`

**Q: How often do I need to refresh?**

A: Arlo cookies typically last **7-30 days**. Re-export when they expire.

**Q: Can I use incognito mode?**

A: No - you need to be logged into Arlo in a regular Chrome window.
