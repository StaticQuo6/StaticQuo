import { useHeatmapStore, type SupplyCategory, type SupplyLevel } from './useHeatmapStore'

const categories: SupplyCategory[] = ['water', 'medical', 'power', 'food', 'shelter']
const levels: SupplyLevel[] = ['critical', 'low', 'saturated']

const levelColors: Record<SupplyLevel, string> = {
  critical: 'bg-red-600',
  low: 'bg-yellow-500',
  saturated: 'bg-green-500',
  unknown: 'bg-gray-600',
}

const icons: Record<SupplyCategory, string> = {
  water: '💧',
  medical: '🏥',
  power: '🔋',
  food: '🍞',
  shelter: '🏠',
}

export function SupplyToggle() {
  const { nodes, setSupply, selectedCategory, setSelectedCategory } = useHeatmapStore()

  const counts: Record<SupplyCategory, Record<SupplyLevel, number>> = {
    water: { critical: 0, low: 0, saturated: 0, unknown: 0 },
    medical: { critical: 0, low: 0, saturated: 0, unknown: 0 },
    power: { critical: 0, low: 0, saturated: 0, unknown: 0 },
    food: { critical: 0, low: 0, saturated: 0, unknown: 0 },
    shelter: { critical: 0, low: 0, saturated: 0, unknown: 0 },
  }

  Object.values(nodes).forEach((node) => {
    Object.entries(node.supplies).forEach(([cat, level]) => {
      if (level !== 'unknown') {
        counts[cat as SupplyCategory][level]++
      }
    })
  })

  return (
    <div className="p-4 space-y-3">
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 active:bg-gray-700'
            }`}
          >
            {icons[cat]} {cat}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {levels.map((level) => (
          <button
            key={level}
            onClick={() => {
              const nodeId = crypto.randomUUID()
              setSupply(nodeId, selectedCategory, level)
            }}
            className={`flex-1 h-10 rounded-xl text-xs font-medium text-white transition-opacity active:opacity-70 ${levelColors[level]}`}
          >
            {level}
          </button>
        ))}
      </div>

      <div className="flex justify-center gap-4 text-xs text-gray-500">
        {categories.map((cat) => (
          <div key={cat} className="text-center">
            <p className="text-lg">{icons[cat]}</p>
            {levels.map((l) => (
              <p key={l}>
                {l}: {counts[cat][l]}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
