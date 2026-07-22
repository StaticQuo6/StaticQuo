import { useFacadeStore } from './useFacadeStore'

export function SkinSwitcher() {
  const { skin, setSkin } = useFacadeStore()

  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-900 border border-gray-800">
      <span className="text-sm text-gray-400 mr-2">Facade skin:</span>
      {(['calculator', 'weather'] as const).map((s) => (
        <button
          key={s}
          onClick={() => setSkin(s)}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            skin === s
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 active:bg-gray-700'
          }`}
        >
          {s === 'calculator' ? '🧮 Calc' : '🌤️ Weather'}
        </button>
      ))}
    </div>
  )
}
