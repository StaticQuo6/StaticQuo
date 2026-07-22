import { create } from 'zustand'

interface MeshStore {
  peers: Record<string, { name: string; rssi: number; lastSeen: number }>
  relayQueue: number
  addPeer: (id: string, name: string, rssi: number) => void
  removePeer: (id: string) => void
}

export const useMeshStore = create<MeshStore>()((set) => ({
  peers: {},
  relayQueue: 0,
  addPeer: (id, name, rssi) =>
    set((s) => ({
      peers: { ...s.peers, [id]: { name, rssi, lastSeen: Date.now() } },
    })),
  removePeer: (id) =>
    set((s) => {
      const { [id]: _, ...rest } = s.peers
      return { peers: rest }
    }),
}))
