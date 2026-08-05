'use client';

import Link from 'next/link';
import { GearvoLogo, GearvoMark } from '@/components/brand/GearvoLogo';
import { LanguageSwitcher, useI18n } from '@/i18n/provider';

export function AuthChrome({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-50">
      <header className="flex h-16 items-center justify-between border-b border-zinc-800 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <GearvoLogo variant="logo" theme="dark" className="hidden h-8 sm:block" />
          <GearvoMark className="h-8 w-8 sm:hidden" />
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link href="/" className="text-sm text-zinc-400 hover:text-amber-500">
            {t.auth.backHome}
          </Link>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t.auth.subtitle}</p>
        </div>
        {children}
      </main>
    </div>
  );
}
