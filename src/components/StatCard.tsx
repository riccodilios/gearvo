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
        'rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-sm transition-colors hover:border-zinc-700',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-400">{title}</p>
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600/10 text-amber-500">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold text-zinc-50">{value}</p>
      {(description || trend) && (
        <div className="mt-2 flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                'text-sm font-medium',
                trend.positive ? 'text-emerald-500' : 'text-red-500'
              )}
            >
              {trend.positive ? '+' : ''}
              {trend.value}%
            </span>
          )}
          {description && (
            <span className="text-sm text-zinc-500">{description}</span>
          )}
          {trend?.label && (
            <span className="text-sm text-zinc-500">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  );
}
