'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Grid3X3,
  List,
  X,
  ArrowUpDown,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CardGrid } from '@/components/cards/CardGrid';
import { GlassCard } from '@/components/common/GlassCard';
import { useCards } from '@/hooks/useCards';
import { useRecentSets } from '@/hooks/useSets';
import { RARITIES, POKEMON_TYPES } from '@/lib/api';
import type { CardFilters } from '@/types/pokemon';

const SORT_OPTIONS = [
  { value: 'price-desc', label: 'Price: High to Low', sortBy: 'price', sortOrder: 'desc' },
  { value: 'price-asc', label: 'Price: Low to High', sortBy: 'price', sortOrder: 'asc' },
  { value: 'name-asc', label: 'Name: A to Z', sortBy: 'name', sortOrder: 'asc' },
  { value: 'name-desc', label: 'Name: Z to A', sortBy: 'name', sortOrder: 'desc' },
  { value: 'cardNumber-asc', label: 'Card #: Low to High', sortBy: 'cardNumber', sortOrder: 'asc' },
  { value: 'cardNumber-desc', label: 'Card #: High to Low', sortBy: 'cardNumber', sortOrder: 'desc' },
] as const;

export default function CardsPage() {
  const [filters, setFilters] = useState<CardFilters>({});
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortValue, setSortValue] = useState('price-desc');

  // Debounce search input - only trigger API after 800ms of no typing
  // Also require at least 3 characters to avoid partial matches
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.length >= 3 || searchInput.length === 0) {
        setDebouncedSearch(searchInput);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const selectedSort = SORT_OPTIONS.find(o => o.value === sortValue) ?? SORT_OPTIONS[0];

  const activeFilters = useMemo(() => ({
    ...filters,
    name: debouncedSearch || undefined,
    sortBy: selectedSort.sortBy as CardFilters['sortBy'],
    sortOrder: selectedSort.sortOrder as CardFilters['sortOrder'],
  }), [filters, debouncedSearch, selectedSort]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useCards(activeFilters, 24);

  const { data: sets } = useRecentSets(50);

  const cards = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  );

  const totalCount = data?.pages[0]?.totalCount ?? 0;

  const handleFilterChange = (key: keyof CardFilters, value: string | string[] | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchInput('');
    setDebouncedSearch('');
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (debouncedSearch ? 1 : 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Card Explorer</h1>
          <p className="text-sm text-muted-foreground">
            {activeFilterCount === 0
              ? 'Trending cards from Prismatic Evolutions'
              : 'Browse and discover Pokemon TCG cards'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-border bg-secondary/30 p-0.5">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode('list')}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search cards by name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 bg-secondary/30 h-9"
            />
          </div>

          {/* Quick filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={filters.set || '__all__'}
              onValueChange={(value) => handleFilterChange('set', value === '__all__' ? undefined : value)}
            >
              <SelectTrigger className="w-[160px] bg-secondary/30 h-9">
                <SelectValue placeholder="All Sets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Sets</SelectItem>
                {sets?.map((set) => (
                  <SelectItem key={set.id} value={set.id}>
                    {set.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.rarity?.[0] || '__all__'}
              onValueChange={(value) =>
                handleFilterChange('rarity', value === '__all__' ? undefined : [value])
              }
            >
              <SelectTrigger className="w-[130px] bg-secondary/30 h-9">
                <SelectValue placeholder="Rarity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Rarities</SelectItem>
                {RARITIES.map((rarity) => (
                  <SelectItem key={rarity} value={rarity}>
                    {rarity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.types?.[0] || '__all__'}
              onValueChange={(value) =>
                handleFilterChange('types', value === '__all__' ? undefined : [value])
              }
            >
              <SelectTrigger className="w-[120px] bg-secondary/30 h-9">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Types</SelectItem>
                {POKEMON_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortValue} onValueChange={setSortValue}>
              <SelectTrigger className="w-[160px] bg-secondary/30 h-9">
                <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground h-9"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear ({activeFilterCount})
              </Button>
            )}
          </div>
        </div>

        {/* Active filters display */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50">
            {debouncedSearch && (
              <Badge variant="secondary" className="gap-1 text-xs">
                Search: {debouncedSearch}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-foreground"
                  onClick={() => { setSearchInput(''); setDebouncedSearch(''); }}
                />
              </Badge>
            )}
            {filters.set && (
              <Badge variant="secondary" className="gap-1 text-xs">
                Set: {sets?.find((s) => s.id === filters.set)?.name}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-foreground"
                  onClick={() => handleFilterChange('set', undefined)}
                />
              </Badge>
            )}
            {filters.rarity?.[0] && (
              <Badge variant="secondary" className="gap-1 text-xs">
                Rarity: {filters.rarity[0]}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-foreground"
                  onClick={() => handleFilterChange('rarity', undefined)}
                />
              </Badge>
            )}
            {filters.types?.[0] && (
              <Badge variant="secondary" className="gap-1 text-xs">
                Type: {filters.types[0]}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-foreground"
                  onClick={() => handleFilterChange('types', undefined)}
                />
              </Badge>
            )}
          </div>
        )}
      </GlassCard>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? (
            'Loading...'
          ) : (
            <>
              Showing <span className="font-medium text-foreground">{cards.length}</span> of{' '}
              <span className="font-medium text-foreground">{totalCount.toLocaleString()}</span> cards
            </>
          )}
        </p>
      </div>

      {/* Cards Grid */}
      <CardGrid cards={cards} isLoading={isLoading} />

      {/* Load More */}
      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
}
