import { create } from 'zustand'

interface SearchStore {
  query: string
  results: { heading: string; body: string; category: string }[]
  indexReady: boolean
  setQuery: (q: string) => void
  setResults: (r: { heading: string; body: string; category: string }[]) => void
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
