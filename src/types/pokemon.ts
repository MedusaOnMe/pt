// Pokemon TCG API Types (unified interface for frontend)

export interface PokemonCard {
  id: string;
  name: string;
  supertype: 'Pokémon' | 'Trainer' | 'Energy';
  subtypes?: string[];
  level?: string;
  hp?: string;
  types?: string[];
  evolvesFrom?: string;
  evolvesTo?: string[];
  rules?: string[];
  ancientTrait?: {
    name: string;
    text: string;
  };
  abilities?: Ability[];
  attacks?: Attack[];
  weaknesses?: TypeValue[];
  resistances?: TypeValue[];
  retreatCost?: string[];
  convertedRetreatCost?: number;
  set: CardSet;
  number: string;
  artist?: string;
  rarity?: string;
  flavorText?: string;
  nationalPokedexNumbers?: number[];
  legalities?: Legalities;
  regulationMark?: string;
  images: CardImages;
  tcgplayer?: TCGPlayerData;
  cardmarket?: CardmarketData;
  priceChange?: number; // Real % change from price history (or calculated if no history)
  priceHistory?: PricePoint[]; // Real price history data from API
}

export interface Ability {
  name: string;
  text: string;
  type: string;
}

export interface Attack {
  name: string;
  cost: string[];
  convertedEnergyCost: number;
  damage: string;
  text: string;
}

export interface TypeValue {
  type: string;
  value: string;
}

export interface CardSet {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  legalities?: Legalities;
  ptcgoCode?: string;
  releaseDate: string;
  updatedAt: string;
  images: SetImages;
}

export interface Legalities {
  unlimited?: string;
  standard?: string;
  expanded?: string;
}

export interface CardImages {
  small: string;
  large: string;
}

export interface SetImages {
  symbol: string;
  logo: string;
}

export interface TCGPlayerData {
  url: string;
  updatedAt: string;
  prices?: TCGPlayerPrices;
}

export interface TCGPlayerPrices {
  normal?: PriceData;
  holofoil?: PriceData;
  reverseHolofoil?: PriceData;
  '1stEditionHolofoil'?: PriceData;
  '1stEditionNormal'?: PriceData;
}

export interface PriceData {
  low: number | null;
  mid: number | null;
  high: number | null;
  market: number | null;
  directLow: number | null;
}

export interface CardmarketData {
  url: string;
  updatedAt: string;
  prices?: CardmarketPrices;
}

export interface CardmarketPrices {
  averageSellPrice: number | null;
  lowPrice: number | null;
  trendPrice: number | null;
  germanProLow: number | null;
  suggestedPrice: number | null;
  reverseHoloSell: number | null;
  reverseHoloLow: number | null;
  reverseHoloTrend: number | null;
  lowPriceExPlus: number | null;
  avg1: number | null;
  avg7: number | null;
  avg30: number | null;
  reverseHoloAvg1: number | null;
  reverseHoloAvg7: number | null;
  reverseHoloAvg30: number | null;
}

// API Response types
export interface CardResponse {
  data: PokemonCard;
}

export interface CardsResponse {
  data: PokemonCard[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
}

export interface SetResponse {
  data: CardSet;
}

export interface SetsResponse {
  data: CardSet[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
}

// UI Types
export interface WatchlistItem {
  cardId: string;
  card: PokemonCard;
  addedAt: Date;
  priceAlert?: number;
  notes?: string;
}

export interface PortfolioItem {
  cardId: string;
  card: PokemonCard;
  quantity: number;
  avgCost: number;
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  date: Date;
  notes?: string;
}

export interface PricePoint {
  time: string;
  value: number;
}

// Filter types
export interface CardFilters {
  name?: string;
  set?: string;
  types?: string[];
  rarity?: string[];
  supertype?: string;
  subtypes?: string[];
  hp?: { min?: number; max?: number };
  priceRange?: { min?: number; max?: number };
  legality?: 'standard' | 'expanded' | 'unlimited';
  sortBy?: 'name' | 'cardNumber' | 'price';
  sortOrder?: 'asc' | 'desc';
}

export interface SortOption {
  field: 'name' | 'price' | 'releaseDate' | 'hp' | 'number';
  direction: 'asc' | 'desc';
}

// Helper type for getting the best price from a card
export type PriceType = 'normal' | 'holofoil' | 'reverseHolofoil' | '1stEditionHolofoil' | '1stEditionNormal';

// Stats for dashboard
export interface MarketStats {
  totalCards: number;
  totalSets: number;
  topGainers: PokemonCard[];
  topLosers: PokemonCard[];
  recentSets: CardSet[];
}

// ==========================================
// PokemonPriceTracker API Types (raw)
// ==========================================

export interface PPTSet {
  id: string;
  tcgPlayerId: string;
  name: string;
  series: string;
  releaseDate: string;
  cardCount: number;
  priceGuideUrl?: string;
  hasPriceGuide?: boolean;
  imageUrl: string;
  imageCdnUrl?: string;
  imageCdnUrl200?: string;
  imageCdnUrl400?: string;
  imageCdnUrl800?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PPTCard {
  id: string;
  tcgPlayerId: string;
  setId: string;
  setTcgPlayerId?: string;
  setName: string;
  setCardCount?: number;
  setReleaseDate?: string;
  name: string;
  cardNumber: string;
  totalSetNumber?: string;
  rarity: string;
  cardType: string;
  hp?: number;
  stage?: string;
  attacks?: PPTAttack[];
  weakness?: { type: string; value: string | null };
  resistance?: { type: string; value: string | null };
  retreatCost?: number;
  artist?: string | null;
  tcgPlayerUrl: string;
  prices: PPTPrices;
  priceHistory?: PPTPriceHistory;
  imageUrl: string;
  imageCdnUrl?: string;
  imageCdnUrl200?: string;
  imageCdnUrl400?: string;
  imageCdnUrl800?: string;
  dataCompleteness?: number;
  lastScrapedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PPTAttack {
  cost: string[];
  name: string;
  damage: string;
  text?: string;
}

export interface PPTPrices {
  market: number | null;
  listings?: number | null;
  primaryCondition?: string;
  conditions?: Record<string, PPTConditionPrice>;
  variants?: Record<string, Record<string, PPTConditionPrice>>;
  lastUpdated?: string;
}

export interface PPTConditionPrice {
  price: number;
  listings: number;
  priceString?: string;
}

export interface PPTSetsResponse {
  data: PPTSet[];
  metadata?: {
    total: number;
    count: number;
  };
}

export interface PPTCardsResponse {
  data: PPTCard[];
  metadata: {
    total: number;
    count: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    includes?: {
      priceHistory: boolean;
      ebayData: boolean;
    };
  };
}

// PPT Price History types
export interface PPTPriceHistoryEntry {
  date: string;
  market: number;
  volume?: number;
}

export interface PPTConditionHistory {
  history: PPTPriceHistoryEntry[];
  dataPoints: number;
  latestPrice: number;
  latestDate: string;
  priceRange: {
    min: number;
    max: number;
  };
}

export interface PPTPriceHistory {
  conditions?: Record<string, PPTConditionHistory>;
  variants?: Record<string, Record<string, PPTConditionHistory>>;
  conditions_tracked?: string[];
  variants_tracked?: string[];
  totalDataPoints?: number;
  earliestDate?: string;
  latestDate?: string;
}
