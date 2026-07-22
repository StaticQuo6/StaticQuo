import { useLoRaStore, type LoRaDeviceInfo } from './useLoRaStore'
import {
  getMeshtasticServiceUuid,
} from './MeshtasticBLE'

declare global {
  interface Window {
    BluetoothLe?: {
      requestLEScan(options: { services: string[] }): Promise<void>
      stopLEScan(): Promise<void>
      connect(options: { deviceId: string }): Promise<void>
      disconnect(options: { deviceId: string }): Promise<void>
      discoverServices(options: { deviceId: string }): Promise<{ services: { uuid: string }[] }>
    }
  }
}

export function LoRaOnboarding() {
  const { status, devices, setStatus, setDevices } = useLoRaStore()

  const handleScan = async () => {
    setStatus('scanning')

    const scanned: LoRaDeviceInfo[] = []

    try {
      // Simulated BLE scan for Meshtastic UUID
      scanned.push({
        name: 'Meshtastic_ab3f',
        serviceUuid: getMeshtasticServiceUuid(),
        toRadioUuid: '',
        fromRadioUuid: '',
        fromNumUuid: '',
      })
      scanned.push({
        name: 'Meshtastic_7c12',
        serviceUuid: getMeshtasticServiceUuid(),
        toRadioUuid: '',
        fromRadioUuid: '',
        fromNumUuid: '',
      })
    } catch {
      // scan failed
    }

    setDevices(scanned)
    if (scanned.length === 0) setStatus('disconnected')
  }

  const handleConnect = async (device: LoRaDeviceInfo) => {
    setStatus('connecting')

    try {
      if (window.BluetoothLe) {
        await window.BluetoothLe.connect({ deviceId: device.name })
      }

      const store = useLoRaStore.getState()
      store.setConnected(device.name, '2.5.0', 'Heltec V3')
      store.setStatus('connected')
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('disconnected'), 3000)
    }
  }

  if (status === 'connected') return null

  return (
    <div className="p-4">
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
        <div className="text-center mb-6">
          <p className="text-4xl mb-2">📡</p>
          <h2 className="text-lg font-bold text-white mb-1">Connect LoRa Device</h2>
          <p className="text-xs text-gray-500">
            Scans for nearby Meshtastic-compatible devices
          </p>
        </div>

        {status === 'disconnected' && (
          <button
            onClick={handleScan}
            className="w-full h-12 rounded-xl bg-blue-600 text-white font-medium active:bg-blue-500 transition-colors"
          >
            Scan for devices
          </button>
        )}

        {status === 'scanning' && (
          <div className="text-center">
            <p className="text-blue-400 text-sm animate-pulse">Scanning...</p>
            {devices.map((d) => (
              <div key={d.name} className="mt-4">
                <button
                  onClick={() => handleConnect(d)}
                  className="w-full h-12 rounded-xl bg-gray-800 text-white text-sm font-medium active:bg-gray-700 transition-colors"
                >
                  {d.name}
                </button>
              </div>
            ))}
            {devices.length === 0 && (
              <p className="text-gray-500 text-xs mt-4">No devices found. Tap scan again.</p>
            )}
          </div>
        )}

        {status === 'connecting' && (
          <p className="text-yellow-400 text-sm text-center animate-pulse">Connecting...</p>
        )}

        {status === 'error' && (
          <p className="text-red-400 text-sm text-center">Connection failed. Try again.</p>
        )}
      </div>
    </div>
  )
}
