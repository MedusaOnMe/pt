import { NextRequest, NextResponse } from 'next/server';
import { getOrSetCache, createCacheKey, CACHE_TTL } from '@/lib/cache';
import { transformSetsResponse } from '@/lib/ppt-adapter';
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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '100');

  const cacheKey = createCacheKey('ppt:sets', { page: page.toString(), pageSize: pageSize.toString() });

  try {
    const data = await getOrSetCache(cacheKey, CACHE_TTL.SETS, async () => {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (API_KEY) {
        headers['Authorization'] = `Bearer ${API_KEY}`;
      }

      const response = await fetchWithTimeout(
        `${API_BASE_URL}/sets?limit=250`,
        { headers },
        FETCH_TIMEOUT
      );

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const pptResponse: PPTSetsResponse = await response.json();

      // Transform to our unified format (this filters the sets)
      const allSets = transformSetsResponse(pptResponse.data, pptResponse.metadata);

      // Apply pagination
      const startIndex = (page - 1) * pageSize;
      const paginatedData = allSets.data.slice(startIndex, startIndex + pageSize);

      return {
        data: paginatedData,
        page,
        pageSize,
        count: paginatedData.length,
        totalCount: allSets.totalCount,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching sets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sets' },
      { status: 500 }
    );
  }
}
