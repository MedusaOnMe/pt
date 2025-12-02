import axios from 'axios';
import type {
  PokemonCard,
  CardSet,
  CardsResponse,
  SetsResponse,
  CardResponse,
  SetResponse,
  CardFilters,
} from '@/types/pokemon';

// Use local API routes to avoid CORS issues
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cards API - passes filters directly for PPT API
export async function getCards(
  filters: CardFilters = {},
  page: number = 1,
  pageSize: number = 20
): Promise<CardsResponse> {
  const params: Record<string, string | number> = {
    page,
    pageSize,
  };

  // Pass filters directly - PPT API route will handle them
  if (filters.name) {
    params.search = filters.name;
  }
  if (filters.set) {
    params.setId = filters.set;
  }
  if (filters.types && filters.types.length > 0) {
    params.cardType = filters.types[0]; // PPT only supports single type
  }
  if (filters.rarity && filters.rarity.length > 0) {
    params.rarity = filters.rarity[0]; // PPT only supports single rarity
  }
  if (filters.sortBy) {
    params.sortBy = filters.sortBy;
  }
  if (filters.sortOrder) {
    params.sortOrder = filters.sortOrder;
  }

  const response = await api.get<CardsResponse>('/cards', { params });
  return response.data;
}

export async function getCard(id: string): Promise<PokemonCard> {
  const response = await api.get<CardResponse>(`/cards/${id}`);
  return response.data.data;
}

export async function searchCards(
  query: string,
  page: number = 1,
  pageSize: number = 20
): Promise<CardsResponse> {
  const response = await api.get<CardsResponse>('/cards', {
    params: {
      search: query,
      page,
      pageSize,
    },
  });
  return response.data;
}

// Get cards with pricing data - PPT API version
export async function getCardsWithPrices(
  page: number = 1,
  pageSize: number = 50
): Promise<CardsResponse> {
  const response = await api.get<CardsResponse>('/cards', {
    params: {
      page,
      pageSize,
      // Get high-value cards across all sets
      minPrice: '100',
      sortBy: 'price',
      sortOrder: 'desc',
    },
  });
  return response.data;
}

// Get popular/valuable cards - PPT API version
export async function getPopularCards(pageSize: number = 20): Promise<PokemonCard[]> {
  const response = await api.get<CardsResponse>('/cards', {
    params: {
      pageSize: pageSize + 5, // Fetch extra to account for filtered cards
      // Get high-value cards sorted by price
      minPrice: 20,
      sortBy: 'price',
      sortOrder: 'desc',
    },
  });
  // Filter out cards with broken images or data issues
  const filtered = response.data.data.filter(
    (card) => !card.name.toLowerCase().includes('latias')
  );
  return filtered.slice(0, pageSize);
}

// Get cards by set
export async function getCardsBySet(
  setId: string,
  page: number = 1,
  pageSize: number = 50
): Promise<CardsResponse> {
  const response = await api.get<CardsResponse>('/cards', {
    params: {
      set: setId, // PPT API uses 'set' param for set name/id search
      page,
      pageSize,
      sortBy: 'price',
      sortOrder: 'desc',
    },
  });
  return response.data;
}

// Sets API
export async function getSets(
  page: number = 1,
  pageSize: number = 50
): Promise<SetsResponse> {
  const response = await api.get<SetsResponse>('/sets', {
    params: {
      page,
      pageSize,
      orderBy: '-releaseDate',
    },
  });
  return response.data;
}

export async function getSet(id: string): Promise<CardSet> {
  const response = await api.get<SetResponse>(`/sets/${id}`);
  return response.data.data;
}

export async function getRecentSets(limit: number = 10): Promise<CardSet[]> {
  const response = await api.get<SetsResponse>('/sets', {
    params: {
      pageSize: limit,
      orderBy: '-releaseDate',
    },
  });
  return response.data.data;
}

// Get all unique types
export async function getTypes(): Promise<string[]> {
  const response = await api.get<{ data: string[] }>('/types');
  return response.data.data;
}

// Get all rarities (not an official endpoint, but we can infer from cards)
export const RARITIES = [
  'Common',
  'Uncommon',
  'Rare',
  'Rare Holo',
  'Rare Holo EX',
  'Rare Holo GX',
  'Rare Holo V',
  'Rare Holo VMAX',
  'Rare Holo VSTAR',
  'Rare Ultra',
  'Rare Secret',
  'Rare Shiny',
  'Rare Shining',
  'Rare Rainbow',
  'Rare Prime',
  'Illustration Rare',
  'Special Art Rare',
  'Ultra Rare',
  'Hyper Rare',
  'Double Rare',
  'ACE SPEC Rare',
  'Amazing Rare',
  'LEGEND',
  'Promo',
] as const;

export const SUPERTYPES = ['Pokémon', 'Trainer', 'Energy'] as const;

export const POKEMON_TYPES = [
  'Colorless',
  'Darkness',
  'Dragon',
  'Fairy',
  'Fighting',
  'Fire',
  'Grass',
  'Lightning',
  'Metal',
  'Psychic',
  'Water',
] as const;

// Helper functions
export function getCardPrice(card: PokemonCard): number | null {
  const prices = card.tcgplayer?.prices;
  if (!prices) return null;

  // Priority order for price
  const priceValue =
    prices.holofoil?.market ??
    prices.normal?.market ??
    prices.reverseHolofoil?.market ??
    prices['1stEditionHolofoil']?.market ??
    prices['1stEditionNormal']?.market ??
    null;

  return priceValue;
}

export function formatPrice(price: number | null): string {
  if (price === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

export function getCardMarketPrice(card: PokemonCard): number | null {
  const prices = card.cardmarket?.prices;
  if (!prices) return null;
  return prices.trendPrice ?? prices.averageSellPrice ?? null;
}

// Generate price history based on current price and change percentage
export function generatePriceHistory(
  currentPrice: number,
  days: number = 30,
  changePercent: number = 0
): { time: string; value: number }[] {
  const history: { time: string; value: number }[] = [];
  const now = new Date();

  // Calculate starting price based on the change percentage
  // If change is +10%, then starting price was currentPrice / 1.10
  const startPrice = currentPrice / (1 + changePercent / 100);

  // Generate smooth curve from start to current price
  for (let i = 0; i <= days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (days - i));

    // Use easing function for more natural curve
    const progress = i / days;
    const eased = progress * progress * (3 - 2 * progress); // smoothstep
    const price = startPrice + (currentPrice - startPrice) * eased;

    history.push({
      time: date.toISOString().split('T')[0],
      value: Number(price.toFixed(2)),
    });
  }

  return history;
}
