'use client';

import { LanguageSwitcher, useI18n } from '@/i18n/provider';
import { GearvoMark } from '@/components/brand/GearvoLogo';

export function AppHeader({
  shopName,
  children,
}: {
  shopName: string | null;
  children?: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <header
      className="sticky top-0 z-20 flex min-h-14 items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-950/95 pe-3 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80 sm:pe-6 lg:px-8"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Reserve space for the fixed hamburger on small screens only */}
      <div className="flex min-w-0 flex-1 items-center gap-2 ps-12 lg:ps-0">
        <GearvoMark className="hidden h-7 w-7 shrink-0 sm:block lg:h-8 lg:w-8" />
        <span className="truncate text-base font-semibold text-zinc-50 sm:text-lg">
          {shopName ?? t.brand}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        {children}
        <LanguageSwitcher />
      </div>
    </header>
  );
}
