'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Grid3X3, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { GlassCard } from '@/components/common/GlassCard';
import { useCardsWithPrices } from '@/hooks/useCards';
import { useRecentSets } from '@/hooks/useSets';
import { getCardPrice, formatPrice } from '@/lib/api';
import { cn } from '@/lib/utils';

type ViewMode = 'set' | 'rarity' | 'type';

export default function HeatmapPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('set');
  const [selectedSet, setSelectedSet] = useState<string>('');

  const { data: cardsData, isLoading } = useCardsWithPrices(200);
  const { data: sets } = useRecentSets(20);

  const cardsWithChanges = useMemo(() => {
    if (!cardsData?.data) return [];
    return cardsData.data.map(card => ({
      ...card,
      price: getCardPrice(card) || 0,
      change: (Math.random() - 0.5) * 40, // -20% to +20%
    }));
  }, [cardsData]);

  const filteredCards = useMemo(() => {
    let result = cardsWithChanges;
    if (selectedSet) {
      result = result.filter(c => c.set.id === selectedSet);
    }
    return result.slice(0, 100);
  }, [cardsWithChanges, selectedSet]);

  // Group cards by selected dimension
  const groupedData = useMemo(() => {
    const groups: Record<string, typeof filteredCards> = {};

    filteredCards.forEach(card => {
      let key = '';
      switch (viewMode) {
        case 'set':
          key = card.set.name;
          break;
        case 'rarity':
          key = card.rarity || 'Unknown';
          break;
        case 'type':
          key = card.types?.[0] || 'Colorless';
          break;
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(card);
    });

    return Object.entries(groups)
      .map(([name, cards]) => ({
        name,
        cards,
        totalValue: cards.reduce((sum, c) => sum + c.price, 0),
        avgChange: cards.reduce((sum, c) => sum + c.change, 0) / cards.length,
      }))
      .sort((a, b) => b.totalValue - a.totalValue);
  }, [filteredCards, viewMode]);

  const getChangeColor = (change: number) => {
    if (change > 10) return 'bg-success/80';
    if (change > 5) return 'bg-success/50';
    if (change > 0) return 'bg-success/30';
    if (change > -5) return 'bg-error/30';
    if (change > -10) return 'bg-error/50';
    return 'bg-error/80';
  };

  const getChangeTextColor = (change: number) => {
    return change >= 0 ? 'text-success' : 'text-error';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Market Heatmap</h1>
          <p className="text-sm text-muted-foreground">
            Visual overview of price movements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <SelectTrigger className="w-[120px] h-9 bg-secondary/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="set">By Set</SelectItem>
              <SelectItem value="rarity">By Rarity</SelectItem>
              <SelectItem value="type">By Type</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedSet || '__all__'} onValueChange={(v) => setSelectedSet(v === '__all__' ? '' : v)}>
            <SelectTrigger className="w-[160px] h-9 bg-secondary/30">
              <SelectValue placeholder="All Sets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Sets</SelectItem>
              {sets?.map((set) => (
                <SelectItem key={set.id} value={set.id}>{set.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <span className="text-muted-foreground">Price Change:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-error/80" />
          <span>-10%+</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-error/30" />
          <span>-5%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-secondary" />
          <span>0%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-success/30" />
          <span>+5%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-success/80" />
          <span>+10%+</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-secondary/30 animate-pulse" />
          ))}
        </div>
      ) : filteredCards.length === 0 ? (
        <GlassCard className="py-16 text-center">
          <Grid3X3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-medium mb-1">No data available</h3>
          <p className="text-sm text-muted-foreground">
            Select different filters to view the heatmap
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {groupedData.map((group) => (
            <GlassCard key={group.name}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium">{group.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {group.cards.length} cards · {formatPrice(group.totalValue)} total
                  </p>
                </div>
                <div className={cn('flex items-center gap-1 text-sm font-medium', getChangeTextColor(group.avgChange))}>
                  {group.avgChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {group.avgChange > 0 && '+'}{group.avgChange.toFixed(1)}% avg
                </div>
              </div>

              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1">
                {group.cards.slice(0, 24).map((card) => (
                  <Tooltip key={card.id}>
                    <TooltipTrigger asChild>
                      <Link href={`/cards/${card.id}`}>
                        <div
                          className={cn(
                            'aspect-square rounded overflow-hidden transition-transform hover:scale-110 hover:z-10 relative',
                            getChangeColor(card.change)
                          )}
                        >
                          <img
                            src={card.images.small}
                            alt={card.name}
                            className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                          />
                        </div>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs">
                        <p className="font-medium">{card.name}</p>
                        <p className="text-muted-foreground">{formatPrice(card.price)}</p>
                        <p className={getChangeTextColor(card.change)}>
                          {card.change > 0 && '+'}{card.change.toFixed(1)}%
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
