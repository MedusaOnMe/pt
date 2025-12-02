'use client';

import Link from 'next/link';
import {
  Star,
  Trash2,
  TrendingUp,
  TrendingDown,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { getCardPrice, formatPrice, generatePriceHistory } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function WatchlistPage() {
  const { items, removeCard, clearWatchlist } = useWatchlistStore();

  const totalValue = items.reduce((acc, item) => {
    const price = getCardPrice(item.card);
    return acc + (price ?? 0);
  }, 0);

  const handleExport = () => {
    const csv = [
      ['Name', 'Set', 'Rarity', 'Price (USD)', 'Added Date'].join(','),
      ...items.map((item) => {
        const price = getCardPrice(item.card);
        return [
          `"${item.card.name}"`,
          `"${item.card.set.name}"`,
          `"${item.card.rarity ?? 'N/A'}"`,
          price?.toFixed(2) ?? 'N/A',
          new Date(item.addedAt).toLocaleDateString(),
        ].join(',');
      }),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'watchlist.csv';
    a.click();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Star className="w-6 h-6 text-warning" />
            Watchlist
          </h1>
          <p className="text-sm text-muted-foreground">
            Track cards you&apos;re interested in
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={items.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          {items.length > 0 && (
            <Button variant="destructive" size="sm" onClick={clearWatchlist}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <GlassCard className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Cards</p>
          <p className="text-xl font-semibold">{items.length}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Value</p>
          <p className="text-xl font-semibold font-mono text-primary">
            {formatPrice(totalValue)}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Value</p>
          <p className="text-xl font-semibold font-mono">
            {items.length > 0 ? formatPrice(totalValue / items.length) : '$0.00'}
          </p>
        </GlassCard>
      </div>

      {/* Watchlist Table */}
      <GlassCard noPadding>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Star className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <h3 className="font-medium mb-1">Your watchlist is empty</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start adding cards to track their prices
            </p>
            <Link href="/cards">
              <Button size="sm">Browse Cards</Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Card</TableHead>
                <TableHead className="hidden sm:table-cell">Set</TableHead>
                <TableHead className="hidden md:table-cell">Rarity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right hidden sm:table-cell">7d</TableHead>
                <TableHead className="hidden md:table-cell w-[80px]">Trend</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const price = getCardPrice(item.card);
                const change = (Math.random() - 0.4) * 30;
                const isPositive = change > 0;
                const priceHistory = price ? generatePriceHistory(price, 7) : [];

                return (
                  <TableRow key={item.cardId} className="group">
                    <TableCell>
                      <Link
                        href={`/cards/${item.cardId}`}
                        className="flex items-center gap-3 hover:text-primary transition-colors"
                      >
                        <img
                          src={item.card.images.small}
                          alt={item.card.name}
                          className="w-8 h-11 object-cover rounded"
                        />
                        <span className="font-medium text-sm truncate max-w-[120px]">{item.card.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">
                      <span className="truncate max-w-[100px] block">{item.card.set.name}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {item.card.rarity && (
                        <Badge variant="secondary" className="text-xs">
                          {item.card.rarity}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatPrice(price)}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      <span
                        className={cn(
                          'flex items-center justify-end gap-1 text-sm font-medium',
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
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {priceHistory.length > 0 && (
                        <SparkLine
                          data={priceHistory}
                          positive={isPositive}
                          width={60}
                          height={24}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={() => removeCard(item.cardId)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </GlassCard>
    </div>
  );
}
