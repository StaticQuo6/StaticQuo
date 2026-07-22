import { useMapStore } from './useMapStore'

export function TileDownloader() {
  const { availableRegions, tileStatus, downloadProgress, setRegion, setTileStatus, setDownloadProgress } =
    useMapStore()

  const handleDownload = async (name: string) => {
    setTileStatus('downloading')
    setRegion(name)

    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 200))
      setDownloadProgress(i)
    }

    setTileStatus('ready')
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-3">
      <p className="text-sm font-medium text-white mb-2">Offline Map Regions</p>

      {tileStatus === 'downloading' && (
        <div className="p-4 rounded-2xl bg-gray-900 border border-gray-800">
          <p className="text-sm text-yellow-400 mb-2">Downloading...</p>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{downloadProgress}%</p>
        </div>
      )}

      {availableRegions.map((region) => (
        <div
          key={region.name}
          className="flex items-center justify-between p-4 rounded-2xl bg-gray-900 border border-gray-800"
        >
          <div>
            <p className="text-sm text-white font-medium">{region.name}</p>
            <p className="text-xs text-gray-500">{region.sizeMb} MB</p>
          </div>
          <button
            onClick={() => handleDownload(region.name)}
            disabled={tileStatus === 'downloading'}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium disabled:opacity-30 active:bg-blue-500"
          >
            Download
          </button>
        </div>
      ))}
    </div>
  )
}
