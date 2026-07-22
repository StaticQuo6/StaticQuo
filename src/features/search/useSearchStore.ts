import { create } from 'zustand'

interface SearchResult {
  heading: string
  body: string
  category: string
}

interface SearchStore {
  query: string
  results: SearchResult[]
  indexReady: boolean
  setQuery: (q: string) => void
  setResults: (r: SearchResult[]) => void
  setIndexReady: (ready: boolean) => void
}

export const useSearchStore = create<SearchStore>()((set) => ({
  query: '',
  results: [],
  indexReady: false,
  setQuery: (q) => set({ query: q }),
  setResults: (r) => set({ results: r }),
  setIndexReady: (ready) => set({ indexReady: ready }),
}))
