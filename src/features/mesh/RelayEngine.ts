import { useMeshStore } from './useMeshStore'
import type { MeshEnvelope } from './MeshEnvelope'

const TTL_DECAY = 1
const DEDUP_WINDOW_MS = 600_000

export class RelayEngine {
  private cleanupInterval: ReturnType<typeof setInterval> | null = null

  start(): void {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000)
  }

  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  receiveEnvelope(envelope: MeshEnvelope): 'accepted' | 'duplicate' | 'expired' {
    const store = useMeshStore.getState()

    if (store.isProcessed(envelope.id)) return 'duplicate'

    if (envelope.ttl <= 0) return 'expired'

    const decremented: MeshEnvelope = { ...envelope, ttl: envelope.ttl - TTL_DECAY }

    store.enqueueRelay(decremented)

    return 'accepted'
  }

  getNextForRelay(): MeshEnvelope | null {
    const store = useMeshStore.getState()
    const msg = store.dequeueRelay()
    return msg ? (msg as unknown as MeshEnvelope) : null
  }

  getQueueSize(): number {
    return useMeshStore.getState().relayQueue.length
  }

  private cleanup(): void {
    const store = useMeshStore.getState()
    const now = Date.now()

    store.relayQueue.forEach((msg) => {
      if (now - msg.timestamp > DEDUP_WINDOW_MS) {
        store.markProcessed(msg.id)
      }
    })
  }
}

export const relayEngine = new RelayEngine()
