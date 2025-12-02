'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { getSets, getSet, getRecentSets } from '@/lib/api';

export function useSets(pageSize: number = 50) {
  return useInfiniteQuery({
    queryKey: ['sets', pageSize],
    queryFn: ({ pageParam = 1 }) => getSets(pageParam, pageSize),
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.totalCount / lastPage.pageSize);
      if (lastPage.page < totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 10 * 60 * 1000, // 10 minutes - sets don't change often
  });
}

export function useSet(id: string) {
  return useQuery({
    queryKey: ['set', id],
    queryFn: () => getSet(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

export function useRecentSets(limit: number = 10) {
  return useQuery({
    queryKey: ['recentSets', limit],
    queryFn: () => getRecentSets(limit),
    staleTime: 10 * 60 * 1000,
  });
}
