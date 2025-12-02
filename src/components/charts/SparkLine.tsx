'use client';

import { cn } from '@/lib/utils';

interface SparkLineProps {
  data: { time: string; value: number }[];
  className?: string;
  width?: number;
  height?: number;
  positive?: boolean;
}

export function SparkLine({
  data,
  className,
  width = 100,
  height = 40,
  positive = true,
}: SparkLineProps) {
  if (data.length < 2) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  // Generate SVG path
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const color = positive ? '#34d399' : '#f87171';

  return (
    <svg
      width={width}
      height={height}
      className={cn('inline-block', className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
