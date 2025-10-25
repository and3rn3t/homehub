# HomeHub Architecture

This document provides a comprehensive overview of HomeHub's architecture using Mermaid diagrams.

## Table of Contents

- [System Overview](#system-overview)
- [Data Flow](#data-flow)
- [State Management](#state-management)
- [Component Structure](#component-structure)
- [Deployment Architecture](#deployment-architecture)
- [Migration Path](#migration-path)

---

## System Overview

High-level view of the HomeHub system architecture.

```mermaid
graph TB
    subgraph "Client Layer"
        A[React 19 Frontend<br/>Vite Build]
        B[useKV Hook<br/>State Management]
        C[UI Components<br/>shadcn/ui + Tailwind]
    end
    
    subgraph "Caching Layer"
        D[In-Memory Cache<br/>React State]
        E[localStorage<br/>Browser Storage]
    end
    
    subgraph "API Layer"
        F[Cloudflare Worker<br/>REST API]
        G[KV Client<br/>TypeScript]
    end
    
    subgraph "Storage Layer"
        H[Cloudflare KV<br/>Global Edge Network]
    end
    
    A --> C
    A --> B
    B --> D
    B --> E
    B --> G
    G --> F
    F --> H
    
    style A fill:#4a9eff,stroke:#333,stroke-width:3px,color:#fff
    style B fill:#10b981,stroke:#333,stroke-width:3px,color:#fff
    style F fill:#f59e0b,stroke:#333,stroke-width:3px,color:#fff
    style H fill:#8b5cf6,stroke:#333,stroke-width:3px,color:#fff
```

---

## Data Flow

Complete data flow from user interaction to persistent storage.

```mermaid
sequenceDiagram
    participant U as User
    participant C as React Component
    participant H as useKV Hook
    participant M as In-Memory Cache
    participant L as localStorage
    participant K as KV Client
    participant W as Worker API
    participant S as Cloudflare KV
    
    U->>C: Interact (e.g., toggle device)
    C->>H: setDevices(updatedData)
    
    Note over H: Optimistic Update
    H->>M: Update in-memory state
    H->>C: UI updates immediately
    C->>U: Instant visual feedback
    
    Note over H: Cache Update
    H->>L: Save to localStorage
    
    Note over H: Debounced Sync (500ms)
    H->>K: API request (after debounce)
    K->>W: POST /kv/devices
    
    alt Success
        W->>S: Write to KV
        S-->>W: Success
        W-->>K: 200 OK
        K-->>H: Confirmed
    else Error
        W-->>K: 500 Error
        K-->>H: Rollback needed
        H->>C: Revert UI (if needed)
    end
```

---

## State Management

How the custom useKV hook manages state across layers.

```mermaid
graph TD
    A[useKV Hook Called] --> B{Cache Hit?}
    
    B -->|Yes| C[Return from<br/>In-Memory Cache<br/>0ms]
    B -->|No| D{localStorage Hit?}
    
    D -->|Yes| E[Load from<br/>localStorage<br/>~5ms]
    D -->|No| F[Fetch from<br/>Cloudflare KV<br/>~150ms]
    
    E --> G[Update In-Memory]
    F --> G
    
    G --> H[Return to Component]
    
    H --> I[User Modifies State]
    I --> J[Optimistic Update<br/>UI responds instantly]
    
    J --> K[Update In-Memory]
    J --> L[Update localStorage]
    J --> M[Debounce Timer<br/>500ms]
    
    M --> N{Timer Expires}
    N -->|Yes| O[Sync to Worker API]
    N -->|No| P[Wait for more changes]
    
    O --> Q[POST to Cloudflare KV]
    
    style A fill:#6366f1,stroke:#333,stroke-width:2px,color:#fff
    style C fill:#22c55e,stroke:#333,stroke-width:2px,color:#fff
    style J fill:#10b981,stroke:#333,stroke-width:2px,color:#fff
    style O fill:#f59e0b,stroke:#333,stroke-width:2px,color:#fff
    style Q fill:#8b5cf6,stroke:#333,stroke-width:2px,color:#fff
```

---

## Component Structure

Organization of React components and their relationships.

```mermaid
graph TD
    A[App.tsx<br/>Main Shell] --> B[Tab Navigation]
    
    B --> C1[Dashboard]
    B --> C2[Rooms]
    B --> C3[Scenes]
    B --> C4[Automations]
    B --> C5[Energy]
    B --> C6[Security]
    B --> C7[DeviceMonitor]
    B --> C8[DeviceSettings]
    B --> C9[UserManagement]
    B --> C10[Insights]
    B --> C11[BackupRecovery]
    
    C1 --> D[useKV Hook]
    C2 --> D
    C3 --> D
    C4 --> D
    C5 --> D
    C6 --> D
    C7 --> D
    C8 --> D
    C9 --> D
    C10 --> D
    C11 --> D
    
    C4 --> E[FlowDesigner<br/>Visual Automation]
    E --> F[FlowExecutor]
    E --> G[NodeConfig]
    E --> H[FlowMiniMap]
    
    D --> I[KV Client]
    I --> J[Cloudflare Worker]
    
    style A fill:#4a9eff,stroke:#333,stroke-width:2px,color:#fff
    style D fill:#10b981,stroke:#333,stroke-width:2px,color:#fff
    style E fill:#f59e0b,stroke:#333,stroke-width:2px,color:#fff
    style J fill:#8b5cf6,stroke:#333,stroke-width:2px,color:#fff
```

---

## Deployment Architecture

Production deployment on Cloudflare infrastructure.

```mermaid
graph TB
    subgraph "GitHub"
        A[Git Repository]
    end
    
    subgraph "Development"
        B[Local Dev<br/>npm run dev]
        C[Vite Dev Server<br/>localhost:5173]
    end
    
    subgraph "CI/CD"
        D[GitHub Actions<br/>Build Pipeline]
    end
    
    subgraph "Cloudflare Workers"
        E[Worker API<br/>Edge Functions]
        F[KV Namespace<br/>HOMEHUB_KV]
    end
    
    subgraph "Cloudflare Pages"
        G[Static Assets<br/>React Build]
        H[CDN Distribution<br/>300+ Locations]
    end
    
    subgraph "Users"
        I[Web Browsers]
        J[Mobile Devices]
    end
    
    A --> D
    D --> G
    D --> E
    
    E --> F
    
    G --> H
    H --> I
    H --> J
    
    I --> E
    J --> E
    
    B --> C
    C -.local dev.-> E
    
    style A fill:#333,stroke:#fff,stroke-width:2px,color:#fff
    style E fill:#f59e0b,stroke:#333,stroke-width:2px,color:#fff
    style F fill:#8b5cf6,stroke:#333,stroke-width:2px,color:#fff
    style G fill:#4a9eff,stroke:#333,stroke-width:2px,color:#fff
    style H fill:#10b981,stroke:#333,stroke-width:2px,color:#fff
```

---

## Migration Path

Evolution from GitHub Spark to Cloudflare.

```mermaid
graph LR
    subgraph "Phase 1: GitHub Spark"
        A1[React App]
        A2[@github/spark/hooks]
        A3[Spark KV<br/>GitHub Backend]
        
        A1 --> A2 --> A3
    end
    
    subgraph "Phase 2: Hybrid"
        B1[React App]
        B2[Custom useKV<br/>localStorage only]
        B3[Mock Worker]
        
        B1 --> B2 --> B3
    end
    
    subgraph "Phase 3: Cloudflare"
        C1[React App]
        C2[Custom useKV<br/>+ localStorage]
        C3[Cloudflare Worker]
        C4[Cloudflare KV]
        
        C1 --> C2 --> C3 --> C4
    end
    
    A1 -.migrate.-> B1
    B1 -.deploy.-> C1
    
    style A1 fill:#94a3b8,stroke:#333,stroke-width:2px,color:#fff
    style A2 fill:#64748b,stroke:#333,stroke-width:2px,color:#fff
    style C1 fill:#4a9eff,stroke:#333,stroke-width:2px,color:#fff
    style C2 fill:#10b981,stroke:#333,stroke-width:2px,color:#fff
    style C3 fill:#f59e0b,stroke:#333,stroke-width:2px,color:#fff
    style C4 fill:#8b5cf6,stroke:#333,stroke-width:2px,color:#fff
```

---

## Worker API Endpoints

REST API structure of the Cloudflare Worker.

```mermaid
graph LR
    A[Client Request] --> B{Endpoint}
    
    B -->|GET /health| C[Health Check]
    B -->|GET /kv| D[List All Keys]
    B -->|GET /kv/:key| E[Get Value]
    B -->|POST /kv/:key| F[Set Value]
    B -->|DELETE /kv/:key| G[Delete Value]
    
    C --> H[Return Status]
    D --> I[Query KV Store]
    E --> I
    F --> I
    G --> I
    
    I --> J{Success?}
    J -->|Yes| K[200/201 Response]
    J -->|No| L[400/500 Error]
    
    K --> M[Return to Client]
    L --> M
    
    style A fill:#4a9eff,stroke:#333,stroke-width:2px,color:#fff
    style B fill:#f59e0b,stroke:#333,stroke-width:2px,color:#fff
    style I fill:#8b5cf6,stroke:#333,stroke-width:2px,color:#fff
    style K fill:#10b981,stroke:#333,stroke-width:2px,color:#fff
    style L fill:#ef4444,stroke:#333,stroke-width:2px,color:#fff
```

---

## Type System Organization

How TypeScript types are structured.

```mermaid
graph TD
    A[src/types/index.ts<br/>Central Export] --> B[device.types.ts]
    A --> C[room.types.ts]
    A --> D[scene.types.ts]
    A --> E[automation.types.ts]
    A --> F[user.types.ts]
    A --> G[security.types.ts]
    A --> H[energy.types.ts]
    A --> I[backup.types.ts]
    A --> J[features.types.ts]
    
    B --> K[Device<br/>DeviceType<br/>DeviceStatus]
    C --> L[Room<br/>RoomColor]
    D --> M[Scene<br/>SceneAction]
    E --> N[Automation<br/>Flow<br/>FlowNode<br/>Trigger]
    F --> O[User<br/>Role<br/>Permissions]
    G --> P[Camera<br/>SecurityEvent]
    H --> Q[EnergyReading<br/>CostData]
    I --> R[Backup<br/>BackupMetadata]
    J --> S[Feature<br/>FeatureFlag]
    
    style A fill:#6366f1,stroke:#333,stroke-width:3px,color:#fff
    style K fill:#10b981,stroke:#333,stroke-width:2px,color:#fff
    style L fill:#10b981,stroke:#333,stroke-width:2px,color:#fff
    style M fill:#10b981,stroke:#333,stroke-width:2px,color:#fff
    style N fill:#10b981,stroke:#333,stroke-width:2px,color:#fff
    style O fill:#10b981,stroke:#333,stroke-width:2px,color:#fff
    style P fill:#10b981,stroke:#333,stroke-width:2px,color:#fff
    style Q fill:#10b981,stroke:#333,stroke-width:2px,color:#fff
    style R fill:#10b981,stroke:#333,stroke-width:2px,color:#fff
    style S fill:#10b981,stroke:#333,stroke-width:2px,color:#fff
```

---

## Error Handling Flow

How errors are handled throughout the system.

```mermaid
graph TD
    A[User Action] --> B[Component Event Handler]
    B --> C[useKV Hook Call]
    
    C --> D{Try Operation}
    
    D -->|Success| E[Update State]
    E --> F[Update localStorage]
    F --> G[Debounced Sync]
    
    D -->|Error| H{Error Type}
    
    H -->|Network Error| I[Retry Logic<br/>3 attempts]
    H -->|Validation Error| J[Show Toast<br/>User Feedback]
    H -->|Auth Error| K[Redirect to Login]
    H -->|Unknown Error| L[Error Boundary<br/>Fallback UI]
    
    I --> M{Retry Success?}
    M -->|Yes| E
    M -->|No| N[Offline Mode<br/>Queue for later]
    
    J --> O[Revert Optimistic Update]
    K --> P[Clear Auth State]
    L --> Q[Show Error Page]
    
    style A fill:#4a9eff,stroke:#333,stroke-width:2px,color:#fff
    style D fill:#f59e0b,stroke:#333,stroke-width:2px,color:#fff
    style E fill:#10b981,stroke:#333,stroke-width:2px,color:#fff
    style H fill:#ef4444,stroke:#333,stroke-width:2px,color:#fff
    style N fill:#94a3b8,stroke:#333,stroke-width:2px,color:#fff
```

---

## Performance Optimization

Key performance optimizations in the architecture.

```mermaid
graph LR
    A[Performance Strategy] --> B[Caching]
    A --> C[Debouncing]
    A --> D[Optimistic Updates]
    A --> E[Edge Network]
    
    B --> B1[In-Memory<br/>0ms reads]
    B --> B2[localStorage<br/>~5ms reads]
    B --> B3[CDN Cache<br/>~50ms reads]
    
    C --> C1[Batch API Calls<br/>500ms window]
    C --> C2[Reduce Requests<br/>90% fewer calls]
    
    D --> D1[Instant UI Response<br/><10ms perceived]
    D --> D2[Background Sync<br/>User unaware]
    
    E --> E1[300+ Locations<br/>Low latency]
    E --> E2[Auto Scaling<br/>High availability]
    
    style A fill:#6366f1,stroke:#333,stroke-width:3px,color:#fff
    style B1 fill:#10b981,stroke:#333,stroke-width:2px,color:#fff
    style C1 fill:#f59e0b,stroke:#333,stroke-width:2px,color:#fff
    style D1 fill:#22c55e,stroke:#333,stroke-width:2px,color:#fff
    style E1 fill:#8b5cf6,stroke:#333,stroke-width:2px,color:#fff
```

---

## Future Architecture (Phase 2+)

Planned enhancements for device integration.

```mermaid
graph TB
    subgraph "Current (Phase 1)"
        A1[React Frontend]
        A2[Cloudflare Worker]
        A3[Cloudflare KV]
        
        A1 --> A2 --> A3
    end
    
    subgraph "Future (Phase 2)"
        B1[React Frontend]
        B2[Cloudflare Worker<br/>+ Device Control]
        B3[Cloudflare KV]
        B4[MQTT Broker]
        B5[Device Adapters]
        B6[Smart Devices]
        
        B1 --> B2
        B2 --> B3
        B2 --> B4
        B4 --> B5
        B5 --> B6
    end
    
    subgraph "Future (Phase 3)"
        C1[React Frontend]
        C2[Mobile App<br/>React Native]
        C3[Cloudflare Worker<br/>+ Automation Engine]
        C4[Cloudflare KV]
        C5[Cloudflare Durable Objects<br/>Real-time State]
        C6[MQTT Broker]
        C7[Device Gateway<br/>Raspberry Pi]
        C8[Smart Devices]
        
        C1 --> C3
        C2 --> C3
        C3 --> C4
        C3 --> C5
        C3 --> C6
        C6 --> C7
        C7 --> C8
    end
    
    A1 -.Phase 2.-> B1
    B1 -.Phase 3.-> C1
    
    style A1 fill:#94a3b8,stroke:#333,stroke-width:2px,color:#fff
    style B1 fill:#4a9eff,stroke:#333,stroke-width:2px,color:#fff
    style B2 fill:#f59e0b,stroke:#333,stroke-width:2px,color:#fff
    style C1 fill:#10b981,stroke:#333,stroke-width:2px,color:#fff
    style C3 fill:#8b5cf6,stroke:#333,stroke-width:2px,color:#fff
    style C5 fill:#ec4899,stroke:#333,stroke-width:2px,color:#fff
```

---

## Documentation

For more details, see:

- **[README.md](../README.md)** - Project overview
- **[CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md)** - Deployment guide
- **[CLOUDFLARE_MIGRATION.md](CLOUDFLARE_MIGRATION.md)** - Migration details
- **[MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)** - Complete migration summary
- **[Copilot Instructions](../.github/copilot-instructions.md)** - Development guidelines

---

*All diagrams generated using [Mermaid](https://mermaid.js.org/)*
