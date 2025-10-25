/**
 * TypeScript declarations for Background Sync API
 * Extends ServiceWorkerRegistration with sync property
 */

interface SyncManager {
  register(tag: string): Promise<void>
  getTags(): Promise<string[]>
}

interface ServiceWorkerRegistration {
  readonly sync: SyncManager
}

interface SyncEvent extends ExtendableEvent {
  readonly tag: string
  readonly lastChance: boolean
}

interface ServiceWorkerGlobalScopeEventMap {
  sync: SyncEvent
}
