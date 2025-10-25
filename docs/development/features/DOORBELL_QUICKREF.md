# Doorbell System - Quick Reference

**For**: Developers integrating doorbell features
**Time to Read**: 5 minutes
**Prerequisites**: Basic React & TypeScript knowledge

---

## 🚀 Quick Start

### 1. Import Components

```typescript
import { DoorbellNotification } from '@/components/DoorbellNotification'
import { DoorbellHistory } from '@/components/DoorbellHistory'
import { generateMockDoorbellEvent } from '@/constants/mock-doorbell-events'
```

### 2. Minimal Implementation

```tsx
function MyApp() {
  const [event, setEvent] = useState(null)
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => {
          setEvent(generateMockDoorbellEvent())
          setIsOpen(true)
        }}
      >
        Ring Doorbell
      </button>

      {event && (
        <DoorbellNotification event={event} isOpen={isOpen} onClose={() => setIsOpen(false)} />
      )}
    </>
  )
}
```

---

## 📋 Common Patterns

### Pattern 1: With Callbacks

```tsx
<DoorbellNotification
  event={event}
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onAnswer={id => console.log('Answer:', id)}
  onIgnore={id => console.log('Ignore:', id)}
  onQuickReply={(id, msg) => console.log('Reply:', msg)}
/>
```

### Pattern 2: Custom Quick Replies

```tsx
<DoorbellNotification
  event={event}
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  quickReplyMessages={['Be right there!', 'Leave at door', 'Not interested']}
/>
```

### Pattern 3: Disable Auto-Dismiss

```tsx
<DoorbellNotification
  event={event}
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  autoDismissAfter={0}
/>
```

### Pattern 4: History with Custom Events

```tsx
const [events, setEvents] = useState<DoorbellEvent[]>([])

useEffect(() => {
  fetchEvents().then(setEvents)
}, [])

return <DoorbellHistory events={events} />
```

---

## 🎨 Component Props

### DoorbellNotification

| Prop                 | Type                                | Required | Default                 | Description                      |
| -------------------- | ----------------------------------- | -------- | ----------------------- | -------------------------------- |
| `event`              | `DoorbellEvent`                     | ✅       | -                       | Event data                       |
| `isOpen`             | `boolean`                           | ✅       | -                       | Modal visibility                 |
| `onClose`            | `() => void`                        | ✅       | -                       | Close callback                   |
| `onAnswer`           | `(id: string) => void`              | ❌       | -                       | Answer callback                  |
| `onIgnore`           | `(id: string) => void`              | ❌       | -                       | Ignore callback                  |
| `onQuickReply`       | `(id: string, msg: string) => void` | ❌       | -                       | Quick reply callback             |
| `quickReplyMessages` | `string[]`                          | ❌       | `DEFAULT_QUICK_REPLIES` | Reply options                    |
| `autoDismissAfter`   | `number`                            | ❌       | `30`                    | Auto-dismiss seconds (0 = never) |

### DoorbellHistory

| Prop     | Type              | Required | Default                | Description  |
| -------- | ----------------- | -------- | ---------------------- | ------------ |
| `events` | `DoorbellEvent[]` | ❌       | `MOCK_DOORBELL_EVENTS` | Events array |

---

## 📦 Type Definitions

### DoorbellEvent (Essential Fields)

```typescript
interface DoorbellEvent {
  id: string
  cameraId: string
  actionType: 'button_press' | 'motion_detected' | 'package_detected'
  timestamp: Date | string
  responseStatus: 'answered' | 'ignored' | 'missed' | 'quick_reply'
  snapshotUrl?: string
  visitorInfo?: {
    name?: string
    deliveryService?: string
    isRepeatVisitor?: boolean
  }
  notificationSent: boolean
  viewed: boolean
}
```

---

## 🛠️ Helper Functions

### Generate Mock Event

```typescript
import { generateMockDoorbellEvent } from '@/constants/mock-doorbell-events'

// Random event
const event = generateMockDoorbellEvent()

// Custom event
const custom = generateMockDoorbellEvent({
  actionType: 'package_detected',
  visitorInfo: { deliveryService: 'Amazon' },
})
```

### Default Quick Replies

```typescript
import { DEFAULT_QUICK_REPLIES } from '@/constants/mock-doorbell-events'
// ["I'll be right there!", "Please leave the package...", ...]
```

### Filter Events

```typescript
import {
  getDoorbellEventsByStatus,
  getUnviewedDoorbellEvents,
  getTodayDoorbellEvents,
} from '@/constants/mock-doorbell-events'

const answered = getDoorbellEventsByStatus('answered')
const unviewed = getUnviewedDoorbellEvents()
const today = getTodayDoorbellEvents()
```

---

## 🎯 Integration Checklist

- [ ] Import components and types
- [ ] Setup state (`event`, `isOpen`)
- [ ] Create trigger function
- [ ] Implement callbacks (optional)
- [ ] Render DoorbellNotification
- [ ] Add DoorbellHistory tab/page
- [ ] Test with "Test Doorbell" button
- [ ] Verify animations work smoothly
- [ ] Check mobile responsiveness

---

## 🐛 Common Issues

### Issue: Notification doesn't appear

**Solution**: Verify `isOpen={true}` and `event` is not null

### Issue: Auto-dismiss not working

**Solution**: Check `autoDismissAfter > 0` and console for errors

### Issue: Callbacks not firing

**Solution**: Ensure callbacks are defined: `onAnswer={() => {}}`

### Issue: History shows no events

**Solution**: Pass `events` prop or use default mock data

---

## 📚 Related Docs

- [Complete Documentation](./DOORBELL_INTEGRATION.md)
- [Test Report](./DOORBELL_TEST_REPORT.md)
- [Security Cameras](./SECURITY_CAMERAS.md)
- [Phase 5 Plan](../milestones/PHASE_5_SECURITY_PLAN.md)

---

## 💡 Pro Tips

1. **Lazy Load**: Use dynamic imports for better performance
2. **Persist Events**: Store in KV store for real history
3. **Toast Feedback**: Always show toast on actions
4. **Mobile First**: Test on phone sizes (320px+)
5. **Accessibility**: Ensure keyboard navigation works

---

**Quick Reference v1.0** | October 13, 2025
