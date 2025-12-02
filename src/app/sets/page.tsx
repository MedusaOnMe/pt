'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Layers, Calendar, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GlassCard } from '@/components/common/GlassCard';
import { useSets } from '@/hooks/useSets';

function groupSetsBySeries(sets: Array<{ id: string; name: string; series: string; releaseDate: string; total: number; images: { logo: string; symbol: string } }>) {
  const grouped: Record<string, typeof sets> = {};
  sets.forEach((set) => {
    if (!grouped[set.series]) {
      grouped[set.series] = [];
    }
    grouped[set.series].push(set);
  });
  return grouped;
}

export default function SetsPage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useSets(100);

  const sets = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  );

  const groupedSets = useMemo(() => groupSetsBySeries(sets), [sets]);
  const seriesOrder = Object.keys(groupedSets);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-card border border-border p-4">
              <Skeleton className="h-14 w-full mb-3" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Layers className="w-6 h-6 text-primary" />
          Pokemon TCG Sets
        </h1>
        <p className="text-sm text-muted-foreground">
          Browse all {sets.length}+ sets from Base Set to present
        </p>
      </div>

      {/* Sets by Series */}
      {seriesOrder.map((series) => (
        <section key={series}>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold">{series}</h2>
            <Badge variant="secondary" className="text-xs">{groupedSets[series].length}</Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {groupedSets[series].map((set) => (
              <Link key={set.id} href={`/sets/${set.id}`}>
                <GlassCard
                  hover
                  className="h-full flex flex-col items-center text-center p-4"
                >
                  {/* Set Logo */}
                  <div className="h-16 flex items-center justify-center mb-3 bg-secondary/30 rounded-lg p-2 relative">
                    <img
                      src={set.images.logo}
                      alt=""
                      className="max-h-full max-w-full object-contain relative z-10"
                      onLoad={(e) => {
                        // Hide placeholder when image loads
                        const placeholder = (e.target as HTMLImageElement).nextElementSibling;
                        if (placeholder) placeholder.classList.add('hidden');
                      }}
                      onError={(e) => {
                        // Hide broken image
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <Layers className="w-8 h-8 text-muted-foreground/50 absolute" />
                  </div>

                  {/* Set Info */}
                  <h3 className="font-medium text-sm mb-1 line-clamp-2">
                    {set.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />
                      {set.total}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(set.releaseDate).getFullYear()}
                    </span>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {/* Load More */}
      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading...' : 'Load More Sets'}
          </Button>
        </div>
      )}
    </div>
  );
}
