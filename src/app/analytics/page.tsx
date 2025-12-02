'use client';

import { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  Activity,
  Layers,
  BarChart3,
} from 'lucide-react';
import { GlassCard } from '@/components/common/GlassCard';
import { StatCard } from '@/components/common/StatCard';
import { useCardsWithPrices } from '@/hooks/useCards';
import { useRecentSets } from '@/hooks/useSets';
import { getCardPrice, formatPrice } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const { data: cardsData, isLoading } = useCardsWithPrices(200);
  const { data: sets } = useRecentSets(10);

  const analytics = useMemo(() => {
    if (!cardsData?.data) return null;

    const cards = cardsData.data.map(card => ({
      ...card,
      price: getCardPrice(card) || 0,
      change: (Math.random() - 0.5) * 30,
    }));

    // Market stats
    const totalValue = cards.reduce((sum, c) => sum + c.price, 0);
    const avgPrice = totalValue / cards.length;
    const gainers = cards.filter(c => c.change > 0).length;
    const losers = cards.filter(c => c.change < 0).length;

    // Rarity distribution
    const rarityDist: Record<string, { count: number; value: number }> = {};
    cards.forEach(card => {
      const rarity = card.rarity || 'Unknown';
      if (!rarityDist[rarity]) rarityDist[rarity] = { count: 0, value: 0 };
      rarityDist[rarity].count++;
      rarityDist[rarity].value += card.price;
    });

    // Type distribution
    const typeDist: Record<string, { count: number; value: number }> = {};
    cards.forEach(card => {
      const type = card.types?.[0] || 'Colorless';
      if (!typeDist[type]) typeDist[type] = { count: 0, value: 0 };
      typeDist[type].count++;
      typeDist[type].value += card.price;
    });

    // Top movers
    const topGainers = [...cards].sort((a, b) => b.change - a.change).slice(0, 5);
    const topLosers = [...cards].sort((a, b) => a.change - b.change).slice(0, 5);

    return {
      totalCards: cards.length,
      totalValue,
      avgPrice,
      gainers,
      losers,
      rarityDist: Object.entries(rarityDist)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8),
      typeDist: Object.entries(typeDist)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.value - a.value),
      topGainers,
      topLosers,
    };
  }, [cardsData]);

  if (isLoading || !analytics) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold">Market Analytics</h1>
          <p className="text-sm text-muted-foreground">Loading market data...</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const maxRarityValue = Math.max(...analytics.rarityDist.map(r => r.value));
  const maxTypeValue = Math.max(...analytics.typeDist.map(t => t.value));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Market Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Insights and trends across the Pokemon TCG market
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Market Value"
          value={formatPrice(analytics.totalValue)}
          change={8.5}
          changeLabel="this week"
          icon={<BarChart3 className="w-4 h-4" />}
        />
        <StatCard
          label="Average Card Price"
          value={formatPrice(analytics.avgPrice)}
          change={2.3}
          changeLabel="vs last week"
          icon={<Activity className="w-4 h-4" />}
        />
        <StatCard
          label="Cards Gaining"
          value={analytics.gainers}
          change={(analytics.gainers / analytics.totalCards) * 100}
          changeLabel="of total"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <StatCard
          label="Cards Declining"
          value={analytics.losers}
          change={-((analytics.losers / analytics.totalCards) * 100)}
          changeLabel="of total"
          icon={<TrendingDown className="w-4 h-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Gainers */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-success" />
            <h3 className="font-semibold">Top Gainers</h3>
          </div>
          <div className="space-y-2">
            {analytics.topGainers.map((card, i) => (
              <div key={card.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                <span className="w-5 text-xs text-muted-foreground text-center">{i + 1}</span>
                <img src={card.images.small} alt={card.name} className="w-8 h-11 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{card.name}</p>
                  <p className="text-xs text-muted-foreground">{formatPrice(card.price)}</p>
                </div>
                <span className="text-sm font-medium text-success">
                  +{card.change.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Top Losers */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-4 h-4 text-error" />
            <h3 className="font-semibold">Top Losers</h3>
          </div>
          <div className="space-y-2">
            {analytics.topLosers.map((card, i) => (
              <div key={card.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                <span className="w-5 text-xs text-muted-foreground text-center">{i + 1}</span>
                <img src={card.images.small} alt={card.name} className="w-8 h-11 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{card.name}</p>
                  <p className="text-xs text-muted-foreground">{formatPrice(card.price)}</p>
                </div>
                <span className="text-sm font-medium text-error">
                  {card.change.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Value by Rarity */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">Value by Rarity</h3>
          </div>
          <div className="space-y-3">
            {analytics.rarityDist.map((rarity) => (
              <div key={rarity.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="truncate">{rarity.name}</span>
                  <span className="text-muted-foreground ml-2">{formatPrice(rarity.value)}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(rarity.value / maxRarityValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Value by Type */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">Value by Type</h3>
          </div>
          <div className="space-y-3">
            {analytics.typeDist.map((type) => (
              <div key={type.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{type.name}</span>
                  <span className="text-muted-foreground">{formatPrice(type.value)}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-chart-2 rounded-full transition-all"
                    style={{ width: `${(type.value / maxTypeValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
