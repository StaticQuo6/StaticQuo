import { create } from 'zustand'

interface LoRaStore {
  connected: boolean
  deviceId: string | null
  firmware: string | null
  nodesInRange: number
  setConnected: (id: string, fw: string) => void
  setDisconnected: () => void
}

export const useLoRaStore = create<LoRaStore>()((set) => ({
  connected: false,
  deviceId: null,
  firmware: null,
  nodesInRange: 0,
  setConnected: (id, fw) => set({ connected: true, deviceId: id, firmware: fw }),
  setDisconnected: () => set({ connected: false, deviceId: null, firmware: null, nodesInRange: 0 }),
}))
