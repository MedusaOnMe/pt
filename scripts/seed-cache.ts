import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const API_BASE_URL = 'https://api.pokemontcg.io/v2';
const API_KEY = process.env.POKEMON_TCG_API_KEY;

const CACHE_TTL = {
  TYPES: 60 * 60 * 24 * 7,
  SETS: 60 * 60 * 24,
  CARDS: 60 * 60,
};

async function fetchWithRetry(url: string, retries = 10): Promise<Response> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (API_KEY) {
    headers['X-Api-Key'] = API_KEY;
  }

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`  Fetching: ${url} (attempt ${i + 1}/${retries})`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000); // 2 min timeout

      const response = await fetch(url, {
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        return response;
      }

      // Wait longer between retries (exponential backoff with jitter)
      const delay = Math.min(30000, 3000 * Math.pow(1.5, i)) + Math.random() * 2000;
      console.log(`  Got status ${response.status}, waiting ${Math.round(delay/1000)}s...`);
      await sleep(delay);
    } catch (error) {
      const delay = Math.min(30000, 3000 * Math.pow(1.5, i)) + Math.random() * 2000;
      console.log(`  Error: ${error}, waiting ${Math.round(delay/1000)}s...`);
      await sleep(delay);
    }
  }

  throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createCacheKey(prefix: string, params?: Record<string, string | number>): string {
  if (!params) return prefix;
  const sortedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return `${prefix}:${sortedParams}`;
}

async function seedSets() {
  console.log('\n📦 Seeding sets...');

  // Fetch all sets
  const response = await fetchWithRetry(`${API_BASE_URL}/sets?orderBy=-releaseDate`);
  const data = await response.json();

  // Cache the full sets response
  const cacheKey = createCacheKey('sets', { orderBy: '-releaseDate' });
  await redis.set(cacheKey, data, { ex: CACHE_TTL.SETS });
  console.log(`  ✓ Cached ${data.data.length} sets`);

  // Also cache common queries
  const commonQueries = [
    { pageSize: '5', orderBy: '-releaseDate' },
    { pageSize: '10', orderBy: '-releaseDate' },
    { pageSize: '50', orderBy: '-releaseDate' },
    { pageSize: '100', orderBy: '-releaseDate' },
  ];

  for (const params of commonQueries) {
    const key = createCacheKey('sets', params);
    const slicedData = {
      ...data,
      data: data.data.slice(0, parseInt(params.pageSize)),
    };
    await redis.set(key, slicedData, { ex: CACHE_TTL.SETS });
  }

  console.log(`  ✓ Cached common set queries`);
  return data.data;
}

async function seedTypes() {
  console.log('\n🎨 Seeding types...');

  const response = await fetchWithRetry(`${API_BASE_URL}/types`);
  const data = await response.json();

  await redis.set('types', data, { ex: CACHE_TTL.TYPES });
  console.log(`  ✓ Cached ${data.data.length} types`);
}

async function seedCardsForSet(setId: string, setName: string) {
  console.log(`\n🃏 Seeding cards for ${setName}...`);

  const params = new URLSearchParams({
    q: `set.id:${setId}`,
    pageSize: '250',
    orderBy: 'number',
  });

  const response = await fetchWithRetry(`${API_BASE_URL}/cards?${params.toString()}`);
  const data = await response.json();

  const cacheKey = createCacheKey('cards', {
    q: `set.id:${setId}`,
    pageSize: '250',
    orderBy: 'number',
  });

  await redis.set(cacheKey, data, { ex: CACHE_TTL.CARDS });
  console.log(`  ✓ Cached ${data.data.length} cards from ${setName}`);

  return data.data.length;
}

async function seedPopularCards() {
  console.log('\n⭐ Seeding popular/rare cards...');

  const queries = [
    // Dashboard popular cards query
    {
      pageSize: '20',
      orderBy: '-set.releaseDate',
      q: '(rarity:"Rare Holo" OR rarity:"Rare Holo V" OR rarity:"Rare Holo VMAX" OR rarity:"Rare Secret" OR rarity:"Illustration Rare" OR rarity:"Special Art Rare")',
    },
    // Recent cards with prices
    {
      page: '1',
      pageSize: '50',
      orderBy: '-set.releaseDate',
      q: 'set.releaseDate:[2020-01-01 TO *]',
    },
    // Default card explorer view
    {
      page: '1',
      pageSize: '24',
      orderBy: '-set.releaseDate',
    },
  ];

  for (const params of queries) {
    const searchParams = new URLSearchParams(params as Record<string, string>);
    const response = await fetchWithRetry(`${API_BASE_URL}/cards?${searchParams.toString()}`);
    const data = await response.json();

    const cacheKey = createCacheKey('cards', params as Record<string, string>);
    await redis.set(cacheKey, data, { ex: CACHE_TTL.CARDS });
    console.log(`  ✓ Cached ${data.data.length} cards for query`);

    await sleep(2000); // Rate limit friendly
  }
}

async function main() {
  console.log('🚀 Starting cache seed...\n');
  console.log('This may take a while due to API rate limits.\n');

  try {
    // 1. Seed types (fast, rarely changes)
    await seedTypes();
    await sleep(2000);

    // 2. Seed all sets
    const sets = await seedSets();
    await sleep(2000);

    // 3. Seed popular cards
    await seedPopularCards();
    await sleep(2000);

    // 4. Seed cards from the 5 most recent sets
    const recentSets = sets.slice(0, 5);
    let totalCards = 0;

    for (const set of recentSets) {
      const count = await seedCardsForSet(set.id, set.name);
      totalCards += count;
      await sleep(3000); // Be nice to the API
    }

    console.log('\n✅ Cache seeding complete!');
    console.log(`   - Sets: ${sets.length}`);
    console.log(`   - Cards from recent sets: ${totalCards}`);
    console.log('\nYour app should now load much faster.');
  } catch (error) {
    console.error('\n❌ Error seeding cache:', error);
    process.exit(1);
  }
}

main();
