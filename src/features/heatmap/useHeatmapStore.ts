import { create } from 'zustand'

type SupplyCategory = 'water' | 'medical' | 'power' | 'food' | 'shelter'
type SupplyLevel = 'critical' | 'low' | 'saturated' | 'unknown'

interface SupplyNode {
  id: string
  lat: number
  lng: number
  supplies: Record<SupplyCategory, SupplyLevel>
  updatedAt: number
}

interface HeatmapStore {
  nodes: Record<string, SupplyNode>
  beaconActive: boolean
  selectedCategory: SupplyCategory
  setSupply: (nodeId: string, category: SupplyCategory, level: SupplyLevel) => void
  removeNode: (nodeId: string) => void
  toggleBeacon: () => void
  setSelectedCategory: (cat: SupplyCategory) => void
  addOrUpdateNode: (node: SupplyNode) => void
}

export type { SupplyCategory, SupplyLevel, SupplyNode }

export const useHeatmapStore = create<HeatmapStore>()((set) => ({
  nodes: {},
  beaconActive: false,
  selectedCategory: 'water',

  setSupply: (nodeId, category, level) =>
    set((s) => {
      const existing = s.nodes[nodeId]
      if (!existing) return s
      return {
        nodes: {
          ...s.nodes,
          [nodeId]: {
            ...existing,
            supplies: { ...existing.supplies, [category]: level },
            updatedAt: Date.now(),
          },
        },
      }
    }),

  removeNode: (nodeId) =>
    set((s) => {
      const { [nodeId]: _, ...rest } = s.nodes
      return { nodes: rest }
    }),

  toggleBeacon: () => set((s) => ({ beaconActive: !s.beaconActive })),

  setSelectedCategory: (cat) => set({ selectedCategory: cat }),

  addOrUpdateNode: (node) =>
    set((s) => ({ nodes: { ...s.nodes, [node.id]: node } })),
}))
