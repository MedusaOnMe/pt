'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  noPadding?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, hover = false, noPadding = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl bg-card border border-border transition-all duration-200',
          hover && 'hover-lift cursor-pointer hover:border-cyan-500/20 hover:shadow-[0_0_20px_rgba(34,211,238,0.05)]',
          !noPadding && 'p-5',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

// Simple Card variant for lighter use
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, hover = false, noPadding = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg bg-secondary/50 border border-border/50',
          hover && 'hover:bg-secondary/80 transition-colors cursor-pointer',
          !noPadding && 'p-4',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
