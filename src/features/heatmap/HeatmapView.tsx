import { useHeatmapStore, type SupplyCategory, type SupplyLevel } from './useHeatmapStore'
import { SupplyToggle } from './SupplyToggle'

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
  const { nodes, selectedCategory } = useHeatmapStore()

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 px-4 py-3">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <span>📍</span> Needs Heatmap
        </h1>
      </header>

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
