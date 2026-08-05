'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'mark' | 'logo';
type Theme = 'dark' | 'light';

const SRC: Record<Variant, Record<Theme, string>> = {
  mark: {
    dark: '/brand/gearvo-mark.svg',
    light: '/brand/gearvo-mark-light.svg',
  },
  logo: {
    dark: '/brand/gearvo-logo.svg',
    light: '/brand/gearvo-logo-light.svg',
  },
};

export function GearvoLogo({
  variant = 'logo',
  theme = 'dark',
  className,
  priority,
}: {
  variant?: Variant;
  theme?: Theme;
  className?: string;
  priority?: boolean;
}) {
  const isMark = variant === 'mark';
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SRC[variant][theme]}
      alt="Gearvo"
      width={isMark ? 40 : 160}
      height={isMark ? 40 : 36}
      className={cn(isMark ? 'h-8 w-8' : 'h-8 w-auto', className)}
      {...(priority ? { fetchPriority: 'high' as const } : {})}
    />
  );
}

/** Inline SVG mark for contexts where next/image is awkward (sidebar, tiny icons). */
export function GearvoMark({ className, title = 'Gearvo' }: { className?: string; title?: string }) {
  const uid = useId().replace(/:/g, '');
  const gradId = `gearvoMarkGrad-${uid}`;
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-8 w-8', className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id={gradId} x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FBBF24" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="#18181B" />
      <path
        d="M46 22.5c-2.8-5.2-8.3-8.7-14.5-8.7C22.2 13.8 15 21 15 32s7.2 18.2 16.5 18.2c6.2 0 11.7-3.5 14.5-8.7"
        stroke={`url(#${gradId})`}
        strokeWidth="5.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="31.5" cy="32" r="7.5" fill={`url(#${gradId})`} />
      <path d="M39 32h10.5" stroke={`url(#${gradId})`} strokeWidth="5.5" strokeLinecap="round" />
    </svg>
  );
}
