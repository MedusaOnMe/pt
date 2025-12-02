'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PokemonCard } from '@/types/pokemon';
import { getCardPrice, formatPrice } from '@/lib/api';

interface TickerTapeProps {
  cards: PokemonCard[];
  className?: string;
}

interface TickerItemProps {
  card: PokemonCard;
  change: number;
}

function TickerItem({ card, change }: TickerItemProps) {
  const price = getCardPrice(card);
  const isPositive = change > 0;

  return (
    <div className="flex items-center gap-3 px-5 py-2.5 border-r border-border/30">
      <img
        src={card.images.small}
        alt={card.name}
        className="w-7 h-10 object-cover rounded"
      />
      <div className="flex flex-col">
        <span className="text-sm font-medium whitespace-nowrap">
          {card.name}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
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
  );
}

export function TickerTape({ cards, className }: TickerTapeProps) {
  const itemsWithChanges = cards.map((card) => ({
    card,
    change: (Math.random() - 0.5) * 20,
  }));

  const duplicatedItems = [...itemsWithChanges, ...itemsWithChanges];

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-card/30 border-b border-border',
        className
      )}
    >
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />

      <motion.div
        className="flex"
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: 35,
            ease: 'linear',
          },
        }}
      >
        {duplicatedItems.map((item, index) => (
          <TickerItem
            key={`${item.card.id}-${index}`}
            card={item.card}
            change={item.change}
          />
        ))}
      </motion.div>
    </div>
  );
}
