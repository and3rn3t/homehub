# Quick Fix: Finding the Right Arlo API Endpoint

## ❌ What You Just Captured (Still Wrong)

```
URL: /hmsweb/users/devices/notify/A2819C7XA0386?eventId=...
Method: GET
Status: 405 Method Not Allowed
Error: "Request method 'GET' not supported"
```

**This is a notification subscription endpoint, not the device list!**

---

## ✅ What You Need to Find

The **device list endpoint** looks like this:

```
URL: https://myapi.arlo.com/hmsweb/users/devices
     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
     EXACTLY THIS - nothing after "devices"

Method: GET
Status: 200 OK
Size: 5-50 KB (contains device data)
```

**Key difference:**

- ❌ Wrong: `/hmsweb/users/devices/notify/A2819...` (notification)
- ✅ Right: `/hmsweb/users/devices` (device list - ends here!)

---

## 🎯 Quick Steps to Find It

### Step 1: Clear Network Tab

1. In Chrome DevTools Network tab
2. Click the 🚫 icon (clear) to empty the list
3. Keep the tab open

### Step 2: Navigate to Devices Page

1. In the Arlo web app, click **"Devices"** in the left sidebar
2. OR click the **"Settings"** icon → **"My Devices"**

This will trigger a request to `/hmsweb/users/devices`

### Step 3: Filter and Find

1. In Network tab, set filter to **"Fetch/XHR"**
2. Look for a request named simply **"devices"**
   - NOT "devices/notify"
   - NOT "devices/A2819..."
   - Just "devices"

### Step 4: Verify It's Correct

Click on the request and check:

- ✅ **Request URL**: Ends with `/hmsweb/users/devices` (no query params)
- ✅ **Method**: GET
- ✅ **Status**: 200 (not 204, not 405)
- ✅ **Response tab**: Shows JSON with `"data"` array of devices
- ✅ **Headers tab**: Has `authorization: Bearer ...`

### Step 5: Copy It

1. Right-click that request
2. Copy → **Copy as cURL (bash)**
3. Replace everything in `scripts/arlo-captured-request.txt`
4. Save

---

## 🔍 Visual Guide: What to Look For

In the Network tab, you should see something like this:

```
Name            Method  Status  Type  Size      Time
─────────────────────────────────────────────────────
❌ notify       GET     405     xhr   234 B     45ms   ← You captured this
❌ devices/no.. POST    200     xhr   1.2 KB    67ms   ← Notification endpoint
✅ devices      GET     200     xhr   18.3 KB   123ms  ← THIS IS IT! ✅
```

**The one you want:**

- Name: **devices** (exactly, no suffix)
- Method: **GET**
- Status: **200**
- Size: **> 5 KB** (has actual device data)

---

## 💡 Alternative: Profile Endpoint

If you can't find `/hmsweb/users/devices`, try the profile endpoint instead:

```
URL: https://myapi.arlo.com/hmsweb/users/profile
Method: GET
Status: 200
```

To trigger this:

1. Click your **profile icon** or **Settings**
2. Look for `profile` request in Network tab
3. Copy that instead

**Both endpoints have the same auth headers, which is what we need!**

---

## 🚀 After Capturing the Right Request

Run the parser again:

```bash
node scripts/parse-curl-to-json.js
```

**Expected output:**

```
✅ URL: https://myapi.arlo.com/hmsweb/users/devices
✅ Method: GET
✅ Headers: 15 found
✅ Cookies: 3 found
```

Then test it:

```bash
node scripts/test-arlo-exact-request.js
```

**Expected result:**

```
📥 Status: 200 OK
✅ SUCCESS! Response:
{
  "data": [
    {
      "deviceId": "...",
      "deviceName": "Front Door",
      "deviceType": "camera",
      ...
    }
  ]
}
```

---

## ❓ Still Can't Find It?

### Try These Actions to Trigger the Request:

1. **Refresh the Devices page**
   - Navigate to "Devices" in sidebar
   - Press Ctrl+R to refresh
   - Look for `devices` request immediately

2. **Open camera settings**
   - Click any camera
   - Click the ⚙️ settings icon
   - This may trigger the device list

3. **Check the Library**
   - Click "Library" in sidebar
   - This loads device info to show recordings

4. **Force re-authentication**
   - Logout
   - Clear cache (Ctrl+Shift+Delete → Cookies and cache)
   - Login again
   - Go to Devices page
   - Watch Network tab for `devices` request

---

## 🆘 Last Resort: Use Profile Endpoint

If you absolutely cannot find the devices endpoint:

1. Click your **profile/account icon** (top right)
2. Look for request to: `https://myapi.arlo.com/hmsweb/users/profile`
3. Copy that as cURL instead
4. The auth headers are identical

---

## ✅ Success Checklist

Your captured request should have:

- [ ] URL ends with `/hmsweb/users/devices` OR `/hmsweb/users/profile`
- [ ] NO `/notify/` in the URL
- [ ] NO `/A2819...` device ID in the URL
- [ ] Method is **GET** (not OPTIONS, not POST)
- [ ] Has header: `authorization: Bearer ...`
- [ ] Has header: `auth-version: 2`
- [ ] Status is **200 OK** (not 204, not 405)
- [ ] Response contains device data (check Response tab)

Once you have all checkmarks, you're ready! 🎉

---

**Created**: October 13, 2025
**Updated**: After seeing 405 error on notify endpoint
**Next**: Capture `/hmsweb/users/devices` (the actual device list)
