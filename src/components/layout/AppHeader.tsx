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
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-950/95 ps-14 pe-4 backdrop-blur sm:ps-16 sm:pe-6 lg:ps-8 lg:pe-8">
      <div className="flex min-w-0 items-center gap-2">
        <GearvoMark className="h-8 w-8 shrink-0" />
        <span className="truncate text-lg font-semibold text-zinc-50">
          {shopName ?? t.brand}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {children}
        <LanguageSwitcher />
      </div>
    </header>
  );
}
