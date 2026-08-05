'use client';

import Link from 'next/link';
import { GearvoLogo, GearvoMark } from '@/components/brand/GearvoLogo';
import { LanguageSwitcher, useI18n } from '@/i18n/provider';
import { CreateShopForm } from './CreateShopForm';

export function SetupPageClient({ dbConnected }: { dbConnected: boolean }) {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <GearvoLogo variant="logo" theme="dark" className="hidden h-8 sm:block" />
            <GearvoMark className="h-8 w-8 sm:hidden" />
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/" className="text-sm text-zinc-400 hover:text-amber-500">
              {t.common.back}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-16">
        {!dbConnected ? (
          <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-6">
            <h1 className="text-xl font-semibold text-amber-500">{t.onboarding.connectDbTitle}</h1>
            <p className="mt-2 text-sm text-zinc-400">{t.onboarding.connectDbBody}</p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link href="/dashboard" className="text-sm text-amber-500 hover:underline">
                {t.onboarding.continueDemo}
              </Link>
              <Link href="/" className="text-sm text-zinc-500 hover:underline">
                {t.auth.backHome}
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold">{t.onboarding.setupTitle}</h1>
            <p className="mt-2 text-zinc-400">{t.onboarding.setupSubtitle}</p>
            <CreateShopForm />
            <p className="mt-6 text-center text-sm text-zinc-500">
              {t.onboarding.alreadyHaveShop}{' '}
              <Link href="/welcome" className="text-amber-500 hover:underline">
                {t.onboarding.goDashboard}
              </Link>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
