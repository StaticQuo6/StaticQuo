import { create } from 'zustand'

interface MapStore {
  currentRegion: string | null
  tileStatus: 'none' | 'downloading' | 'ready'
  setRegion: (region: string) => void
  setTileStatus: (status: 'none' | 'downloading' | 'ready') => void
}

export const useMapStore = create<MapStore>()((set) => ({
  currentRegion: null,
  tileStatus: 'none',
  setRegion: (region) => set({ currentRegion: region }),
  setTileStatus: (status) => set({ tileStatus: status }),
}))
