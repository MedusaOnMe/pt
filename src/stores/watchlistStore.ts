import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PokemonCard, WatchlistItem } from '@/types/pokemon';

interface WatchlistState {
  items: WatchlistItem[];
  addCard: (card: PokemonCard) => void;
  removeCard: (cardId: string) => void;
  isInWatchlist: (cardId: string) => boolean;
  setPriceAlert: (cardId: string, price: number | undefined) => void;
  setNotes: (cardId: string, notes: string) => void;
  clearWatchlist: () => void;
  reorderItems: (fromIndex: number, toIndex: number) => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addCard: (card: PokemonCard) => {
        const { items } = get();
        if (items.some(item => item.cardId === card.id)) {
          return; // Already in watchlist
        }
        set({
          items: [
            ...items,
            {
              cardId: card.id,
              card,
              addedAt: new Date(),
            },
          ],
        });
      },

      removeCard: (cardId: string) => {
        set({
          items: get().items.filter(item => item.cardId !== cardId),
        });
      },

      isInWatchlist: (cardId: string) => {
        return get().items.some(item => item.cardId === cardId);
      },

      setPriceAlert: (cardId: string, price: number | undefined) => {
        set({
          items: get().items.map(item =>
            item.cardId === cardId ? { ...item, priceAlert: price } : item
          ),
        });
      },

      setNotes: (cardId: string, notes: string) => {
        set({
          items: get().items.map(item =>
            item.cardId === cardId ? { ...item, notes } : item
          ),
        });
      },

      clearWatchlist: () => {
        set({ items: [] });
      },

      reorderItems: (fromIndex: number, toIndex: number) => {
        const items = [...get().items];
        const [removed] = items.splice(fromIndex, 1);
        items.splice(toIndex, 0, removed);
        set({ items });
      },
    }),
    {
      name: 'poke-terminal-watchlist',
    }
  )
);
