import { create } from 'zustand'

type ConnectionStatus = 'disconnected' | 'scanning' | 'connecting' | 'connected' | 'error'

interface LoRaDeviceInfo {
  name: string
  serviceUuid: string
  toRadioUuid: string
  fromRadioUuid: string
  fromNumUuid: string
}

interface LoRaTelemetry {
  nodeId: string
  batteryLevel?: number
  humidity?: number
  temperature?: number
  pressure?: number
  latitude?: number
  longitude?: number
  altitude?: number
  lastHeard: number
  signalRssi?: number
}

interface LoRaStore {
  status: ConnectionStatus
  devices: LoRaDeviceInfo[]
  connectedDeviceId: string | null
  firmware: string | null
  hardwareModel: string | null
  nodesInRange: number
  telemetry: Record<string, LoRaTelemetry>
  lastMessage: string | null
  setStatus: (status: ConnectionStatus) => void
  setDevices: (devices: LoRaDeviceInfo[]) => void
  setConnected: (deviceId: string, firmware: string, hwModel: string) => void
  setDisconnected: () => void
  addTelemetry: (nodeId: string, data: Partial<LoRaTelemetry>) => void
  setNodesInRange: (n: number) => void
  setLastMessage: (msg: string | null) => void
}

export type { ConnectionStatus, LoRaDeviceInfo, LoRaTelemetry }

export const useLoRaStore = create<LoRaStore>()((set) => ({
  status: 'disconnected',
  devices: [],
  connectedDeviceId: null,
  firmware: null,
  hardwareModel: null,
  nodesInRange: 0,
  telemetry: {},
  lastMessage: null,

  setStatus: (status) => set({ status }),

  setDevices: (devices) => set({ devices }),

  setConnected: (deviceId, firmware, hwModel) =>
    set({ status: 'connected', connectedDeviceId: deviceId, firmware, hardwareModel: hwModel }),

  setDisconnected: () =>
    set({
      status: 'disconnected',
      connectedDeviceId: null,
      firmware: null,
      hardwareModel: null,
      nodesInRange: 0,
      telemetry: {},
    }),

  addTelemetry: (nodeId, data) =>
    set((s) => ({
      telemetry: {
        ...s.telemetry,
        [nodeId]: { ...s.telemetry[nodeId], ...data, nodeId, lastHeard: Date.now() },
      },
    })),

  setNodesInRange: (n) => set({ nodesInRange: n }),
  setLastMessage: (msg) => set({ lastMessage: msg }),
}))
