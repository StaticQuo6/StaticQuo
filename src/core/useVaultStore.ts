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
  vaultPin: string | null
  addRecord: (r: VaultRecord) => void
  removeRecord: (id: string) => void
  unlock: (pin: string) => void
  lock: () => void
}

export const useVaultStore = create<VaultStore>()((set) => ({
  records: [],
  isUnlocked: false,
  vaultPin: null,
  addRecord: (r) =>
    set((s) => ({ records: [...s.records, r] })),
  removeRecord: (id) =>
    set((s) => ({ records: s.records.filter((r) => r.id !== id) })),
  unlock: (pin) => set({ isUnlocked: true, vaultPin: pin }),
  lock: () => set({ isUnlocked: false, vaultPin: null }),
}))
