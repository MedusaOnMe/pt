'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, AreaSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PriceChartProps {
  data: { time: string; value: number }[];
  className?: string;
  height?: number;
}

const timeRanges = [
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: 'ALL', days: Infinity },
] as const;

export function PriceChart({ data, className, height = 300 }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const [selectedRange, setSelectedRange] = useState<(typeof timeRanges)[number]>(timeRanges[5]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#71717a',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      width: containerRef.current.clientWidth,
      height,
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.06)',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.06)',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: {
          color: '#22d3ee',
          width: 1,
          style: 2,
          labelBackgroundColor: '#22d3ee',
        },
        horzLine: {
          color: '#22d3ee',
          width: 1,
          style: 2,
          labelBackgroundColor: '#22d3ee',
        },
      },
    });

    chartRef.current = chart;

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#22d3ee',
      topColor: 'rgba(34, 211, 238, 0.3)',
      bottomColor: 'rgba(34, 211, 238, 0)',
      lineWidth: 2,
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    });

    seriesRef.current = areaSeries;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [height]);

  useEffect(() => {
    if (!seriesRef.current || !data.length) return;

    let filteredData = data;

    if (selectedRange.days !== Infinity) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - selectedRange.days);
      const cutoffStr = cutoffDate.toISOString().split('T')[0];

      filteredData = data.filter((d) => d.time >= cutoffStr);
    }

    seriesRef.current.setData(filteredData);
    chartRef.current?.timeScale().fitContent();
  }, [data, selectedRange]);

  return (
    <div className={cn('', className)}>
      {/* Time range buttons */}
      <div className="flex justify-end gap-1 mb-3">
        {timeRanges.map((range) => (
          <Button
            key={range.label}
            variant="ghost"
            size="sm"
            className={cn(
              'h-6 px-2 text-xs',
              selectedRange.label === range.label
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setSelectedRange(range)}
          >
            {range.label}
          </Button>
        ))}
      </div>

      {/* Chart container */}
      <div className="relative">
        <div ref={containerRef} className="w-full" />

        {/* Empty state */}
        {data.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No price data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
