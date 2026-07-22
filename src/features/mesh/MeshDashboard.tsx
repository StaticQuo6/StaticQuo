import { useEffect, useState } from 'react'
import { useMeshStore } from './useMeshStore'
import { meshTransport } from './MeshBLETransport'
import { getOrCreateIdentity } from './MeshIdentity'

export function MeshDashboard() {
  const { peers, relayQueue } = useMeshStore()
  const [fingerprint, setFingerprint] = useState('')
  const [transportActive, setTransportActive] = useState(false)

  useEffect(() => {
    getOrCreateIdentity().then((id) => setFingerprint(id.fingerprint))
  }, [])

  const handleStart = async () => {
    await meshTransport.start(fingerprint)
    setTransportActive(true)
  }

  const handleStop = async () => {
    await meshTransport.stop()
    setTransportActive(false)
  }

  const handleSimulatePeer = () => {
    const peerId = crypto.randomUUID()
    const names = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo']
    const name = names[Math.floor(Math.random() * names.length)]
    const rssi = -30 - Math.floor(Math.random() * 60)
    meshTransport.simulatePeerDiscovery(peerId, `Mesh-${name}`, rssi)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <main className="p-4 space-y-4 max-w-lg mx-auto pt-16">
        <div className="p-4 rounded-2xl bg-gray-900 border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-white">Identity</p>
            <button
              onClick={transportActive ? handleStop : handleStart}
              className={`text-xs px-3 py-1 rounded-lg ${
                transportActive
                  ? 'bg-red-600 text-white active:bg-red-500'
                  : 'bg-blue-600 text-white active:bg-blue-500'
              }`}
            >
              {transportActive ? 'Stop' : 'Start'}
            </button>
          </div>
          <p className="text-xs font-mono text-gray-500">SQ:{fingerprint}</p>
          <p className="text-xs text-gray-600 mt-1">
            Relay queue: {relayQueue.length} messages
          </p>
        </div>

        {!transportActive && !fingerprint && (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">🔗</p>
            <p className="text-gray-500">Tap "Start" to enable mesh relay</p>
          </div>
        )}

        {Object.keys(peers).length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white">Peers ({Object.keys(peers).length})</p>
              <button
                onClick={handleSimulatePeer}
                className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-400 active:bg-gray-700"
              >
                + Simulate
              </button>
            </div>
            {Object.entries(peers).map(([id, peer]) => (
              <div
                key={id}
                className="p-3 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-white">{peer.name}</p>
                  <p className="text-xs text-gray-600">
                    RSSI: {peer.rssi} dBm · {peer.packetsRelayed} relayed
                  </p>
                </div>
                <div
                  className={`w-2 h-2 rounded-full ${
                    Date.now() - peer.lastSeen < 60_000 ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                />
              </div>
            ))}
          </div>
        )}

        {Object.keys(peers).length === 0 && transportActive && (
          <div className="text-center py-12">
            <p className="text-gray-500">Waiting for nearby peers...</p>
            <p className="text-xs text-gray-600 mt-1">
              Advertisting as SQ:{fingerprint.slice(0, 8)}
            </p>
            <button
              onClick={handleSimulatePeer}
              className="mt-4 text-xs px-3 py-1 rounded-lg bg-gray-800 text-gray-400 active:bg-gray-700"
            >
              Simulate peer for testing
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
