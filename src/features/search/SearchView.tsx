import { useEffect, useState } from 'react'
import { useSearchStore } from './useSearchStore'
import { ftsIndexer } from './FTSIndexer'

export function SearchView() {
  const { query, results, indexReady, setQuery } = useSearchStore()
  const [input, setInput] = useState('')

  useEffect(() => {
    ftsIndexer.init()
  }, [])

  const handleSearch = async () => {
    setQuery(input)
    await ftsIndexer.search(input)
  }

  const categoryEmojis: Record<string, string> = {
    legal: '⚖️',
    medical: '🏥',
    safety: '🛡️',
    logistics: '📦',
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 px-4 py-3">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <span>📖</span> Protocols & Rights
        </h1>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search protocols, rights, emergencies..."
            className="flex-1 h-12 px-4 rounded-xl bg-gray-900 border border-gray-800 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600"
          />
          <button
            onClick={handleSearch}
            className="px-4 h-12 rounded-xl bg-blue-600 text-white text-sm font-medium active:bg-blue-500"
          >
            Search
          </button>
        </div>

        {!indexReady && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm animate-pulse">Indexing handbook...</p>
          </div>
        )}

        {indexReady && results.length === 0 && query && (
          <div className="text-center py-12">
            <p className="text-gray-500">No results found</p>
          </div>
        )}

        {results.length === 0 && !query && (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">📚</p>
            <p className="text-gray-500">Search emergency protocols</p>
            <p className="text-xs text-gray-600 mt-1">Type a keyword above to search the offline handbook</p>
          </div>
        )}

        <div className="space-y-3">
          {results.map((r, i) => (
            <div key={i} className="p-4 rounded-2xl bg-gray-900 border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <span>{categoryEmojis[r.category] || '📄'}</span>
                <span className="text-xs text-gray-500 uppercase font-medium">{r.category}</span>
              </div>
              <h3 className="text-sm font-medium text-white mb-1">{r.heading}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
