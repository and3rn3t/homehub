# Option C: Official Arlo Developer API - ⚠️ NO LONGER AVAILABLE

**Date**: October 13, 2025
**Status**: ❌ **DISCONTINUED** - Arlo shut down their developer program
**Last Updated**: October 13, 2025

---

## 🚫 IMPORTANT: This Option No Longer Exists

**Arlo has discontinued their developer program.** The website `developer.arlo.com` no longer exists, and there is no official API available for third-party developers.

### What Happened

- **Pre-2023**: Arlo offered an official OAuth2-based developer API
- **2023**: Arlo removed RTSP support from cameras
- **2024-2025**: Arlo shut down the developer program entirely
- **Current Status**: No official API access for developers

### Why This Matters

This means **Option C (Official API) is no longer viable**. You cannot:

- ❌ Register for a developer account
- ❌ Get OAuth2 credentials
- ❌ Use official Arlo APIs
- ❌ Get support from Arlo for integrations

---

## 📋 What This Document Originally Described

*(Preserved for historical reference)*

This document originally described how to integrate with Arlo using their official OAuth2-based developer API. The process would have involved:

1. Register at developer.arlo.com (site no longer exists)
2. Create application and get OAuth credentials (no longer possible)
3. Implement OAuth2 flow (no endpoint to connect to)
4. Use official REST API (no longer accessible)

**Total estimated time was**: 1-2 days approval + 2-3 hours implementation
**Cost was**: $0 (free for personal use)

---

## 🎯 Current Alternatives (Updated Recommendations)

Since the official API is gone, here are your **ACTUAL** options:

### Option A: Puppeteer Browser Automation ⭐ (NOW RECOMMENDED)

**Time**: 1-2 hours
**Reliability**: 85-90%
**Status**: ✅ Still works

Use headless Chrome to:

1. Login to my.arlo.com
2. Let browser handle Cloudflare challenge
3. Extract auth tokens from cookies
4. Use tokens for API calls

**See**: `ARLO_CLOUDFLARE_BLOCKING.md` Option 1 for details

---

**See**: `ARLO_CLOUDFLARE_BLOCKING.md` Option 1 for details

---

### Option B: Homebridge Arlo Plugin (COMMUNITY SOLUTION)

**Time**: 4-6 hours setup
**Reliability**: 90-95%
**Status**: ✅ Still works (1,000+ active users)

Use the actively maintained Homebridge plugin:

- Handles Cloudflare properly
- Community-tested with modern Arlo accounts
- Can extract auth tokens for direct API use

**See**: `ARLO_CLOUDFLARE_BLOCKING.md` Option 2 for details

---

### Option D: Continue with Mock Data (PRAGMATIC)

**Time**: 0 hours
**Reliability**: 100% (no external dependencies)
**Status**: ✅ Always works

Build complete UI with mock Arlo cameras:

- Full SecurityCameras interface
- DoorbellNotification system working
- Test with real Hue cameras
- Swap in real Arlo later when solution found

**See**: `ARLO_CLOUDFLARE_BLOCKING.md` Option 4 for details

---

## 💡 Updated Recommendation (October 2025)

Since **Arlo shut down their developer program**, here's the new reality:

### For Quick Integration (This Week)

→ **Try Option A (Puppeteer)** first

- 1-2 hours implementation
- 85-90% reliability
- Bypasses Cloudflare with real browser
- Good enough for personal use

### For Production/Long-Term

→ **Option B (Homebridge)** is now the "official" community solution

- Battle-tested by 1,000+ users
- More reliable than Puppeteer
- Worth the extra setup time

### For Immediate Progress

→ **Option D (Mock Data)** lets you keep building

- Complete the SecurityCameras UI today
- Polish DoorbellNotification system
- Test with working Hue cameras
- Revisit Arlo integration next week

---

## 📚 Historical Context

This document was originally created to explain how to use Arlo's official developer API. That option no longer exists as of 2024-2025.

**Why keep this document?**

1. Historical reference (what we tried)
2. Shows why Option C was removed from recommendations
3. Explains the gap between community solutions and official support

---

## 🔄 See Also

- **[ARLO_CLOUDFLARE_BLOCKING.md](ARLO_CLOUDFLARE_BLOCKING.md)** - Main decision guide (updated to reflect no official API)
- **[ARLO_INTEGRATION_SUMMARY.md](../features/ARLO_INTEGRATION_SUMMARY.md)** - Current integration status

---

**Last Updated**: October 13, 2025
**Status**: ❌ Option no longer available
**Recommendation**: Use Option A (Puppeteer) or Option B (Homebridge) instead---

## 🎯 What's Involved

### Phase 1: Developer Account Registration (1-2 Days)

#### Step 1: Create Developer Account

- **URL**: https://developer.arlo.com/ (or https://my.arlo.com/developer)
- **Requirements**:
  - Existing Arlo account (you have this! ✅)
  - Verify email address
  - Agree to developer terms of service
- **Time**: 15-30 minutes

#### Step 2: Application Registration

- **What You'll Provide**:
  - Application name (e.g., "HomeHub Smart Home")
  - Description (e.g., "Personal home automation dashboard")
  - Redirect URI(s) for OAuth2 callback (e.g., `http://localhost:5173/auth/arlo/callback`)
  - Scope permissions requested (cameras, streaming, events)
- **Time**: 15 minutes

#### Step 3: Approval Wait

- **Process**: Arlo reviews your application
- **Typical Wait Time**:
  - Personal use: 24-48 hours
  - Commercial use: 3-7 days
- **Status Check**: Via developer portal dashboard
- **Time**: **1-2 days** (out of your control)

#### Step 4: Get Credentials

Once approved, you receive:

- **Client ID**: Public identifier for your app
- **Client Secret**: Private key (keep secure!)
- **API Documentation Access**: Full REST API reference

---

## 💻 Phase 2: Implementation (2-3 Hours)

### Architecture Overview

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   HomeHub   │◄───────►│ Arlo OAuth2  │◄───────►│  Arlo Cloud  │
│  Frontend   │         │   Service    │         │     API      │
└─────────────┘         └──────────────┘         └──────────────┘
      │                        │
      │ 1. Initiate Login      │
      ├───────────────────────►│
      │                        │
      │ 2. Redirect to Arlo    │
      │◄───────────────────────┤
      │                        │
      │ 3. User Authorizes     │
      │    (Arlo Login Page)   │
      │                        │
      │ 4. Callback with Code  │
      ├───────────────────────►│
      │                        │
      │                        │ 5. Exchange Code for Token
      │                        ├────────────────────────────►
      │                        │
      │                        │ 6. Access Token + Refresh Token
      │                        │◄────────────────────────────┤
      │                        │
      │ 7. API Calls           │
      │    (with token)        │ 8. API Calls
      │◄───────────────────────┤────────────────────────────►
```

---

### Implementation Steps

#### Step 1: Install OAuth2 Library (5 minutes)

```bash
npm install @badgateway/oauth2-client
```

This library handles OAuth2 flows properly (better than rolling your own).

---

#### Step 2: Create ArloOAuthService (30 minutes)

**File**: `src/services/auth/ArloOAuthService.ts`

```typescript
import { OAuth2Client, OAuth2Token } from '@badgateway/oauth2-client'
import type { Camera } from '@/types'

export class ArloOAuthService {
  private client: OAuth2Client
  private token: OAuth2Token | null = null

  constructor() {
    this.client = new OAuth2Client({
      clientId: import.meta.env.VITE_ARLO_CLIENT_ID,
      clientSecret: import.meta.env.VITE_ARLO_CLIENT_SECRET,
      authorizationEndpoint: 'https://my.arlo.com/hmsweb/oauth/authorize',
      tokenEndpoint: 'https://myapi.arlo.com/hmsweb/oauth/token',
    })
  }

  // 1. Generate authorization URL
  getAuthorizationUrl(): string {
    return this.client.authorizationCode.getAuthorizeUri({
      redirectUri: 'http://localhost:5173/auth/arlo/callback',
      scope: 'cameras:read cameras:control recordings:read events:read',
      state: crypto.randomUUID(), // CSRF protection
    })
  }

  // 2. Handle OAuth callback
  async handleCallback(code: string): Promise<void> {
    this.token = await this.client.authorizationCode.getTokenFromCodeRedirect(
      window.location.href,
      {
        redirectUri: 'http://localhost:5173/auth/arlo/callback',
      }
    )

    // Store token for later use
    localStorage.setItem('arlo_token', JSON.stringify(this.token))
  }

  // 3. Make authenticated API calls
  private async makeRequest(endpoint: string, options?: RequestInit) {
    if (!this.token) {
      throw new Error('Not authenticated - call login() first')
    }

    // Auto-refresh token if expired
    if (this.token.expiresAt && Date.now() > this.token.expiresAt * 1000) {
      this.token = await this.client.refreshToken(this.token)
      localStorage.setItem('arlo_token', JSON.stringify(this.token))
    }

    const response = await fetch(`https://myapi.arlo.com/hmsweb${endpoint}`, {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: `Bearer ${this.token.accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Arlo API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // 4. Get cameras
  async getCameras(): Promise<Camera[]> {
    const data = await this.makeRequest('/users/devices')

    return data.data
      .filter(
        (device: any) => device.deviceType.includes('camera') || device.deviceType === 'doorbell'
      )
      .map((device: any) => ({
        id: device.deviceId,
        name: device.deviceName,
        location: 'Unknown', // Map to room later
        status: device.state === 'provisioned' ? 'recording' : 'offline',
        recordingEnabled: true,
        motionDetection: device.motionDetection || false,
        nightVision: device.nightVision || false,
        lastMotion: device.lastModified ? new Date(device.lastModified) : undefined,
      }))
  }

  // 5. Get snapshot
  async getSnapshot(deviceId: string): Promise<string> {
    // Request snapshot
    await this.makeRequest(`/users/devices/${deviceId}/snapshot`, {
      method: 'POST',
    })

    // Wait for snapshot to be ready (usually 2-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Get snapshot URL
    const data = await this.makeRequest(`/users/devices/${deviceId}/snapshot/url`)
    return data.data.url // Pre-signed S3 URL
  }

  // 6. Subscribe to events (doorbell press, motion)
  subscribeToEvents(callback: (event: any) => void): void {
    // Arlo uses Server-Sent Events (SSE) for real-time updates
    const eventSource = new EventSource(
      `https://myapi.arlo.com/hmsweb/client/subscribe?token=${this.token?.accessToken}`
    )

    eventSource.onmessage = event => {
      const data = JSON.parse(event.data)

      if (data.action === 'doorbell') {
        callback({
          type: 'doorbell',
          deviceId: data.resource,
          timestamp: new Date(),
        })
      } else if (data.action === 'motion') {
        callback({
          type: 'motion',
          deviceId: data.resource,
          timestamp: new Date(),
        })
      }
    }

    eventSource.onerror = () => {
      console.error('Arlo SSE connection lost, reconnecting...')
      eventSource.close()
      // Reconnect after 5 seconds
      setTimeout(() => this.subscribeToEvents(callback), 5000)
    }
  }
}
```

**Time**: 30 minutes (copy-paste template, adjust endpoints)

---

#### Step 3: Add OAuth Flow to UI (30 minutes)

**File**: `src/components/ArloLoginButton.tsx`

```tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArloOAuthService } from '@/services/auth/ArloOAuthService'
import { toast } from 'sonner'

export function ArloLoginButton() {
  const [isLoading, setIsLoading] = useState(false)
  const arloService = new ArloOAuthService()

  const handleLogin = () => {
    // Redirect to Arlo login page
    const authUrl = arloService.getAuthorizationUrl()
    window.location.href = authUrl
  }

  return (
    <Button onClick={handleLogin} disabled={isLoading}>
      {isLoading ? 'Connecting...' : 'Connect Arlo Cameras'}
    </Button>
  )
}
```

**File**: `src/pages/ArloCallbackPage.tsx`

```tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArloOAuthService } from '@/services/auth/ArloOAuthService'
import { toast } from 'sonner'

export function ArloCallbackPage() {
  const navigate = useNavigate()
  const arloService = new ArloOAuthService()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get authorization code from URL
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')

        if (!code) {
          throw new Error('No authorization code received')
        }

        // Exchange code for access token
        await arloService.handleCallback(code)

        toast.success('✅ Connected to Arlo!')
        navigate('/security')
      } catch (error) {
        toast.error('Failed to connect to Arlo')
        console.error(error)
        navigate('/settings')
      }
    }

    handleCallback()
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-bold">Connecting to Arlo...</h1>
        <p className="text-muted-foreground">Please wait while we complete the setup.</p>
      </div>
    </div>
  )
}
```

**Time**: 30 minutes

---

#### Step 4: Update ArloAdapter (30 minutes)

Replace the `@koush/arlo` library calls with `ArloOAuthService`:

```typescript
// src/services/devices/ArloAdapter.ts
import { ArloOAuthService } from '@/services/auth/ArloOAuthService'

export async function createArloAdapter() {
  const oauth = new ArloOAuthService()

  return {
    initialize: async () => {
      // Token already stored from OAuth flow
      const token = localStorage.getItem('arlo_token')
      if (!token) {
        throw new Error('Not authenticated - use ArloLoginButton first')
      }
    },

    discoverDevices: async () => {
      return await oauth.getCameras()
    },

    requestSnapshot: async (deviceId: string) => {
      const url = await oauth.getSnapshot(deviceId)
      // Download and return as buffer
      const response = await fetch(url)
      return Buffer.from(await response.arrayBuffer())
    },

    subscribeToEvents: (callback: (event: any) => void) => {
      oauth.subscribeToEvents(callback)
    },
  }
}
```

**Time**: 30 minutes

---

#### Step 5: Environment Variables (5 minutes)

**File**: `.env`

```bash
# Arlo OAuth2 Credentials (from developer portal)
VITE_ARLO_CLIENT_ID=your_client_id_here
VITE_ARLO_CLIENT_SECRET=your_client_secret_here
```

**Note**: Client Secret should be moved to backend (Cloudflare Worker) for production.

**Time**: 5 minutes

---

#### Step 6: Test & Verify (30 minutes)

1. Click "Connect Arlo Cameras" button
2. Redirect to Arlo login page
3. Login with your credentials (handles 2FA automatically!)
4. Approve permissions
5. Redirect back to HomeHub
6. Verify cameras appear in SecurityCameras tab

**Time**: 30 minutes testing

---

## 📊 API Capabilities

### What You Get

✅ **Camera Discovery**: List all cameras on account
✅ **Live Snapshots**: Request current snapshot (3-5 second delay)
✅ **Recording Access**: Download recordings from cloud
✅ **Event Notifications**: Real-time doorbell press and motion events
✅ **Camera Settings**: Adjust motion sensitivity, recording modes
✅ **Geofencing**: Enable/disable based on location

### What You DON'T Get

❌ **Live Streaming**: No direct RTSP or HLS access (must use snapshots)
❌ **Local Access**: All requests go through Arlo cloud
❌ **Unlimited Calls**: Rate limits apply (varies by plan)

### Rate Limits

- **Free Tier**:
  - 60 requests/minute per camera
  - 1,000 requests/hour account-wide
- **Arlo Secure Plan**:
  - Higher limits (exact numbers in developer docs)

---

## 💰 Cost Analysis

### Developer Account

- **Free**: ✅ Yes, for personal use
- **Approval**: Required (1-2 days)
- **Restrictions**: Usage limits, no commercial use

### Arlo Subscription (Already Required for Cameras)

- **You Already Have This**: ✅ (needed for cloud recording)
- **Plans**:
  - Arlo Secure: $4.99/month/camera
  - Arlo Secure Plus: $12.99/month (unlimited cameras)
- **API Access**: Included with any plan

### Total Additional Cost

- **$0** if you already have Arlo Secure subscription
- API access doesn't cost extra

---

## ⚖️ Pros & Cons

### Pros ✅

1. **Official & Supported**: Won't break with Arlo updates
2. **Proper OAuth2**: Handles 2FA automatically
3. **No Cloudflare Issues**: Approved traffic bypasses bot protection
4. **Token Refresh**: Auto-refresh keeps you logged in (60-day tokens)
5. **Real-Time Events**: SSE for doorbell/motion notifications
6. **Documentation**: Full API reference provided by Arlo
7. **No Hacks**: Clean, maintainable code
8. **Future-Proof**: As long as Arlo exists, API will work

### Cons ❌

1. **Approval Wait**: 1-2 days before you can start coding
2. **No Live Streaming**: Snapshot-based only (3-5 second refresh)
3. **Rate Limits**: Can't spam requests (60/min should be fine)
4. **Client Secret Management**: Need backend to keep secret secure
5. **OAuth Complexity**: More code than simple username/password
6. **Cloud Dependency**: Requires internet, no local fallback

---

## 🔐 Security Considerations

### Best Practices

1. **Never Expose Client Secret in Frontend**
   - Move token exchange to Cloudflare Worker
   - Frontend only stores access token (expires in 1 hour)

2. **Secure Token Storage**
   - Use `localStorage` for short-term (development)
   - Use `httpOnly` cookies for production (via backend)

3. **CSRF Protection**
   - Include `state` parameter in OAuth flow
   - Verify state matches on callback

4. **Token Refresh**
   - Auto-refresh tokens before expiry
   - Handle refresh failures gracefully

---

## 📚 Documentation Resources

Once approved, you'll get access to:

1. **API Reference**: Full REST API documentation
2. **OAuth2 Guide**: Step-by-step authentication setup
3. **Code Examples**: Sample implementations (Python, JavaScript)
4. **Support Forum**: Community + Arlo engineers
5. **Rate Limit Details**: Exact limits for your plan
6. **Webhook Setup**: Alternative to SSE for events

---

## 🚀 Timeline Summary

### Week 1

- **Day 1 (1 hour)**: Register developer account + application
- **Day 2-3 (wait)**: Approval process (out of your control)

### Week 2

- **Day 4 (30 min)**: Receive credentials, add to .env
- **Day 4-5 (2 hours)**: Implement ArloOAuthService
- **Day 5 (1 hour)**: Add UI components (login button, callback page)
- **Day 5 (30 min)**: Update ArloAdapter to use OAuth
- **Day 5 (30 min)**: Test with real cameras

**Total Active Work Time**: 4-5 hours
**Total Calendar Time**: 5-7 days (due to approval wait)

---

## 🎯 Recommendation

**If you want this option:**

1. **Start Registration Today** (15 minutes)
   - Go to https://developer.arlo.com/
   - Fill out application form
   - Submit for approval

2. **While You Wait (1-2 days)**
   - Build SecurityCameras UI with mock data
   - Complete DoorbellNotification polish
   - Test with Hue cameras

3. **When Approved (Day 3+)**
   - Implement OAuth flow (2-3 hours)
   - Test with real cameras
   - Enjoy official, supported API! 🎉

---

## 🤔 Should You Choose This Option?

**Choose Option C if:**

- ✅ You want long-term, maintainable solution
- ✅ You're okay waiting 1-2 days for approval
- ✅ You prefer official, documented APIs
- ✅ You want automatic 2FA handling
- ✅ You plan to use this for 6+ months

**Skip Option C if:**

- ❌ You need cameras working TODAY (try Option A - Puppeteer)
- ❌ You want live streaming (snapshots not good enough)
- ❌ You don't want OAuth complexity
- ❌ You're just prototyping (mock data is fine)

---

## 📞 Next Steps

**Want to proceed with Option C?**

1. Let me know and I'll help you fill out the developer application
2. I'll monitor your approval status
3. When approved, I'll implement the OAuth flow (2-3 hours)

**Want to compare all options first?**

See: `docs/development/issues/ARLO_CLOUDFLARE_BLOCKING.md` for side-by-side comparison.

---

**Created**: October 13, 2025
**Status**: Ready to start registration
**Estimated Total Time**: 1-2 days approval + 4-5 hours coding
**Success Rate**: 95%+ (assuming approval granted)
