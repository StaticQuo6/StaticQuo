import { create } from 'zustand'

type SupplyLevel = 'critical' | 'low' | 'saturated' | 'unknown'

interface HeatmapStore {
  nodes: Record<string, { lat: number; lng: number; supplies: Record<string, SupplyLevel> }>
  beaconActive: boolean
  toggleBeacon: () => void
}

export const useHeatmapStore = create<HeatmapStore>()((set) => ({
  nodes: {},
  beaconActive: false,
  toggleBeacon: () => set((s) => ({ beaconActive: !s.beaconActive })),
}))
