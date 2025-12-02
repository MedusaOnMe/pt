'use client';

import { cn } from '@/lib/utils';
import { GlassCard } from './GlassCard';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  changeLabel,
  icon,
  className,
}: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <GlassCard className={cn('relative overflow-hidden', className)}>
      {/* Subtle top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-muted-foreground">
          {label}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/10 to-purple-500/10 flex items-center justify-center text-cyan-400">
            {icon}
          </div>
        )}
      </div>

      <div className="text-2xl font-semibold mb-1 tracking-tight">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex items-center gap-1 text-sm font-medium',
              isPositive && 'text-success',
              isNegative && 'text-error',
              !isPositive && !isNegative && 'text-muted-foreground'
            )}
          >
            {isPositive && <TrendingUp className="w-3.5 h-3.5" />}
            {isNegative && <TrendingDown className="w-3.5 h-3.5" />}
            {!isPositive && !isNegative && <Minus className="w-3.5 h-3.5" />}
            <span>
              {isPositive && '+'}
              {change.toFixed(1)}%
            </span>
          </div>
          {changeLabel && (
            <span className="text-xs text-muted-foreground">
              {changeLabel}
            </span>
          )}
        </div>
      )}
    </GlassCard>
  );
}
