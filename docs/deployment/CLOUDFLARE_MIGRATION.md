# Migration from GitHub Spark to Cloudflare KV

## Overview

Migrate HomeHub from GitHub Spark's built-in KV store to Cloudflare Workers + KV for full control and Cloudflare ecosystem integration.

## Architecture

### Before (Spark)

```mermaid
graph LR
    A[React App] --> B[@github/spark/hooks] --> C[Spark KV<br/>GitHub backend]
    
    style A fill:#4a9eff,stroke:#333,stroke-width:2px,color:#fff
    style B fill:#64748b,stroke:#333,stroke-width:2px,color:#fff
    style C fill:#94a3b8,stroke:#333,stroke-width:2px,color:#fff
```

### After (Cloudflare)

```mermaid
graph LR
    A[React App] --> B[Custom useKV Hook] --> C[Cloudflare Workers API] --> D[Cloudflare KV]
    
    style A fill:#4a9eff,stroke:#333,stroke-width:2px,color:#fff
    style B fill:#10b981,stroke:#333,stroke-width:2px,color:#fff
    style C fill:#f59e0b,stroke:#333,stroke-width:2px,color:#fff
    style D fill:#8b5cf6,stroke:#333,stroke-width:2px,color:#fff
```

## Components Needed

### 1. Cloudflare Worker (API Layer)

- RESTful API endpoints for KV operations
- Authentication/authorization
- CORS handling for local dev
- Rate limiting (optional)

### 2. Custom React Hook

- Drop-in replacement for `useKV` from Spark
- Same API signature for minimal code changes
- Optimistic updates
- Error handling

### 3. Updated Vite Config

- Remove Spark plugins
- Direct Phosphor icon imports
- Cloudflare Pages build config

## Migration Steps

### Phase 1: Setup Cloudflare Infrastructure

1. Create Cloudflare KV namespace
2. Deploy Cloudflare Worker
3. Configure environment variables
4. Test API endpoints

### Phase 2: Create Custom useKV Hook

1. Implement localStorage cache layer
2. API client for Worker communication
3. React hook with same signature as Spark's useKV
4. Add optimistic updates

### Phase 3: Remove Spark Dependencies

1. Uninstall @github/spark packages
2. Update imports in all components
3. Remove Spark Vite plugins
4. Update configuration files

### Phase 4: Testing & Deployment

1. Test all KV operations
2. Verify data persistence
3. Deploy to Cloudflare Pages
4. Monitor performance

## Benefits

- ✅ Full control over backend
- ✅ Cloudflare edge network performance
- ✅ Integrated with your existing Cloudflare services
- ✅ Workers KV is free tier friendly (100k reads/day)
- ✅ Can add custom middleware/auth
- ✅ Direct database access for debugging

## Cost Estimate

- **Cloudflare Workers**: Free tier (100k requests/day)
- **Cloudflare KV**: Free tier (100k reads, 1k writes/day)
- **Cloudflare Pages**: Free (500 builds/month)

**Total**: $0/month for development, ~$5/month for production if you exceed free tier

## Timeline

- Setup: 1-2 hours
- Migration: 2-3 hours
- Testing: 1 hour
- **Total**: ~4-6 hours
