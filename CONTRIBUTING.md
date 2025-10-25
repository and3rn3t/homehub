# Contributing to HomeHub

First off, thank you for considering contributing to HomeHub! 🎉

This document provides guidelines for contributing to the project. Following these guidelines helps maintain code quality and makes the contribution process smooth for everyone.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## 🤝 Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Examples of positive behavior:**

- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Examples of unacceptable behavior:**

- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20.x)
- npm 9+
- Git
- VS Code (recommended for best development experience)

### Initial Setup

1. **Fork the repository**

   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/homehub.git
   cd homehub
   ```

2. **Install dependencies**

   ```bash
   npm install
   cd workers && npm install && cd ..
   ```

3. **Set up environment**

   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

### Project Structure

```
homehub/
├── src/                 # React application
│   ├── components/      # UI components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # Business logic
│   └── types/          # TypeScript definitions
├── workers/            # Cloudflare Workers
├── docs/               # Documentation
├── scripts/            # Utility scripts
└── tests/              # Test files
```

## 🔄 Development Process

### Branching Strategy

- `main` - Production-ready code
- `develop` - Active development (not currently used)
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates

**Examples:**

```bash
feat(dashboard): add device favorites panel
fix(security): resolve camera stream CORS issue
docs(readme): update installation instructions
chore(deps): bump react to 19.0.0
```

### Working on Issues

1. **Find or create an issue**
   - Check existing issues first
   - Use issue templates for consistency
   - Get feedback before starting large changes

2. **Assign yourself**
   - Comment "I'd like to work on this"
   - Wait for maintainer approval

3. **Create a branch**

   ```bash
   git checkout -b feature/issue-123-short-description
   ```

## 📝 Pull Request Process

### Before Submitting

1. **Update from main**

   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Run all checks**

   ```bash
   npm run validate    # Type check + lint + format
   npm test           # Run all tests
   npm run build      # Verify build succeeds
   ```

3. **Update documentation**
   - Update README if needed
   - Add/update JSDoc comments
   - Update relevant docs/ files

### Submitting

1. **Push your branch**

   ```bash
   git push origin feature/your-branch-name
   ```

2. **Create Pull Request**
   - Use the PR template
   - Fill out all sections
   - Link related issues
   - Add screenshots for UI changes

3. **Wait for review**
   - Address review comments
   - Keep PR focused and small
   - Be responsive to feedback

### PR Requirements

- ✅ All CI checks pass
- ✅ Code follows style guidelines
- ✅ Tests added/updated
- ✅ Documentation updated
- ✅ No merge conflicts
- ✅ Approved by at least one maintainer

## 💻 Coding Standards

### TypeScript

```typescript
// ✅ Good
interface Device {
  id: string
  name: string
  enabled: boolean
}

export function toggleDevice(device: Device): Device {
  return { ...device, enabled: !device.enabled }
}

// ❌ Bad
function toggleDevice(device: any) {
  device.enabled = !device.enabled
  return device
}
```

### React Components

```tsx
// ✅ Good - Functional component with proper types
interface DeviceCardProps {
  device: Device
  onToggle: (id: string) => void
}

export function DeviceCard({ device, onToggle }: DeviceCardProps) {
  return (
    <Card>
      <h3>{device.name}</h3>
      <Switch checked={device.enabled} onCheckedChange={() => onToggle(device.id)} />
    </Card>
  )
}

// ❌ Bad - Missing types, inline logic
export function DeviceCard(props) {
  return (
    <div
      onClick={() => {
        /* complex logic here */
      }}
    >
      {props.device.name}
    </div>
  )
}
```

### Import Order

```typescript
// 1. React imports
import { useState, useEffect } from 'react'

// 2. External libraries
import { motion } from 'framer-motion'
import { toast } from 'sonner'

// 3. Internal types
import type { Device, Room } from '@/types'

// 4. Internal hooks
import { useKV } from '@/hooks/use-kv'

// 5. Internal components
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// 6. Icons
import { LightbulbIcon, PowerIcon } from '@/lib/icons'

// 7. Constants and utils
import { KV_KEYS, MOCK_DEVICES } from '@/constants'
```

### State Management

```typescript
// ✅ Good - Use useKV for persistent state
const [devices, setDevices] = useKV<Device[]>('devices', [])

// ❌ Bad - useState for persistent data
const [devices, setDevices] = useState<Device[]>([])
```

## 🧪 Testing Guidelines

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest'
import { toggleDevice } from './device-utils'

describe('toggleDevice', () => {
  it('should toggle device enabled state', () => {
    const device = { id: '1', name: 'Light', enabled: true }
    const result = toggleDevice(device)
    expect(result.enabled).toBe(false)
  })
})
```

### Coverage Requirements

- **Tier 1 Files** (use-kv, adapters): 90%+ statements, 85%+ branches
- **Tier 2 Files** (components): 80%+ statements, 75%+ branches
- **Tier 3 Files** (UI components): Best effort

### Running Tests

```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage report
```

## 📚 Documentation

### Code Documentation

Use JSDoc for all exported functions and types:

```typescript
/**
 * Toggles the enabled state of a device
 * @param device - The device to toggle
 * @returns A new device object with toggled state
 */
export function toggleDevice(device: Device): Device {
  return { ...device, enabled: !device.enabled }
}
```

### Documentation Files

When adding features, update:

- `README.md` - User-facing features
- `docs/PRD.md` - Product requirements
- `docs/guides/` - How-to guides
- Inline code comments - Complex logic

### Documentation Standards

- Use **Mermaid** for diagrams (not ASCII art)
- Follow markdown lint rules (see `.markdownlint.jsonc`)
- Keep line length under 120 characters
- Use proper heading hierarchy

## 🐛 Bug Reports

Use the bug report template and include:

1. **Clear description** of the issue
2. **Steps to reproduce** (numbered list)
3. **Expected vs actual** behavior
4. **Environment details** (browser, version, OS)
5. **Console logs** (if applicable)
6. **Screenshots** (for UI bugs)

## ✨ Feature Requests

Use the feature request template and include:

1. **Problem statement** - What problem does this solve?
2. **Proposed solution** - How should it work?
3. **Related phase** - Which roadmap phase does this align with?
4. **Priority** - How important is this?
5. **Alternatives** - What else did you consider?

## ❓ Questions?

- **General questions**: [GitHub Discussions](https://github.com/and3rn3t/homehub/discussions)
- **Bug reports**: [GitHub Issues](https://github.com/and3rn3t/homehub/issues)
- **Security**: See [SECURITY.md](SECURITY.md)

## 📜 License

By contributing, you agree that your contributions will be licensed under the same license as the project (see [LICENSE](LICENSE)).

---

**Thank you for contributing to HomeHub! 🎉**
