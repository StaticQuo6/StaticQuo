import { create } from 'zustand'

interface VaultRecord {
  id: string
  type: 'incident' | 'media' | 'note'
  encryptedData: string
  createdAt: number
  shardStatus: 'local' | 'distributed'
}

interface VaultStore {
  records: VaultRecord[]
  isUnlocked: boolean
  addRecord: (r: VaultRecord) => void
  removeRecord: (id: string) => void
  unlock: () => void
  lock: () => void
}

export const useVaultStore = create<VaultStore>()((set) => ({
  records: [],
  isUnlocked: false,
  addRecord: (r) => set((s) => ({ records: [...s.records, r] })),
  removeRecord: (id) => set((s) => ({ records: s.records.filter((r) => r.id !== id) })),
  unlock: () => set({ isUnlocked: true }),
  lock: () => set({ isUnlocked: false }),
}))
