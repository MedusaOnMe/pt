import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PokemonCard, PortfolioItem, Transaction } from '@/types/pokemon';

interface PortfolioState {
  items: PortfolioItem[];
  addTransaction: (card: PokemonCard, type: 'buy' | 'sell', quantity: number, price: number, notes?: string) => void;
  removeItem: (cardId: string) => void;
  getItem: (cardId: string) => PortfolioItem | undefined;
  getTotalValue: (getPrice: (card: PokemonCard) => number | null) => number;
  getTotalCost: () => number;
  getTotalPnL: (getPrice: (card: PokemonCard) => number | null) => number;
  clearPortfolio: () => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      items: [],

      addTransaction: (card: PokemonCard, type: 'buy' | 'sell', quantity: number, price: number, notes?: string) => {
        const { items } = get();
        const existingItem = items.find(item => item.cardId === card.id);

        const transaction: Transaction = {
          id: generateId(),
          type,
          quantity,
          price,
          date: new Date(),
          notes,
        };

        if (existingItem) {
          // Update existing item
          const newQuantity = type === 'buy'
            ? existingItem.quantity + quantity
            : existingItem.quantity - quantity;

          if (newQuantity <= 0) {
            // Remove item if quantity is 0 or less
            set({
              items: items.filter(item => item.cardId !== card.id),
            });
          } else {
            // Calculate new average cost (only on buys)
            let newAvgCost = existingItem.avgCost;
            if (type === 'buy') {
              const totalCost = existingItem.avgCost * existingItem.quantity + price * quantity;
              newAvgCost = totalCost / newQuantity;
            }

            set({
              items: items.map(item =>
                item.cardId === card.id
                  ? {
                      ...item,
                      quantity: newQuantity,
                      avgCost: newAvgCost,
                      transactions: [...item.transactions, transaction],
                    }
                  : item
              ),
            });
          }
        } else if (type === 'buy') {
          // Create new item (only on buy)
          set({
            items: [
              ...items,
              {
                cardId: card.id,
                card,
                quantity,
                avgCost: price,
                transactions: [transaction],
              },
            ],
          });
        }
      },

      removeItem: (cardId: string) => {
        set({
          items: get().items.filter(item => item.cardId !== cardId),
        });
      },

      getItem: (cardId: string) => {
        return get().items.find(item => item.cardId === cardId);
      },

      getTotalValue: (getPrice: (card: PokemonCard) => number | null) => {
        return get().items.reduce((total, item) => {
          const price = getPrice(item.card);
          return total + (price ?? 0) * item.quantity;
        }, 0);
      },

      getTotalCost: () => {
        return get().items.reduce((total, item) => {
          return total + item.avgCost * item.quantity;
        }, 0);
      },

      getTotalPnL: (getPrice: (card: PokemonCard) => number | null) => {
        const totalValue = get().getTotalValue(getPrice);
        const totalCost = get().getTotalCost();
        return totalValue - totalCost;
      },

      clearPortfolio: () => {
        set({ items: [] });
      },
    }),
    {
      name: 'poke-terminal-portfolio',
    }
  )
);
