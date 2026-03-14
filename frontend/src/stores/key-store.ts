import { create } from 'zustand'

interface KeyStore {
  key: number
  incrementKey: () => void
}

export const useKeyStore = create<KeyStore>((set) => ({
  key: 0,
  incrementKey: () => set((state) => ({ key: state.key + 1 })),
}))
