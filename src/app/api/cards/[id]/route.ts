import { NextRequest, NextResponse } from 'next/server';
import { getOrSetCache, CACHE_TTL } from '@/lib/cache';
import { transformCard } from '@/lib/ppt-adapter';
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cacheKey = `ppt:card:${id}`;

  try {
    const data = await getOrSetCache(cacheKey, CACHE_TTL.CARD_DETAIL, async () => {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (API_KEY) {
        headers['Authorization'] = `Bearer ${API_KEY}`;
      }

      // PPT uses tcgPlayerId for lookups
      // Include price history for charts
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/cards?tcgPlayerId=${id}&includeHistory=true&days=365`,
        { headers },
        FETCH_TIMEOUT
      );

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const pptResponse = await response.json();

      // PPT returns data as object for single card lookup, array for searches
      const card = Array.isArray(pptResponse.data)
        ? pptResponse.data[0]
        : pptResponse.data;

      if (!card) {
        throw new Error('Card not found');
      }

      // Transform to our unified format
      return { data: transformCard(card) };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching card:', error);
    return NextResponse.json(
      { error: 'Failed to fetch card' },
      { status: 500 }
    );
  }
}
