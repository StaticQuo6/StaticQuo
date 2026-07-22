import { useFacadeStore } from './useFacadeStore'

interface Props {
  onLock: () => void
}

const features = [
  { id: 'heatmap', label: 'Needs Heatmap', icon: '📍', desc: 'Supply tracking & proximity beacon' },
  { id: 'lora', label: 'LoRa Radio', icon: '📡', desc: 'Meshtastic node integration' },
  { id: 'maps', label: 'Offline Maps', icon: '🗺️', desc: 'Vector tile navigation' },
  { id: 'search', label: 'Protocols', icon: '📖', desc: 'Emergency & legal rights search' },
  { id: 'mesh', label: 'Mesh Relay', icon: '🔗', desc: 'BLE peer-to-peer transport' },
  { id: 'vault', label: 'Detention Vault', icon: '🔐', desc: 'Encrypted incident records' },
] as const

export function TrueApp({ onLock }: Props) {
  const skin = useFacadeStore((s) => s.skin)

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold">StaticQuo</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">Facade: {skin}</span>
          <button
            onClick={onLock}
            className="text-xs px-3 py-1 rounded-lg bg-gray-800 text-gray-400 active:bg-gray-700"
          >
            Lock
          </button>
        </div>
      </header>

      <main className="p-4 space-y-3 max-w-lg mx-auto">
        <p className="text-sm text-gray-500 mb-4">
          Select a feature to get started.
        </p>

        {features.map((f) => (
          <button
            key={f.id}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-900 border border-gray-800 active:bg-gray-800 transition-colors text-left"
          >
            <span className="text-2xl">{f.icon}</span>
            <div>
              <p className="font-medium text-white">{f.label}</p>
              <p className="text-xs text-gray-500">{f.desc}</p>
            </div>
          </button>
        ))}
      </main>
    </div>
  )
}
