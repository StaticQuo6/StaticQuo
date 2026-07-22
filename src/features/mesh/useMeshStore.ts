import { create } from 'zustand'

interface MeshPeer {
  name: string
  rssi: number
  lastSeen: number
  packetsRelayed: number
}

interface MeshMessage {
  id: string
  src: string
  dst: string
  payload: string
  ttl: number
  timestamp: number
}

interface MeshStore {
  peers: Record<string, MeshPeer>
  relayQueue: MeshMessage[]
  processedIds: Set<string>
  addPeer: (id: string, name: string, rssi: number) => void
  removePeer: (id: string) => void
  updatePeerRssi: (id: string, rssi: number) => void
  enqueueRelay: (msg: MeshMessage) => void
  dequeueRelay: () => MeshMessage | undefined
  markProcessed: (id: string) => void
  isProcessed: (id: string) => boolean
}

export const useMeshStore = create<MeshStore>()((set, get) => ({
  peers: {},
  relayQueue: [],
  processedIds: new Set(),

  addPeer: (id, name, rssi) =>
    set((s) => ({
      peers: {
        ...s.peers,
        [id]: { name, rssi, lastSeen: Date.now(), packetsRelayed: 0 },
      },
    })),

  removePeer: (id) =>
    set((s) => {
      const { [id]: _, ...rest } = s.peers
      return { peers: rest }
    }),

  updatePeerRssi: (id, rssi) =>
    set((s) => {
      const peer = s.peers[id]
      if (!peer) return s
      return {
        peers: {
          ...s.peers,
          [id]: { ...peer, rssi, lastSeen: Date.now() },
        },
      }
    }),

  enqueueRelay: (msg) =>
    set((s) => ({
      relayQueue: [...s.relayQueue, msg].slice(-500),
      processedIds: new Set([...s.processedIds, msg.id]),
    })),

  dequeueRelay: () => {
    const { relayQueue } = get()
    if (relayQueue.length === 0) return undefined
    const [msg, ...rest] = relayQueue
    set({ relayQueue: rest })
    return msg
  },

  markProcessed: (id) =>
    set((s) => ({ processedIds: new Set([...s.processedIds, id]) })),

  isProcessed: (id) => get().processedIds.has(id),
}))
