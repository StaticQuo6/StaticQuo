import { queryProtocols, seedProtocols } from './ProtocolStore'
import { useSearchStore } from './useSearchStore'

export class FTSIndexer {
  private initialized = false

  async init(): Promise<void> {
    if (this.initialized) return

    try {
      await seedProtocols()
      this.initialized = true
      useSearchStore.getState().setIndexReady(true)
    } catch (e) {
      console.error('FTSIndexer init failed:', e)
    }
  }

  async search(query: string): Promise<void> {
    if (!query.trim()) {
      useSearchStore.getState().setResults([])
      return
    }

    useSearchStore.getState().setQuery(query)

    try {
      const results = (await queryProtocols(query)) as {
        heading: string
        body: string
        category: string
      }[]
      useSearchStore.getState().setResults(results)
    } catch (e) {
      console.error('FTS search failed:', e)
    }
  }

  isReady(): boolean {
    return this.initialized
  }
}

export const ftsIndexer = new FTSIndexer()
