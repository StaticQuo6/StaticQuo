import { useMeshStore } from './useMeshStore'
import { RelayEngine } from './RelayEngine'
import { getBlePeripheral } from '../../shared/ble/BlePeripheralPlugin'
import { shardCollector } from '../../core/ShardCollector'
import { BleClient } from '@capacitor-community/bluetooth-le'
import { Capacitor } from '@capacitor/core'
import type { MeshEnvelope } from './MeshEnvelope'

export class MeshBLETransport {
  private engine: RelayEngine
  private scanInterval: ReturnType<typeof setInterval> | null = null
  private isRunning = false

  constructor(engine: RelayEngine) {
    this.engine = engine
  }

  async start(deviceFingerprint: string): Promise<void> {
    this.isRunning = true

    const ble = getBlePeripheral()
    if (ble) {
      try {
        await ble.openGattServer()
        await ble.startAdvertising({ localName: `SQ:${deviceFingerprint.slice(0, 8)}` })
      } catch {
        // Peripheral mode not available on this device
      }
    }

    this.scanInterval = setInterval(() => this.scanForPeers(), 10_000)
    this.engine.start()
  }

  async stop(): Promise<void> {
    this.isRunning = false

    if (this.scanInterval) clearInterval(this.scanInterval)

    const ble = getBlePeripheral()
    if (ble) {
      try {
        await ble.stopAdvertising()
        await ble.closeGattServer()
      } catch {
        // ignore
      }
    }

    this.engine.stop()
  }

  receiveEnvelope(envelope: MeshEnvelope): 'accepted' | 'duplicate' | 'expired' {
    const result = this.engine.receiveEnvelope(envelope)
    if (result === 'accepted') {
      shardCollector.ingest(envelope.payload)
    }
    return result
  }

  private async scanForPeers(): Promise<void> {
    if (!this.isRunning) return

    const store = useMeshStore.getState()
    const now = Date.now()

    Object.keys(store.peers).forEach((id) => {
      if (now - store.peers[id].lastSeen > 300_000) {
        store.removePeer(id)
      }
    })

    if (Capacitor.isNativePlatform()) {
      try {
        await BleClient.requestLEScan(
          { services: [], scanMode: 0, allowDuplicates: false },
          (result) => {
            const id = result.device.deviceId
            const name = result.localName || result.device.name || `Peer_${id.slice(0, 8)}`
            const rssi = result.rssi ?? -100
            store.addPeer(id, name, rssi)
          }
        )
        setTimeout(() => BleClient.stopLEScan(), 3000)
      } catch {
        // BLE scan unavailable — maintain existing peers
      }
    }

    const relayMsg = this.engine.getNextForRelay()
    if (relayMsg) {
      const peerIds = Object.keys(useMeshStore.getState().peers)
      if (peerIds.length > 0) {
        const targetPeer = peerIds[Math.floor(Math.random() * peerIds.length)]
        const peers = useMeshStore.getState().peers
        const peer = peers[targetPeer]
        if (peer) {
          useMeshStore.setState({
            peers: {
              ...peers,
              [targetPeer]: { ...peer, packetsRelayed: peer.packetsRelayed + 1 },
            },
          })
        }
      }
    }
  }

  simulatePeerDiscovery(peerId: string, name: string, rssi: number): void {
    useMeshStore.getState().addPeer(peerId, name, rssi)
  }
}

export const meshTransport = new MeshBLETransport(
  new RelayEngine()
)
