import * as React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 px-6 py-12 text-center sm:min-h-[360px]',
        className
      )}
      {...props}
    >
      {icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800/60 text-zinc-500">
          {icon}
        </div>
      ) : null}
      <h3 className="font-display text-lg font-semibold text-zinc-100">{title}</h3>
      {description && (
        <p className="mt-2 mb-6 max-w-sm text-sm leading-relaxed text-zinc-400">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
