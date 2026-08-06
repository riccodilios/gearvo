'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  useEffect,
  useState,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

type PendingLinkProps = ComponentProps<typeof Link> & {
  children: ReactNode;
  pendingClassName?: string;
};

/**
 * Link that acknowledges clicks immediately with opacity while the soft navigation runs.
 */
export function PendingLink({
  className,
  pendingClassName,
  children,
  onClick,
  href,
  ...props
}: PendingLinkProps) {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setPending(false);
  }, [pathname]);

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const target = typeof href === 'string' ? href : href.pathname || '';
    if (target && (target === pathname || target.startsWith(`${pathname}?`))) return;
    setPending(true);
  };

  return (
    <Link
      href={href}
      prefetch
      className={cn(
        className,
        'transition-opacity duration-150',
        pending && (pendingClassName || 'opacity-55')
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
}
