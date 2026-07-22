import { useState } from 'react'
import { useMapStore } from './useMapStore'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Capacitor } from '@capacitor/core'

const TILE_URLS: Record<string, string> = {
  'NYC': 'https://staticquo-assets.s3.amazonaws.com/tiles/nyc.mbtiles',
  'LA': 'https://staticquo-assets.s3.amazonaws.com/tiles/la.mbtiles',
  'DC': 'https://staticquo-assets.s3.amazonaws.com/tiles/dc.mbtiles',
  'Portland': 'https://staticquo-assets.s3.amazonaws.com/tiles/portland.mbtiles',
}

export function TileDownloader() {
  const { availableRegions, tileStatus, downloadProgress, setRegion, setTileStatus, setDownloadProgress } =
    useMapStore()
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async (name: string) => {
    setError(null)
    setTileStatus('downloading')
    setRegion(name)
    setDownloadProgress(0)

    const url = TILE_URLS[name]
    if (!url) {
      setError(`No tile source for ${name}`)
      setTileStatus('idle')
      return
    }

    try {
      if (Capacitor.isNativePlatform()) {
        let lastBytes = 0
        Filesystem.addListener('progress', (event) => {
          if (event.url === url) {
            const pct = Math.round((event.bytes / event.contentLength) * 100)
            setDownloadProgress(Math.min(pct, 100))
            lastBytes = event.bytes
          }
        })

        await Filesystem.downloadFile({
          url,
          path: `maps/${name.toLowerCase().replace(/\s+/g, '-')}.mbtiles`,
          directory: Directory.Data,
          recursive: true,
          progress: true,
        })

        Filesystem.removeAllListeners()
      } else {
        const resp = await fetch(url)
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const blob = await resp.blob()
        const total = blob.size
        let loaded = 0
        const reader = new Response(blob).body?.getReader()
        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            loaded += value.length
            setDownloadProgress(Math.round((loaded / total) * 100))
          }
        }
      }

      setDownloadProgress(100)
      setTileStatus('ready')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed')
      setTileStatus('idle')
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-3">
      <p className="text-sm font-medium text-white mb-2">Offline Map Regions</p>

      {error && (
        <div className="p-3 rounded-xl bg-red-900/40 border border-red-800">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

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
