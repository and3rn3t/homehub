/**
 * Type declarations for @koush/arlo
 *
 * Community library for Arlo camera integration
 * @see https://github.com/JOHNEPPILLAR/arlo
 */

declare module '@koush/arlo' {
  import { EventEmitter } from 'events'

  export interface ArloDevice {
    deviceId: string
    deviceName: string
    deviceType: string
    state: string
    modelId?: string
    properties?: {
      batteryLevel?: number
      signalStrength?: number
      hwVersion?: string
    }
    presignedLastImageUrl?: string
    presignedSnapshotUrl?: string
  }

  export interface ArloSnapshot {
    presignedSnapshotUrl?: string
    [key: string]: unknown
  }

  export class Arlo extends EventEmitter {
    constructor()

    login(email: string, password: string): Promise<void>
    logout(): Promise<void>
    getDevices(): Promise<ArloDevice[]>
    subscribe(): Promise<void>
    unsubscribe(): Promise<void>
    requestSnapshot(device: ArloDevice): Promise<ArloSnapshot>
    startRecording(device: ArloDevice, duration: number): Promise<void>
    stopRecording(device: ArloDevice): Promise<void>

    on(event: 'doorbell', callback: (data: unknown) => void): this
    on(event: 'motionDetected', callback: (data: unknown) => void): this
    on(event: 'fullFrameSnapshotAvailable', callback: (data: unknown) => void): this
    on(event: string, callback: (data: unknown) => void): this
  }

  export default Arlo
}
