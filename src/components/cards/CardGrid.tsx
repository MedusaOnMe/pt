'use client';

import Link from 'next/link';
import { Star, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWatchlistStore } from '@/stores/watchlistStore';
import type { PokemonCard } from '@/types/pokemon';
import { getCardPrice, formatPrice } from '@/lib/api';

interface CardGridProps {
  cards: PokemonCard[];
  isLoading?: boolean;
}

function CardGridItem({ card }: { card: PokemonCard }) {
  const { addCard, removeCard, isInWatchlist } = useWatchlistStore();
  const price = getCardPrice(card);
  const inWatchlist = isInWatchlist(card.id);

  const change = (Math.random() - 0.5) * 20;
  const isPositive = change > 0;

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWatchlist) {
      removeCard(card.id);
    } else {
      addCard(card);
    }
  };

  return (
    <Link href={`/cards/${card.id}`}>
      <div className="group relative overflow-hidden rounded-lg bg-card border border-border hover-lift">
        {/* Card image */}
        <div className="relative aspect-[2.5/3.5] overflow-hidden bg-secondary/30">
          <img
            src={card.images.large}
            alt={card.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

          {/* Watchlist button */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'absolute top-2 right-2 w-7 h-7 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-black/60',
              inWatchlist && 'opacity-100 text-warning'
            )}
            onClick={handleWatchlistToggle}
          >
            <Star
              className={cn('w-3.5 h-3.5', inWatchlist && 'fill-current')}
            />
          </Button>

          {/* Rarity badge */}
          {card.rarity && (
            <Badge
              variant="secondary"
              className="absolute top-2 left-2 bg-black/40 backdrop-blur-sm text-[10px] px-1.5 py-0"
            >
              {card.rarity}
            </Badge>
          )}
        </div>

        {/* Card info */}
        <div className="p-3">
          <h3 className="font-medium text-sm truncate mb-0.5">
            {card.name}
          </h3>
          <p className="text-xs text-muted-foreground truncate mb-2">
            {card.set.name} · #{card.number}
          </p>

          {/* Price info */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-mono font-semibold text-primary">
              {formatPrice(price)}
            </span>
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs font-medium',
                isPositive ? 'text-success' : 'text-error'
              )}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {isPositive && '+'}
              {change.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="rounded-lg bg-card border border-border overflow-hidden">
          <div className="aspect-[2.5/3.5] bg-secondary/50 animate-pulse" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-secondary/50 rounded animate-pulse" />
            <div className="h-3 bg-secondary/50 rounded w-2/3 animate-pulse" />
            <div className="h-5 bg-secondary/50 rounded w-1/2 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardGrid({ cards, isLoading }: CardGridProps) {
  if (isLoading) {
    return <CardGridSkeleton />;
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mb-3">
          <Star className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-medium mb-1">No cards found</h3>
        <p className="text-xs text-muted-foreground">
          Try adjusting your filters
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
      {cards.map((card) => (
        <CardGridItem key={card.id} card={card} />
      ))}
    </div>
  );
}
