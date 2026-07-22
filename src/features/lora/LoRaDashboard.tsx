import { useLoRaStore } from './useLoRaStore'
import { LoRaOnboarding } from './LoRaOnboarding'

export function LoRaDashboard() {
  const { status, connectedDeviceId, firmware, hardwareModel, nodesInRange, telemetry, lastMessage, setDisconnected } =
    useLoRaStore()

  if (status !== 'connected') {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 px-4 py-3">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <span>📡</span> LoRa Radio
          </h1>
        </header>
        <LoRaOnboarding />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <span>📡</span> LoRa Radio
        </h1>
        <button
          onClick={setDisconnected}
          className="text-xs px-3 py-1 rounded-lg bg-gray-800 text-gray-400 active:bg-gray-700"
        >
          Disconnect
        </button>
      </header>

      <main className="p-4 space-y-4 max-w-lg mx-auto">
        <div className="p-4 rounded-2xl bg-gray-900 border border-gray-800">
          <p className="text-sm font-medium text-white mb-2">Device</p>
          <div className="space-y-1 text-xs text-gray-400">
            <p>Name: {connectedDeviceId}</p>
            <p>Firmware: {firmware || 'Unknown'}</p>
            <p>Hardware: {hardwareModel || 'Unknown'}</p>
            <p>Nodes in range: {nodesInRange}</p>
          </div>
        </div>

        {Object.keys(telemetry).length > 0 && (
          <div className="p-4 rounded-2xl bg-gray-900 border border-gray-800">
            <p className="text-sm font-medium text-white mb-3">Telemetry</p>
            <div className="space-y-2">
              {Object.entries(telemetry).map(([nodeId, data]) => (
                <div key={nodeId} className="text-xs text-gray-400 p-2 bg-gray-800 rounded-lg">
                  <p className="text-gray-300 font-medium mb-1">Node: {nodeId.slice(0, 8)}...</p>
                  {data.batteryLevel !== undefined && <p>Battery: {data.batteryLevel}%</p>}
                  {data.temperature !== undefined && <p>Temp: {data.temperature}°C</p>}
                  {data.humidity !== undefined && <p>Humidity: {data.humidity}%</p>}
                  {data.latitude !== undefined && (
                    <p>
                      Pos: {data.latitude.toFixed(4)}, {data.longitude?.toFixed(4)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {lastMessage && (
          <div className="p-4 rounded-2xl bg-gray-900 border border-gray-800">
            <p className="text-sm font-medium text-white mb-2">Last Message</p>
            <p className="text-xs text-gray-400">{lastMessage}</p>
          </div>
        )}
      </main>
    </div>
  )
}
