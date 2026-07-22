import { useRef } from 'react'
import { useLoRaStore, type LoRaDeviceInfo, type ConnectionStatus } from './useLoRaStore'
import { getMeshtasticServiceUuid, MESH_SERVICE_UUID } from './MeshtasticBLE'
import { BleClient } from '@capacitor-community/bluetooth-le'

export function LoRaOnboarding() {
  const { status, devices, setStatus, setDevices, setConnected } = useLoRaStore()
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleScan = async () => {
    setStatus('scanning')
    const found: LoRaDeviceInfo[] = []

    try {
      await BleClient.requestLEScan(
        { services: [MESH_SERVICE_UUID], scanMode: 1 },
        (result) => {
          const name = result.localName || result.device.name || 'Unknown'
          const existing = found.find((d) => d.deviceId === result.device.deviceId)
          if (!existing) {
            found.push({
              deviceId: result.device.deviceId,
              name,
              serviceUuid: getMeshtasticServiceUuid(),
              toRadioUuid: '',
              fromRadioUuid: '',
              fromNumUuid: '',
            })
            setDevices([...found])
          }
        }
      )

      scanTimer.current = setTimeout(async () => {
        await BleClient.stopLEScan()
        setDevices(found)
        setStatus(found.length > 0 ? 'disconnected' : 'disconnected')
      }, 5000)
    } catch {
      setDevices(found)
      setStatus('disconnected')
    }
  }

  const handleConnect = async (device: LoRaDeviceInfo) => {
    setStatus('connecting')

    try {
      await BleClient.connect(device.deviceId, () => {
        useLoRaStore.getState().setStatus('disconnected')
      })

      const services = await BleClient.getServices(device.deviceId)
      const meshSvc = services.find((s) => s.uuid.toLowerCase() === MESH_SERVICE_UUID.toLowerCase())

      setConnected(
        device.deviceId,
        device.name,
        '2.5.0',
        'Heltec V3',
        meshSvc?.uuid || '',
        meshSvc?.characteristics.find((c) => c.properties.write)?.uuid || '',
        meshSvc?.characteristics.find((c) => c.properties.notify)?.uuid || '',
        meshSvc?.characteristics.find((c) => c.properties.read)?.uuid || '',
      )
      setStatus('connected')
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
              <div key={d.deviceId} className="mt-4">
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
