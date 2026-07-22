import { useEffect, useRef } from 'react'
import { useMapStore } from './useMapStore'
import { TileDownloader } from './TileDownloader'

export function OfflineMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const { currentRegion, tileStatus } = useMapStore()

  useEffect(() => {
    if (!mapContainer.current || tileStatus !== 'ready') return

    const initMap = async () => {
      try {
        const maplibregl = await import('maplibre-gl')
        await import('maplibre-gl/dist/maplibre-gl.css')

        const map = new maplibregl.default.Map({
          container: mapContainer.current!,
          style: {
            version: 8,
            sources: {
              osm: {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '© OpenStreetMap',
              },
            },
            layers: [
              {
                id: 'osm',
                type: 'raster',
                source: 'osm',
              },
            ],
          },
          center: [-73.985, 40.748],
          zoom: 12,
          attributionControl: false,
        })

        map.addControl(
          new maplibregl.default.NavigationControl(),
          'top-right'
        )

        return map
      } catch {
        console.error('MapLibre failed to load')
      }
    }

    initMap()
  }, [tileStatus, currentRegion])

  if (tileStatus === 'none') {
    return <TileDownloader />
  }

  if (tileStatus === 'downloading') {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <p className="text-gray-500 animate-pulse">Loading map tiles...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <span>🗺️</span> Offline Maps
          </h1>
          <span className="text-xs text-gray-500">{currentRegion}</span>
        </div>
      </header>
      <div ref={mapContainer} className="w-full h-[calc(100vh-56px)]" />
    </div>
  )
}
