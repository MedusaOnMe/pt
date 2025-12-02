'use client';

import { use, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GlassCard } from '@/components/common/GlassCard';
import { StatCard } from '@/components/common/StatCard';
import { CardGrid } from '@/components/cards/CardGrid';
import { useSet } from '@/hooks/useSets';
import { useCardsBySet } from '@/hooks/useCards';
import { getCardPrice, formatPrice } from '@/lib/api';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SetDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { data: set, isLoading: loadingSet } = useSet(id);
  const {
    data: cardsData,
    isLoading: loadingCards,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCardsBySet(id, 50);

  const cards = useMemo(
    () => cardsData?.pages.flatMap((page) => page.data) ?? [],
    [cardsData]
  );

  const stats = useMemo(() => {
    if (cards.length === 0) return { totalValue: 0, avgPrice: 0, highestPrice: 0 };

    const prices = cards.map(getCardPrice).filter((p): p is number => p !== null);
    const totalValue = prices.reduce((a, b) => a + b, 0);
    const avgPrice = prices.length > 0 ? totalValue / prices.length : 0;
    const highestPrice = Math.max(...prices, 0);

    return { totalValue, avgPrice, highestPrice };
  }, [cards]);

  if (loadingSet) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-24" />
        <div className="rounded-xl bg-card border border-border p-5">
          <div className="flex items-center gap-6">
            <Skeleton className="w-28 h-16" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!set) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-xl font-semibold mb-2">Set Not Found</h1>
        <p className="text-sm text-muted-foreground mb-4">The set you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/sets">
          <Button size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sets
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Back button */}
      <Link href="/sets">
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </Link>

      {/* Set Header */}
      <GlassCard>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
          <img
            src={set.images.logo}
            alt={set.name}
            className="h-20 w-auto object-contain"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">{set.series}</Badge>
              {set.legalities?.standard === 'Legal' && (
                <Badge className="bg-success/10 text-success text-xs">Standard</Badge>
              )}
            </div>
            <h1 className="text-2xl font-semibold">{set.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(set.releaseDate).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" />
                {set.total} cards
              </span>
              {set.ptcgoCode && (
                <span className="font-mono text-xs">Code: {set.ptcgoCode}</span>
              )}
            </div>
          </div>
          <img
            src={set.images.symbol}
            alt={`${set.name} symbol`}
            className="w-10 h-10 object-contain hidden md:block"
          />
        </div>
      </GlassCard>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Set Value"
          value={formatPrice(stats.totalValue)}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <StatCard
          label="Avg Price"
          value={formatPrice(stats.avgPrice)}
          icon={<CreditCard className="w-4 h-4" />}
        />
        <StatCard
          label="Top Card"
          value={formatPrice(stats.highestPrice)}
          icon={<TrendingUp className="w-4 h-4" />}
        />
      </div>

      {/* Cards in Set */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold">Cards</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Showing {cards.length} of {set.total}
            </p>
          </div>
        </div>

        <CardGrid cards={cards} isLoading={loadingCards} />

        {/* Load More */}
        {hasNextPage && (
          <div className="flex justify-center pt-5">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
