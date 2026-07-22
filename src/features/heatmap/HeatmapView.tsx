import { useState } from 'react'
import { useHeatmapStore, type SupplyCategory, type SupplyLevel } from './useHeatmapStore'
import { SupplyToggle } from './SupplyToggle'
import { broadcastBeacon, stopBeacon } from './BeaconBroadcaster'

const levelColors: Record<SupplyLevel, string> = {
  critical: 'bg-red-600 border-red-400',
  low: 'bg-yellow-500 border-yellow-300',
  saturated: 'bg-green-600 border-green-400',
  unknown: 'bg-gray-600 border-gray-500',
}

const icons: Record<SupplyCategory, string> = {
  water: '💧',
  medical: '🏥',
  power: '🔋',
  food: '🍞',
  shelter: '🏠',
}

export function HeatmapView() {
  const { nodes, selectedCategory, beaconActive, toggleBeacon } = useHeatmapStore()
  const [beaconErr, setBeaconErr] = useState(false)

  const handleToggleBeacon = async () => {
    if (beaconActive) {
      await stopBeacon()
      toggleBeacon()
      return
    }
    try {
      await broadcastBeacon('SQ-Beacon')
      toggleBeacon()
      setBeaconErr(false)
    } catch {
      setBeaconErr(true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <span>📍</span> Needs Heatmap
        </h1>
        <button
          onClick={handleToggleBeacon}
          className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-colors ${
            beaconActive
              ? 'bg-green-600 text-white active:bg-green-500'
              : 'bg-gray-800 text-gray-400 active:bg-gray-700'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${beaconActive ? 'bg-green-300 animate-pulse' : 'bg-gray-600'}`} />
          {beaconActive ? 'Beacon ON' : 'Beacon OFF'}
        </button>
      </header>
      {beaconErr && (
        <div className="px-4 pt-2">
          <p className="text-xs text-red-400">Beacon unavailable on this device</p>
        </div>
      )}

      <SupplyToggle />

      <main className="p-4 space-y-3 max-w-lg mx-auto">
        {Object.keys(nodes).length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🗺️</p>
            <p className="text-gray-500">No nodes in range yet</p>
            <p className="text-xs text-gray-600 mt-1">
              Enable the beacon or wait for nearby broadcasts
            </p>
          </div>
        )}

        {Object.values(nodes).map((node) => (
          <div
            key={node.id}
            className="p-4 rounded-2xl bg-gray-900 border border-gray-800"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-mono text-gray-500">
                {node.id.slice(0, 8)}...
              </p>
              <p className="text-xs text-gray-600">
                {new Date(node.updatedAt).toLocaleTimeString()}
              </p>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {(Object.entries(node.supplies) as [SupplyCategory, SupplyLevel][]).map(
                ([cat, level]) => (
                  <div
                    key={cat}
                    className={`text-center p-2 rounded-xl border ${levelColors[level]} ${
                      cat === selectedCategory ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <p className="text-lg">{icons[cat]}</p>
                    <p className="text-[10px] text-gray-400 mt-1 capitalize">{level}</p>
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
