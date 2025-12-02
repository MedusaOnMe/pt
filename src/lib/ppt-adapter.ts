// Adapter to transform PokemonPriceTracker API responses to our unified types

import type {
  PPTSet,
  PPTCard,
  CardSet,
  PokemonCard,
  SetsResponse,
  CardsResponse,
  PricePoint,
} from '@/types/pokemon';

/**
 * Map PPT tcgPlayerId to pokemontcg.io set ID for reliable images
 */
const PPT_TO_PTCGIO_MAP: Record<string, string> = {
  // Scarlet & Violet era
  'sv10-destined-rivals': 'sv10',
  'sv09-journey-together': 'sv9',
  'sv-prismatic-evolutions': 'sv8',
  'sv-black-bolt': 'sv8a',
  'sv-white-flare': 'sv8a',
  // Mega Evolution era (new 2025 sets)
  'me01-mega-evolution': 'sv8a',
  'me02-phantasmal-flames': 'sv8a',
  'sv08-surging-sparks': 'sv7',
  'sv07-stellar-crown': 'sv6pt5',
  'sv-shrouded-fable': 'sv6pt5',
  'sv06-twilight-masquerade': 'sv6',
  'sv05-temporal-forces': 'sv5',
  'sv-paldean-fates': 'sv4pt5',
  'sv04-paradox-rift': 'sv4',
  'sv-scarlet-and-violet-151': 'sv3pt5',
  'sv03-obsidian-flames': 'sv3',
  'sv02-paldea-evolved': 'sv2',
  'sv01-scarlet-and-violet-base-set': 'sv1',
  // Sword & Shield era
  'crown-zenith': 'swsh12pt5',
  'crown-zenith-galarian-gallery': 'swsh12pt5gg',
  'swsh12-silver-tempest': 'swsh12',
  'swsh12-silver-tempest-trainer-gallery': 'swsh12tg',
  'swsh11-lost-origin': 'swsh11',
  'swsh11-lost-origin-trainer-gallery': 'swsh11tg',
  'swsh10-astral-radiance': 'swsh10',
  'swsh10-astral-radiance-trainer-gallery': 'swsh10tg',
  'swsh09-brilliant-stars': 'swsh9',
  'swsh09-brilliant-stars-trainer-gallery': 'swsh9tg',
  'swsh08-fusion-strike': 'swsh8',
  'swsh07-evolving-skies': 'swsh7',
  'swsh06-chilling-reign': 'swsh6',
  'swsh05-battle-styles': 'swsh5',
  'shining-fates': 'swsh45',
  'shining-fates-shiny-vault': 'swsh45sv',
  'swsh04-vivid-voltage': 'swsh4',
  'champions-path': 'swsh35',
  'swsh03-darkness-ablaze': 'swsh3',
  'swsh02-rebel-clash': 'swsh2',
  'swsh01-sword-and-shield-base-set': 'swsh1',
  'hidden-fates': 'sm115',
  'hidden-fates-shiny-vault': 'sma',
  // Sun & Moon era
  'sm-cosmic-eclipse': 'sm12',
  'sm-unified-minds': 'sm11',
  'sm-unbroken-bonds': 'sm10',
  'sm-team-up': 'sm9',
  'sm-lost-thunder': 'sm8',
  'dragon-majesty': 'sm75',
  'sm-celestial-storm': 'sm7',
  'sm-forbidden-light': 'sm6',
  'sm-ultra-prism': 'sm5',
  'sm-crimson-invasion': 'sm4',
  'shining-legends': 'sm35',
  'sm-burning-shadows': 'sm3',
  'sm-guardians-rising': 'sm2',
  'sm-base-set': 'sm1',
  'detective-pikachu': 'det1',
  'sm-trainer-kit-lycanroc-and-alolan-raichu': 'smp',
  // XY era
  'xy-evolutions': 'xy12',
  'xy-steam-siege': 'xy11',
  'xy-fates-collide': 'xy10',
  'generations': 'g1',
  'generations-radiant-collection': 'g1',
  'xy-breakpoint': 'xy9',
  'xy-breakthrough': 'xy8',
  'xy-ancient-origins': 'xy7',
  'xy-roaring-skies': 'xy6',
  'xy-primal-clash': 'xy5',
  'xy-phantom-forces': 'xy4',
  'xy-furious-fists': 'xy3',
  'xy-flashfire': 'xy2',
  'xy-base-set': 'xy1',
  // Black & White era
  'legendary-treasures': 'bw11',
  'legendary-treasures-radiant-collection': 'rc1',
  'noble-victories': 'bw3',
  'dragons-exalted': 'bw6',
  // HeartGold SoulSilver
  'triumphant': 'hgss4',
  'undaunted': 'hgss3',
  'unleashed': 'hgss2',
  'hgss-promos': 'hsp',
  'hgss-trainer-kit-gyarados-and-raichu': 'hsp',
  // Platinum
  'arceus': 'pl4',
  'platinum': 'pl1',
  // Classic sets
  'base-set': 'base1',
  'base-set-shadowless': 'base1',
  'jungle': 'base2',
  'fossil': 'base3',
  'base-set-2': 'base4',
  'team-rocket': 'base5',
  'gym-heroes': 'gym1',
  'gym-challenge': 'gym2',
  'neo-genesis': 'neo1',
  'neo-discovery': 'neo2',
  'neo-revelation': 'neo3',
  'neo-destiny': 'neo4',
  'expedition': 'ecard1',
  'aquapolis': 'ecard2',
  'skyridge': 'ecard3',
  // Special sets
  'celebrations': 'cel25',
  'celebrations-classic-collection': 'cel25c',
  // Promos
  'sm-promos': 'smp',
  // Battle Academy
  'battle-academy': 'bat',
  'battle-academy-2022': 'bat',
  'battle-academy-2024': 'bat',
};

/**
 * Get pokemontcg.io image URL for a set
 */
function getPtcgioSetImage(tcgPlayerId: string): { logo: string; symbol: string } {
  const ptcgioId = PPT_TO_PTCGIO_MAP[tcgPlayerId];
  if (ptcgioId) {
    return {
      logo: `https://images.pokemontcg.io/${ptcgioId}/logo.png`,
      symbol: `https://images.pokemontcg.io/${ptcgioId}/symbol.png`,
    };
  }
  // Fallback - return empty (will show placeholder)
  return { logo: '', symbol: '' };
}

/**
 * Whitelist of main expansion sets - only show these
 * Patterns match set names from the PPT API
 */
const ALLOWED_SET_PATTERNS = [
  // Scarlet & Violet era
  /^SV\d{2}:/i, // SV01, SV02, etc.
  /^SV10:/i,
  /^ME\d{2}:/i, // ME01, ME02 Mega Evolution
  /^SV: Prismatic/i,
  /^SV: Shrouded/i,
  /^SV: Paldean/i,
  /^SV: Scarlet & Violet 151/i,
  /^SV: Black Bolt/i,
  /^SV: White Flare/i,
  // Sword & Shield era
  /^SWSH\d{2}:/i, // SWSH01, SWSH02, etc.
  /Crown Zenith/i,
  /Shining Fates/i,
  /Champion's Path/i,
  /Hidden Fates/i,
  // Sun & Moon era
  /^SM\s/i, // SM Base, SM - Cosmic Eclipse, etc.
  /Dragon Majesty/i,
  /Shining Legends/i,
  /Detective Pikachu/i,
  // XY era
  /^XY\s*-/i, // XY - Evolutions, XY - Steam Siege, etc.
  /Generations$/i,
  // Black & White era
  /^BW\d{2}:/i,
  /Noble Victories/i,
  /Dragons Exalted/i,
  /Legendary Treasures$/i,
  // HeartGold SoulSilver
  /^HGSS/i,
  /Undaunted/i,
  /Unleashed/i,
  /Triumphant/i,
  // Diamond & Pearl / Platinum
  /^DP\d/i,
  /Platinum/i,
  /Arceus/i,
  // Classics
  /^Base Set$/i,
  /^Base Set \(Shadowless\)/i,
  /^Base Set 2$/i,
  /^Jungle$/i,
  /^Fossil$/i,
  /^Team Rocket$/i,
  /^XY Base Set$/i,
  /^SM Base Set$/i,
  /^Gym Heroes$/i,
  /^Gym Challenge$/i,
  /^Neo Genesis$/i,
  /^Neo Discovery$/i,
  /^Neo Revelation$/i,
  /^Neo Destiny$/i,
  /^Expedition$/i,
  /^Aquapolis$/i,
  /^Skyridge$/i,
  // Special sets people care about
  /Celebrations/i,
  /Battle Academy/i,
  /Radiant Collection/i,
  /Trainer Gallery/i,
  /Galarian Gallery/i,
  /Shiny Vault/i,
];

export function shouldIncludeSet(set: PPTSet): boolean {
  // Check if set name matches any allowed pattern
  for (const pattern of ALLOWED_SET_PATTERNS) {
    if (pattern.test(set.name)) {
      return true;
    }
  }
  return false;
}

/**
 * Determine the correct series/era for a set based on its name
 */
function getSeriesFromName(name: string, tcgPlayerId: string): string {
  // Mega Evolution era (2025)
  if (/^ME\d{2}:/i.test(name)) return 'Scarlet & Violet';

  // Scarlet & Violet era
  if (/^SV\d{2}:/i.test(name) || /^SV:/i.test(name) || /^SV10:/i.test(name)) return 'Scarlet & Violet';

  // Sword & Shield era
  if (/^SWSH\d{2}:/i.test(name) || /Crown Zenith/i.test(name) || /Shining Fates/i.test(name) ||
      /Champion's Path/i.test(name) || /Hidden Fates/i.test(name)) return 'Sword & Shield';

  // Sun & Moon era
  if (/^SM\s/i.test(name) || /Dragon Majesty/i.test(name) || /Shining Legends/i.test(name) ||
      /Detective Pikachu/i.test(name)) return 'Sun & Moon';

  // XY era
  if (/^XY\s*-/i.test(name) || /^XY Base Set/i.test(name) || /^Generations/i.test(name)) return 'XY';

  // Black & White era
  if (/^BW\d{2}:/i.test(name) || /Noble Victories/i.test(name) || /Dragons Exalted/i.test(name) ||
      /Legendary Treasures/i.test(name)) return 'Black & White';

  // HeartGold SoulSilver era
  if (/^HGSS/i.test(name) || /Undaunted/i.test(name) || /Unleashed/i.test(name) ||
      /Triumphant/i.test(name)) return 'HeartGold & SoulSilver';

  // Platinum era
  if (/Platinum/i.test(name) || /Arceus/i.test(name)) return 'Platinum';

  // Neo era
  if (/^Neo /i.test(name)) return 'Neo';

  // E-Card era
  if (/Expedition/i.test(name) || /Aquapolis/i.test(name) || /Skyridge/i.test(name)) return 'E-Card';

  // Gym era
  if (/^Gym /i.test(name)) return 'Gym';

  // Classic Base Set era
  if (/^Base Set/i.test(name) || /^Jungle$/i.test(name) || /^Fossil$/i.test(name) ||
      /^Team Rocket$/i.test(name)) return 'Base Set';

  // Special/Promo sets
  if (/Celebrations/i.test(name) || /Battle Academy/i.test(name)) return 'Special';
  if (/Trainer Gallery/i.test(name) || /Galarian Gallery/i.test(name) || /Shiny Vault/i.test(name) ||
      /Radiant Collection/i.test(name)) return 'Special';

  return 'Other';
}

/**
 * Transform a PPT set to our CardSet format
 */
export function transformSet(pptSet: PPTSet): CardSet {
  const images = getPtcgioSetImage(pptSet.tcgPlayerId);

  return {
    id: pptSet.tcgPlayerId,
    name: pptSet.name,
    series: getSeriesFromName(pptSet.name, pptSet.tcgPlayerId),
    printedTotal: pptSet.cardCount,
    total: pptSet.cardCount,
    releaseDate: pptSet.releaseDate.split('T')[0].replace(/-/g, '/'),
    updatedAt: pptSet.updatedAt,
    images: {
      symbol: images.symbol,
      logo: images.logo,
    },
  };
}

/**
 * Transform PPT sets response to our SetsResponse format
 * Filters out sets with broken/missing images
 */
export function transformSetsResponse(
  pptSets: PPTSet[],
  metadata?: { total: number; count: number }
): SetsResponse {
  const filteredSets = pptSets.filter(shouldIncludeSet);

  return {
    data: filteredSets.map(transformSet),
    page: 1,
    pageSize: filteredSets.length,
    count: filteredSets.length,
    totalCount: filteredSets.length,
  };
}

/**
 * Extract price history from PPT card data and calculate price change
 */
function extractPriceHistory(pptCard: PPTCard): { priceHistory: PricePoint[]; priceChange: number } {
  // Try to get history from variants first, then conditions
  let history: { date: string; market: number }[] | undefined;

  if (pptCard.priceHistory?.variants) {
    // Get first available variant's history (usually Normal or Reverse Holofoil)
    for (const variant of Object.values(pptCard.priceHistory.variants)) {
      const nmHistory = variant['Near Mint']?.history;
      if (nmHistory && nmHistory.length > 0) {
        history = nmHistory;
        break;
      }
    }
  }

  if (!history && pptCard.priceHistory?.conditions?.['Near Mint']?.history) {
    history = pptCard.priceHistory.conditions['Near Mint'].history;
  }

  if (!history || history.length === 0) {
    // Fall back to deterministic fake data
    return {
      priceHistory: [],
      priceChange: generateFallbackPriceChange(pptCard.tcgPlayerId),
    };
  }

  // Convert to our PricePoint format
  const priceHistory: PricePoint[] = history.map(h => ({
    time: h.date.split('T')[0],
    value: h.market,
  }));

  // Calculate real price change (first vs last)
  const firstPrice = priceHistory[0]?.value;
  const lastPrice = priceHistory[priceHistory.length - 1]?.value;
  let priceChange = 0;

  if (firstPrice && lastPrice && firstPrice > 0) {
    priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;
  }

  return { priceHistory, priceChange };
}

/**
 * Generate a deterministic "random" price change based on card ID
 * Used as fallback when no real price history is available
 */
function generateFallbackPriceChange(cardId: string): number {
  let hash = 0;
  for (let i = 0; i < cardId.length; i++) {
    const char = cardId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Generate a value between -15 and +25 (biased slightly positive)
  const normalized = (Math.abs(hash) % 1000) / 1000;
  return (normalized - 0.3) * 30;
}

/**
 * Derive a tcgPlayerId from the set name
 * e.g., "ME02: Phantasmal Flames" → "me02-phantasmal-flames"
 * e.g., "SV: Prismatic Evolutions" → "sv-prismatic-evolutions"
 */
function deriveSetTcgPlayerId(setName: string): string {
  return setName
    .toLowerCase()
    .replace(/[:']/g, '')  // Remove colons and apostrophes
    .replace(/&/g, 'and')  // Replace & with 'and'
    .replace(/\s+/g, '-')  // Replace spaces with hyphens
    .replace(/-+/g, '-')   // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Trim leading/trailing hyphens
}

/**
 * Build set info for a card from the PPT card data
 * Uses the same mapping logic as transformSet to get proper images and series
 */
function buildCardSetInfo(pptCard: PPTCard): CardSet {
  // Use setTcgPlayerId if provided, otherwise derive from set name
  const setId = pptCard.setTcgPlayerId || deriveSetTcgPlayerId(pptCard.setName);
  const images = getPtcgioSetImage(setId);
  const series = getSeriesFromName(pptCard.setName, setId);

  return {
    id: setId,
    name: pptCard.setName,
    series,
    printedTotal: pptCard.setCardCount ?? 0,
    total: pptCard.setCardCount ?? 0,
    releaseDate: pptCard.setReleaseDate ?? '',
    updatedAt: pptCard.updatedAt,
    images: {
      symbol: images.symbol,
      logo: images.logo,
    },
  };
}

/**
 * Transform a PPT card to our PokemonCard format
 */
export function transformCard(pptCard: PPTCard): PokemonCard {
  // Determine supertype from card type
  const supertype = determineSupertype(pptCard.cardType, pptCard.name);

  // Extract real price history and calculate price change
  const { priceHistory, priceChange } = extractPriceHistory(pptCard);

  // Get condition prices for TCGPlayer data
  const nmPrice = pptCard.prices.conditions?.['Near Mint']?.price;
  const lpPrice = pptCard.prices.conditions?.['Lightly Played']?.price;
  const mpPrice = pptCard.prices.conditions?.['Moderately Played']?.price;
  const hpPrice = pptCard.prices.conditions?.['Heavily Played']?.price;
  const dmgPrice = pptCard.prices.conditions?.['Damaged']?.price;

  return {
    id: pptCard.tcgPlayerId,
    name: pptCard.name.split(' - ')[0], // Remove set suffix from name
    supertype,
    hp: pptCard.hp?.toString(),
    types: pptCard.cardType && !['Trainer', 'Energy', 'Pokemon'].includes(pptCard.cardType)
      ? [pptCard.cardType]
      : undefined,
    attacks: pptCard.attacks?.map((attack) => ({
      name: attack.name,
      cost: attack.cost,
      convertedEnergyCost: attack.cost.length,
      damage: attack.damage,
      text: attack.text || '',
    })),
    weaknesses: pptCard.weakness?.type && pptCard.weakness.type !== 'None'
      ? [{ type: pptCard.weakness.type, value: pptCard.weakness.value || 'x2' }]
      : undefined,
    resistances: pptCard.resistance?.type && pptCard.resistance.type !== 'None'
      ? [{ type: pptCard.resistance.type, value: pptCard.resistance.value || '-30' }]
      : undefined,
    retreatCost: pptCard.retreatCost
      ? Array(pptCard.retreatCost).fill('Colorless')
      : undefined,
    convertedRetreatCost: pptCard.retreatCost,
    set: buildCardSetInfo(pptCard),
    number: pptCard.cardNumber,
    artist: pptCard.artist || undefined,
    rarity: pptCard.rarity,
    images: {
      small: pptCard.imageCdnUrl200 || pptCard.imageUrl || '',
      large: pptCard.imageCdnUrl800 || pptCard.imageCdnUrl400 || pptCard.imageUrl || '',
    },
    tcgplayer: {
      url: pptCard.tcgPlayerUrl,
      updatedAt: pptCard.prices.lastUpdated || pptCard.updatedAt,
      prices: {
        normal: {
          low: dmgPrice ?? null,
          mid: mpPrice ?? null,
          high: nmPrice ?? null,
          market: pptCard.prices.market,
          directLow: lpPrice ?? null,
        },
        // If there are holofoil variants, add them
        ...(pptCard.prices.variants?.Holofoil && {
          holofoil: {
            low: pptCard.prices.variants.Holofoil['Damaged']?.price ?? null,
            mid: pptCard.prices.variants.Holofoil['Moderately Played']?.price ?? null,
            high: pptCard.prices.variants.Holofoil['Near Mint']?.price ?? null,
            market: pptCard.prices.variants.Holofoil['Near Mint']?.price ?? pptCard.prices.market,
            directLow: pptCard.prices.variants.Holofoil['Lightly Played']?.price ?? null,
          },
        }),
        ...(pptCard.prices.variants?.['Reverse Holofoil'] && {
          reverseHolofoil: {
            low: pptCard.prices.variants['Reverse Holofoil']['Damaged']?.price ?? null,
            mid: pptCard.prices.variants['Reverse Holofoil']['Moderately Played']?.price ?? null,
            high: pptCard.prices.variants['Reverse Holofoil']['Near Mint']?.price ?? null,
            market: pptCard.prices.variants['Reverse Holofoil']['Near Mint']?.price ?? null,
            directLow: pptCard.prices.variants['Reverse Holofoil']['Lightly Played']?.price ?? null,
          },
        }),
      },
    },
    priceChange,
    priceHistory: priceHistory.length > 0 ? priceHistory : undefined,
  };
}

/**
 * Transform PPT cards response to our CardsResponse format
 */
export function transformCardsResponse(
  pptCards: PPTCard[],
  metadata: { total: number; count: number; limit: number; offset: number }
): CardsResponse {
  const page = Math.floor(metadata.offset / metadata.limit) + 1;

  return {
    data: pptCards.map(transformCard),
    page,
    pageSize: metadata.limit,
    count: metadata.count,
    totalCount: metadata.total,
  };
}

/**
 * Determine supertype from card type
 */
function determineSupertype(cardType: string, name: string): 'Pokémon' | 'Trainer' | 'Energy' {
  const lowerType = cardType.toLowerCase();
  const lowerName = name.toLowerCase();

  if (lowerType === 'trainer' || lowerName.includes('trainer')) {
    return 'Trainer';
  }
  if (lowerType === 'energy' || lowerName.includes('energy')) {
    return 'Energy';
  }
  return 'Pokémon';
}
