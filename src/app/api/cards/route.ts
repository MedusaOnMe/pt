import { NextRequest, NextResponse } from 'next/server';
import { getOrSetCache, createCacheKey, CACHE_TTL } from '@/lib/cache';
import { transformCardsResponse } from '@/lib/ppt-adapter';
import type { PPTCardsResponse } from '@/types/pokemon';

const API_BASE_URL = 'https://www.pokemonpricetracker.com/api/v2';
const API_KEY = process.env.POKEPRICE_API_KEY;
const FETCH_TIMEOUT = 30000;

async function fetchWithTimeout(url: string, options: RequestInit, timeout: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Build PPT API params from incoming request
  const pptParams = new URLSearchParams();

  // Map our params to PPT params
  const name = searchParams.get('q') || searchParams.get('name') || searchParams.get('search');
  const set = searchParams.get('set') || searchParams.get('setId');
  const rarity = searchParams.get('rarity');
  const type = searchParams.get('types') || searchParams.get('cardType');
  const minPrice = searchParams.get('minPrice');
  const sortBy = searchParams.get('sortBy');
  const sortOrder = searchParams.get('sortOrder');
  const page = searchParams.get('page') || '1';
  const pageSize = searchParams.get('pageSize') || '24';

  // PPT requires at least one filter - use set or search
  if (name) {
    pptParams.set('search', name);
  }
  if (set) {
    pptParams.set('set', set);
  }
  if (rarity) {
    pptParams.set('rarity', rarity);
  }
  if (type) {
    pptParams.set('cardType', type);
  }
  if (minPrice) {
    pptParams.set('minPrice', minPrice);
  }
  if (sortBy) {
    pptParams.set('sortBy', sortBy);
  }
  if (sortOrder) {
    pptParams.set('sortOrder', sortOrder);
  }

  // Pagination
  const limit = parseInt(pageSize);
  const offset = (parseInt(page) - 1) * limit;
  pptParams.set('limit', limit.toString());
  pptParams.set('offset', offset.toString());

  // Include price history for real price change data
  // Pro plan supports up to 365 days - max it out for illiquid cards
  pptParams.set('includeHistory', 'true');
  pptParams.set('days', '365');

  // PPT requires at least one filter (set, rarity, type, or minPrice)
  // Use minPrice=0 as a permissive filter to show all cards
  if (!set && !rarity && !type && !minPrice) {
    pptParams.set('minPrice', '0');
  }

  // Default sort by price if not specified
  if (!sortBy) {
    pptParams.set('sortBy', 'price');
    pptParams.set('sortOrder', 'desc');
  }

  const cacheKey = createCacheKey('ppt:cards', Object.fromEntries(pptParams));

  try {
    const data = await getOrSetCache(cacheKey, CACHE_TTL.CARDS, async () => {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (API_KEY) {
        headers['Authorization'] = `Bearer ${API_KEY}`;
      }

      const response = await fetchWithTimeout(
        `${API_BASE_URL}/cards?${pptParams.toString()}`,
        { headers },
        FETCH_TIMEOUT
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PPT API error:', errorText);
        throw new Error(`API responded with status ${response.status}`);
      }

      const pptResponse: PPTCardsResponse = await response.json();

      // Transform to our unified format
      return transformCardsResponse(pptResponse.data, pptResponse.metadata);
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    );
  }
}
