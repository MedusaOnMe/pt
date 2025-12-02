'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import {
  getCards,
  getCard,
  searchCards,
  getCardsWithPrices,
  getPopularCards,
  getCardsBySet,
} from '@/lib/api';
import type { CardFilters } from '@/types/pokemon';

export function useCards(filters: CardFilters = {}, pageSize: number = 20) {
  return useInfiniteQuery({
    queryKey: ['cards', filters, pageSize],
    queryFn: ({ pageParam = 1 }) => getCards(filters, pageParam, pageSize),
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.totalCount / lastPage.pageSize);
      if (lastPage.page < totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCard(id: string) {
  return useQuery({
    queryKey: ['card', id],
    queryFn: () => getCard(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSearchCards(query: string, pageSize: number = 20) {
  return useQuery({
    queryKey: ['search', query, pageSize],
    queryFn: () => searchCards(query, 1, pageSize),
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCardsWithPrices(pageSize: number = 50) {
  return useQuery({
    queryKey: ['cardsWithPrices', pageSize],
    queryFn: () => getCardsWithPrices(1, pageSize),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePopularCards(pageSize: number = 20) {
  return useQuery({
    queryKey: ['popularCards', pageSize],
    queryFn: () => getPopularCards(pageSize),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCardsBySet(setId: string, pageSize: number = 50) {
  return useInfiniteQuery({
    queryKey: ['cardsBySet', setId, pageSize],
    queryFn: ({ pageParam = 1 }) => getCardsBySet(setId, pageParam, pageSize),
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.totalCount / lastPage.pageSize);
      if (lastPage.page < totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!setId,
    staleTime: 5 * 60 * 1000,
  });
}
