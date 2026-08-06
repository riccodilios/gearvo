import * as React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact,
  ...props
}: EmptyStateProps & { compact?: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 px-6 text-center',
        compact
          ? 'min-h-[140px] py-8'
          : 'min-h-[280px] py-12 sm:min-h-[360px]',
        className
      )}
      {...props}
    >
      {icon ? (
        <div
          className={cn(
            'mb-4 flex items-center justify-center rounded-full bg-zinc-800/60 text-zinc-500',
            compact ? 'h-10 w-10' : 'h-12 w-12'
          )}
        >
          {icon}
        </div>
      ) : null}
      <h3
        className={cn(
          'font-display font-semibold text-zinc-100',
          compact ? 'text-base' : 'text-lg'
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            'mt-2 max-w-sm text-sm leading-relaxed text-zinc-400',
            action ? 'mb-6' : 'mb-0'
          )}
        >
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
