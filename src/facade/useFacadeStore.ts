import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SkinType = 'calculator' | 'weather'
type FacadeState = 'locked' | 'decoy' | 'authenticated'

interface FacadeStore {
  state: FacadeState
  skin: SkinType
  secretPinHash: string | null
  decoyPinHash: string | null
  setSkin: (skin: SkinType) => void
  setSecretPin: (pin: string) => void
  setDecoyPin: (pin: string) => void
  authenticate: (pin: string) => Promise<'authenticated' | 'decoy' | 'denied'>
  lock: () => void
  isConfigured: () => boolean
}

async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const pinHash = await hashPin(pin)
  return pinHash === hash
}

export const useFacadeStore = create<FacadeStore>()(
  persist(
    (set, get) => ({
      state: 'locked',
      skin: 'calculator',
      secretPinHash: null,
      decoyPinHash: null,

      setSkin: (skin) => set({ skin }),

      setSecretPin: async (pin) => {
        const hash = await hashPin(pin)
        set({ secretPinHash: hash })
      },

      setDecoyPin: async (pin) => {
        const hash = await hashPin(pin)
        set({ decoyPinHash: hash })
      },

      authenticate: async (pin) => {
        const { secretPinHash, decoyPinHash } = get()

        if (secretPinHash && (await verifyPin(pin, secretPinHash))) {
          set({ state: 'authenticated' })
          return 'authenticated'
        }

        if (decoyPinHash && (await verifyPin(pin, decoyPinHash))) {
          set({ state: 'decoy' })
          return 'decoy'
        }

        return 'denied'
      },

      lock: () => set({ state: 'locked' }),

      isConfigured: () => {
        const { secretPinHash } = get()
        return secretPinHash !== null
      },
    }),
    {
      name: 'staticquo-facade',
    }
  )
)
