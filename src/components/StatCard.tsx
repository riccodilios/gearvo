import * as React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  ...props
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-800 bg-zinc-950/80 p-3.5 shadow-sm transition-colors hover:border-zinc-700 sm:p-6',
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium leading-snug text-zinc-400 sm:text-sm">{title}</p>
        {Icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-600/10 text-amber-500 sm:h-9 sm:w-9">
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        )}
      </div>
      <p className="mt-2 break-words text-lg font-bold tabular-nums text-zinc-50 sm:text-2xl">{value}</p>
      {(description || trend) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 sm:mt-2">
          {trend && (
            <span
              className={cn(
                'text-xs font-medium sm:text-sm',
                trend.positive ? 'text-emerald-500' : 'text-red-500'
              )}
            >
              {trend.positive ? '+' : ''}
              {trend.value}%
            </span>
          )}
          {description && (
            <span className="text-xs text-zinc-500 sm:text-sm">{description}</span>
          )}
          {trend?.label && (
            <span className="text-xs text-zinc-500 sm:text-sm">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  );
}
