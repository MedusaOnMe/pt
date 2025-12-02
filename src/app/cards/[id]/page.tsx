'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Star,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Swords,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { GlassCard } from '@/components/common/GlassCard';
import { PriceChart } from '@/components/charts/PriceChart';
import { useCard } from '@/hooks/useCards';
import { useWatchlistStore } from '@/stores/watchlistStore';
import { getCardPrice, formatPrice } from '@/lib/api';
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CardDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { data: card, isLoading, error } = useCard(id);
  const { addCard, removeCard, isInWatchlist } = useWatchlistStore();

  if (isLoading) {
    return <CardDetailSkeleton />;
  }

  if (error || !card) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-xl font-semibold mb-2">Card Not Found</h1>
        <p className="text-sm text-muted-foreground mb-4">The card you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/cards">
          <Button size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cards
          </Button>
        </Link>
      </div>
    );
  }

  const price = getCardPrice(card);
  const priceHistory = card.priceHistory ?? [];
  const inWatchlist = isInWatchlist(card.id);

  const change = card.priceChange ?? 0;
  const isPositive = change >= 0;

  const handleWatchlistToggle = () => {
    if (inWatchlist) {
      removeCard(card.id);
    } else {
      addCard(card);
    }
  };

  return (
    <div className="space-y-5">
      {/* Back button */}
      <Link href="/cards">
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column - Card Image */}
        <div className="lg:col-span-1">
          <GlassCard className="sticky top-20">
            {/* Card Image */}
            <div className="relative aspect-[2.5/3.5] rounded-lg overflow-hidden mx-auto max-w-[280px] bg-secondary/30">
              <img
                src={card.images.large}
                alt={card.name}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mt-4">
              <Button
                variant={inWatchlist ? 'default' : 'outline'}
                className="flex-1"
                size="sm"
                onClick={handleWatchlistToggle}
              >
                <Star className={cn('w-4 h-4 mr-2', inWatchlist && 'fill-current')} />
                {inWatchlist ? 'Watching' : 'Watch'}
              </Button>
            </div>

            {/* External Links */}
            <div className="flex gap-2 mt-2">
              {card.tcgplayer?.url && (
                <a href={card.tcgplayer.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="secondary" className="w-full text-xs" size="sm">
                    TCGPlayer <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </a>
              )}
              {card.cardmarket?.url && (
                <a href={card.cardmarket.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="secondary" className="w-full text-xs" size="sm">
                    Cardmarket <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </a>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header */}
          <GlassCard>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {card.rarity && (
                    <Badge variant="secondary" className="text-xs">{card.rarity}</Badge>
                  )}
                  {card.supertype && (
                    <Badge variant="outline" className="text-xs">{card.supertype}</Badge>
                  )}
                </div>
                <h1 className="text-2xl font-semibold">{card.name}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {card.set.name} · #{card.number}{card.set.total ? `/${card.set.total}` : ''}
                </p>
              </div>

              {/* Price Display */}
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Market Price</p>
                <p className="text-3xl font-mono font-semibold text-primary">
                  {formatPrice(price)}
                </p>
                <p
                  className={cn(
                    'flex items-center justify-end gap-1 text-sm font-medium mt-1',
                    isPositive ? 'text-success' : 'text-error'
                  )}
                >
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isPositive && '+'}
                  {change.toFixed(1)}% (7d)
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Price Chart */}
          <GlassCard>
            <h2 className="font-semibold mb-4">Price History</h2>
            {priceHistory.length > 0 ? (
              <PriceChart data={priceHistory} height={300} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                No price history available
              </div>
            )}
          </GlassCard>

          {/* Price Breakdown */}
          <GlassCard>
            <h2 className="font-semibold mb-4">Price Breakdown</h2>
            <Tabs defaultValue="tcgplayer">
              <TabsList className="mb-4">
                <TabsTrigger value="tcgplayer" className="text-xs">TCGPlayer (USD)</TabsTrigger>
                <TabsTrigger value="cardmarket" className="text-xs">Cardmarket (EUR)</TabsTrigger>
              </TabsList>

              <TabsContent value="tcgplayer">
                {card.tcgplayer?.prices ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(card.tcgplayer.prices).map(([type, priceData]) => (
                      <div key={type} className="p-3 rounded-lg bg-secondary/30">
                        <p className="text-xs text-muted-foreground capitalize mb-1">
                          {type.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="text-sm font-mono font-semibold">
                          {formatPrice(priceData?.market ?? null)}
                        </p>
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                          <span>L: {formatPrice(priceData?.low ?? null)}</span>
                          <span>H: {formatPrice(priceData?.high ?? null)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No TCGPlayer pricing available</p>
                )}
              </TabsContent>

              <TabsContent value="cardmarket">
                {card.cardmarket?.prices ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <p className="text-xs text-muted-foreground mb-1">Trend</p>
                      <p className="text-sm font-mono font-semibold">
                        €{card.cardmarket.prices.trendPrice?.toFixed(2) ?? 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <p className="text-xs text-muted-foreground mb-1">Avg Sell</p>
                      <p className="text-sm font-mono font-semibold">
                        €{card.cardmarket.prices.averageSellPrice?.toFixed(2) ?? 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <p className="text-xs text-muted-foreground mb-1">Low</p>
                      <p className="text-sm font-mono font-semibold">
                        €{card.cardmarket.prices.lowPrice?.toFixed(2) ?? 'N/A'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No Cardmarket pricing available</p>
                )}
              </TabsContent>
            </Tabs>
          </GlassCard>

          {/* Card Details */}
          <GlassCard>
            <h2 className="font-semibold mb-4">Card Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              {card.hp && (
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-success" />
                  <span className="text-muted-foreground">HP:</span>
                  <span className="font-medium">{card.hp}</span>
                </div>
              )}
              {card.types && (
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-warning" />
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{card.types.join(', ')}</span>
                </div>
              )}
              {card.artist && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Artist:</span>
                  <span className="font-medium truncate">{card.artist}</span>
                </div>
              )}
              {card.evolvesFrom && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Evolves From:</span>
                  <span className="font-medium">{card.evolvesFrom}</span>
                </div>
              )}
            </div>

            {/* Attacks */}
            {card.attacks && card.attacks.length > 0 && (
              <>
                <Separator className="my-4" />
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Swords className="w-4 h-4 text-chart-3" />
                  Attacks
                </h3>
                <div className="space-y-2">
                  {card.attacks.map((attack, index) => (
                    <div key={index} className="p-3 rounded-lg bg-secondary/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{attack.name}</span>
                        {attack.damage && (
                          <Badge variant="destructive" className="text-xs">{attack.damage}</Badge>
                        )}
                      </div>
                      {attack.text && (
                        <p className="text-xs text-muted-foreground">{attack.text}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Rules */}
            {card.rules && card.rules.length > 0 && (
              <>
                <Separator className="my-4" />
                <h3 className="text-sm font-medium mb-3">Rules</h3>
                <div className="space-y-2">
                  {card.rules.map((rule, index) => (
                    <p key={index} className="text-xs text-muted-foreground italic">
                      {rule}
                    </p>
                  ))}
                </div>
              </>
            )}
          </GlassCard>

          {/* Set Info */}
          <GlassCard>
            <div className="flex items-center gap-4">
              {card.set.images.logo ? (
                <img
                  src={card.set.images.logo}
                  alt={card.set.name}
                  className="w-20 h-auto object-contain"
                />
              ) : (
                <div className="w-20 h-12 bg-secondary/30 rounded flex items-center justify-center">
                  <Layers className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium">{card.set.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {card.set.series && `${card.set.series} · `}
                  {card.set.releaseDate ? new Date(card.set.releaseDate).getFullYear() : ''}
                </p>
                {card.set.total > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {card.set.total} cards
                  </p>
                )}
              </div>
              <Link href={`/sets/${card.set.id}`}>
                <Button variant="outline" size="sm" className="text-xs">
                  View Set
                </Button>
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function CardDetailSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-24" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <div className="rounded-xl bg-card border border-border p-5">
            <Skeleton className="aspect-[2.5/3.5] rounded-lg mx-auto max-w-[280px]" />
            <Skeleton className="h-9 w-full mt-4" />
          </div>
        </div>
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-xl bg-card border border-border p-5">
            <Skeleton className="h-6 w-48 mb-3" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="rounded-xl bg-card border border-border p-5">
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
