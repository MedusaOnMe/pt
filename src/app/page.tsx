'use client';

import Link from 'next/link';
import {
  CreditCard,
  Layers,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { GlassCard } from '@/components/common/GlassCard';
import { StatCard } from '@/components/common/StatCard';
import { TickerTape } from '@/components/common/TickerTape';
import { CardGrid } from '@/components/cards/CardGrid';
import { SparkLine } from '@/components/charts/SparkLine';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePopularCards, useCardsWithPrices } from '@/hooks/useCards';
import { useRecentSets } from '@/hooks/useSets';
import { getCardPrice, formatPrice } from '@/lib/api';
import type { PokemonCard } from '@/types/pokemon';

function HotCardItem({ card, rank }: { card: PokemonCard; rank: number }) {
  const price = getCardPrice(card);
  const change = card.priceChange ?? 0;
  const isPositive = change >= 0;
  // Use real price history from API if available
  const priceHistory = card.priceHistory ?? [];

  return (
    <Link href={`/cards/${card.id}`}>
      <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group">
        <span className="w-5 text-center text-xs font-mono text-muted-foreground">
          {rank}
        </span>

        <img
          src={card.images.small}
          alt={card.name}
          className="w-9 h-12 object-cover rounded"
        />

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {card.name}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {card.set.name}
          </p>
        </div>

        <div className="hidden sm:block">
          {priceHistory.length > 0 && (
            <SparkLine data={priceHistory} positive={isPositive} width={50} height={24} />
          )}
        </div>

        <div className="text-right">
          <p className="font-mono text-sm">
            {formatPrice(price)}
          </p>
          <p
            className={`flex items-center justify-end gap-0.5 text-xs font-medium ${
              isPositive ? 'text-success' : 'text-error'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {isPositive && '+'}
            {change.toFixed(1)}%
          </p>
        </div>
      </div>
    </Link>
  );
}

function RecentSetItem({ set }: { set: { id: string; name: string; images: { logo: string; symbol: string }; releaseDate: string; total: number } }) {
  return (
    <Link href={`/sets/${set.id}`}>
      <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group">
        <img
          src={set.images.logo}
          alt={set.name}
          className="w-14 h-8 object-contain"
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {set.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {set.total} cards
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { data: popularCards, isLoading: loadingPopular } = usePopularCards(20);
  const { data: cardsWithPrices, isLoading: loadingCards } = useCardsWithPrices(50);
  const { data: recentSets, isLoading: loadingSets } = useRecentSets(7);

  const tickerCards = cardsWithPrices?.data?.slice(0, 15) ?? [];
  const hotCards = popularCards?.slice(0, 8) ?? [];

  return (
    <div className="space-y-5">
      {/* Ticker Tape */}
      {tickerCards.length > 0 && (
        <div className="-mx-5 -mt-5">
          <TickerTape cards={tickerCards} />
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Cards"
          value="23,847"
          change={2.4}
          changeLabel="this month"
          icon={<CreditCard className="w-4 h-4" />}
        />
        <StatCard
          label="Active Sets"
          value="156"
          change={1.2}
          changeLabel="new"
          icon={<Layers className="w-4 h-4" />}
        />
        <StatCard
          label="24h Volume"
          value="$2.4M"
          change={12.5}
          changeLabel="vs yesterday"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <StatCard
          label="Top Gainer"
          value="+47.3%"
          change={47.3}
          changeLabel="Charizard VMAX"
          icon={<Sparkles className="w-4 h-4" />}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Hot Cards */}
        <div className="lg:col-span-2">
          <GlassCard className="h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Trending Cards</h2>
              <Link href="/cards">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {loadingPopular ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5">
                    <Skeleton className="w-5 h-4" />
                    <Skeleton className="w-9 h-12 rounded" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="w-14 h-6" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-0.5">
                {hotCards.map((card, index) => (
                  <HotCardItem key={card.id} card={card} rank={index + 1} />
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-5">
          {/* Recent Sets */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Recent Sets</h3>
              <Link href="/sets">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground h-7 px-2">
                  All Sets
                </Button>
              </Link>
            </div>

            {loadingSets ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5">
                    <Skeleton className="w-14 h-8" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-14" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-0.5">
                {recentSets?.map((set) => (
                  <RecentSetItem key={set.id} set={set} />
                ))}
              </div>
            )}
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard className="flex-1">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/cards">
                <Button variant="secondary" className="w-full h-auto py-3 flex-col gap-1.5">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-xs">Browse</span>
                </Button>
              </Link>
              <Link href="/watchlist">
                <Button variant="secondary" className="w-full h-auto py-3 flex-col gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs">Watchlist</span>
                </Button>
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Featured Cards Grid */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Featured Cards</h2>
            <p className="text-sm text-muted-foreground">
              High-value cards from recent sets
            </p>
          </div>
          <Link href="/cards">
            <Button variant="outline" size="sm">
              Explore All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <CardGrid
          cards={cardsWithPrices?.data?.slice(10, 18) ?? []}
          isLoading={loadingCards}
        />
      </GlassCard>
    </div>
  );
}
