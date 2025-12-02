import { NextRequest, NextResponse } from 'next/server';
import { getOrSetCache, CACHE_TTL } from '@/lib/cache';
import { transformSet, shouldIncludeSet } from '@/lib/ppt-adapter';
import type { PPTSetsResponse } from '@/types/pokemon';

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
  const cacheKey = `ppt:set:${id}`;

  try {
    const data = await getOrSetCache(cacheKey, CACHE_TTL.SET_DETAIL, async () => {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (API_KEY) {
        headers['Authorization'] = `Bearer ${API_KEY}`;
      }

      // First get all sets and find the matching one
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/sets?limit=250`,
        { headers },
        FETCH_TIMEOUT
      );

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const pptResponse: PPTSetsResponse = await response.json();

      // Find the set by tcgPlayerId or PPT internal id
      const set = pptResponse.data.find(s => s.tcgPlayerId === id || s.id === id);

      if (!set || !shouldIncludeSet(set)) {
        throw new Error('Set not found');
      }

      return { data: transformSet(set) };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching set:', error);
    return NextResponse.json(
      { error: 'Failed to fetch set' },
      { status: 500 }
    );
  }
}
