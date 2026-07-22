import { create } from 'zustand'

interface MapRegion {
  name: string
  url: string
  sizeMb: number
}

interface MapStore {
  currentRegion: string | null
  tileStatus: 'none' | 'downloading' | 'ready' | 'error'
  availableRegions: MapRegion[]
  downloadProgress: number
  setRegion: (name: string | null) => void
  setTileStatus: (status: 'none' | 'downloading' | 'ready' | 'error') => void
  setDownloadProgress: (pct: number) => void
  setAvailableRegions: (regions: MapRegion[]) => void
}

export type { MapRegion }

export const useMapStore = create<MapStore>()((set) => ({
  currentRegion: null,
  tileStatus: 'none',
  availableRegions: [
    { name: 'New York City', url: 'https://tiles.staticquo.app/nyc.mbtiles', sizeMb: 45 },
    { name: 'Los Angeles', url: 'https://tiles.staticquo.app/la.mbtiles', sizeMb: 52 },
    { name: 'Washington DC', url: 'https://tiles.staticquo.app/dc.mbtiles', sizeMb: 28 },
    { name: 'Portland', url: 'https://tiles.staticquo.app/portland.mbtiles', sizeMb: 22 },
  ],
  downloadProgress: 0,
  setRegion: (name) => set({ currentRegion: name }),
  setTileStatus: (status) => set({ tileStatus: status }),
  setDownloadProgress: (pct) => set({ downloadProgress: pct }),
  setAvailableRegions: (regions) => set({ availableRegions: regions }),
}))
