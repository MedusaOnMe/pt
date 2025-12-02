'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Filter,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Star,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { GlassCard } from '@/components/common/GlassCard';
import { SparkLine } from '@/components/charts/SparkLine';
import { useWatchlistStore } from '@/stores/watchlistStore';
import { useCardsWithPrices } from '@/hooks/useCards';
import { getCardPrice, formatPrice, generatePriceHistory, RARITIES, POKEMON_TYPES } from '@/lib/api';
import { cn } from '@/lib/utils';

type SortKey = 'name' | 'price' | 'change' | 'rarity';
type SortDir = 'asc' | 'desc';

const PRESET_SCREENS = [
  { id: 'high-value', name: 'High Value', description: 'Cards over $50' },
  { id: 'gainers', name: 'Top Gainers', description: 'Biggest price increases' },
  { id: 'losers', name: 'Top Losers', description: 'Biggest price drops' },
  { id: 'rare', name: 'Ultra Rare', description: 'Rarest cards only' },
];

export default function ScreenerPage() {
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('price');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const { data, isLoading } = useCardsWithPrices(100);
  const { addCard, removeCard, isInWatchlist } = useWatchlistStore();

  const cardsWithData = useMemo(() => {
    if (!data?.data) return [];
    return data.data.map(card => ({
      ...card,
      price: getCardPrice(card) || 0,
      change: (Math.random() - 0.5) * 30,
      priceHistory: generatePriceHistory(getCardPrice(card) || 1, 7),
    }));
  }, [data]);

  const filteredCards = useMemo(() => {
    let result = [...cardsWithData];

    // Apply preset filters
    if (activePreset === 'high-value') {
      result = result.filter(c => c.price >= 50);
    } else if (activePreset === 'gainers') {
      result = result.filter(c => c.change > 5).sort((a, b) => b.change - a.change);
    } else if (activePreset === 'losers') {
      result = result.filter(c => c.change < -5).sort((a, b) => a.change - b.change);
    } else if (activePreset === 'rare') {
      result = result.filter(c =>
        c.rarity?.toLowerCase().includes('rare') ||
        c.rarity?.toLowerCase().includes('secret') ||
        c.rarity?.toLowerCase().includes('illustration')
      );
    }

    // Apply manual filters
    if (minPrice) {
      result = result.filter(c => c.price >= parseFloat(minPrice));
    }
    if (maxPrice) {
      result = result.filter(c => c.price <= parseFloat(maxPrice));
    }
    if (selectedRarity) {
      result = result.filter(c => c.rarity === selectedRarity);
    }
    if (selectedType) {
      result = result.filter(c => c.types?.includes(selectedType));
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'price':
          cmp = a.price - b.price;
          break;
        case 'change':
          cmp = a.change - b.change;
          break;
        case 'rarity':
          cmp = (a.rarity || '').localeCompare(b.rarity || '');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result.slice(0, 50);
  }, [cardsWithData, activePreset, minPrice, maxPrice, selectedRarity, selectedType, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedRarity('');
    setSelectedType('');
    setActivePreset(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Card Screener</h1>
        <p className="text-sm text-muted-foreground">
          Filter and screen cards based on custom criteria
        </p>
      </div>

      {/* Preset Screens */}
      <div className="flex flex-wrap gap-2">
        {PRESET_SCREENS.map((preset) => (
          <Button
            key={preset.id}
            variant={activePreset === preset.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActivePreset(activePreset === preset.id ? null : preset.id)}
            className="h-8"
          >
            {preset.name}
          </Button>
        ))}
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Price:</span>
            <Input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-20 h-8 text-sm bg-secondary/30"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-20 h-8 text-sm bg-secondary/30"
            />
          </div>

          <Select value={selectedRarity || '__all__'} onValueChange={(v) => setSelectedRarity(v === '__all__' ? '' : v)}>
            <SelectTrigger className="w-[140px] h-8 bg-secondary/30">
              <SelectValue placeholder="Rarity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Rarities</SelectItem>
              {RARITIES.slice(0, 10).map((rarity) => (
                <SelectItem key={rarity} value={rarity}>{rarity}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedType || '__all__'} onValueChange={(v) => setSelectedType(v === '__all__' ? '' : v)}>
            <SelectTrigger className="w-[120px] h-8 bg-secondary/30">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Types</SelectItem>
              {POKEMON_TYPES.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-muted-foreground">
            Clear All
          </Button>
        </div>
      </GlassCard>

      {/* Results */}
      <GlassCard noPadding>
        <div className="p-4 border-b border-border">
          <span className="text-sm text-muted-foreground">
            {filteredCards.length} cards match your criteria
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12"></TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort('name')} className="h-8 -ml-3">
                  Card <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort('rarity')} className="h-8 -ml-3">
                  Rarity <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="hidden sm:table-cell">Trend</TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" size="sm" onClick={() => handleSort('price')} className="h-8 -mr-3">
                  Price <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" size="sm" onClick={() => handleSort('change')} className="h-8 -mr-3">
                  Change <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <div className="h-12 bg-secondary/30 rounded animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredCards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No cards match your criteria
                </TableCell>
              </TableRow>
            ) : (
              filteredCards.map((card) => {
                const inWatchlist = isInWatchlist(card.id);
                return (
                  <TableRow key={card.id} className="group">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn('h-7 w-7', inWatchlist && 'text-warning')}
                        onClick={() => inWatchlist ? removeCard(card.id) : addCard(card)}
                      >
                        <Star className={cn('h-3.5 w-3.5', inWatchlist && 'fill-current')} />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Link href={`/cards/${card.id}`} className="flex items-center gap-3 group/link">
                        <img src={card.images.small} alt={card.name} className="w-8 h-11 rounded object-cover" />
                        <div>
                          <p className="font-medium text-sm group-hover/link:text-primary transition-colors">{card.name}</p>
                          <p className="text-xs text-muted-foreground">{card.set.name}</p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {card.rarity && (
                        <Badge variant="secondary" className="text-xs">{card.rarity}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <SparkLine data={card.priceHistory} positive={card.change > 0} width={60} height={24} />
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatPrice(card.price)}
                    </TableCell>
                    <TableCell className={cn(
                      'text-right text-sm font-medium',
                      card.change > 0 ? 'text-success' : 'text-error'
                    )}>
                      <span className="flex items-center justify-end gap-1">
                        {card.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {card.change > 0 && '+'}{card.change.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link href={`/cards/${card.id}`}>
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </GlassCard>
    </div>
  );
}
