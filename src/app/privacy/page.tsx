'use client';

import { MarketingFooter, MarketingNav } from '@/components/marketing/MarketingChrome';
import { useI18n } from '@/i18n/provider';

export default function PrivacyPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <MarketingNav />
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-16 text-zinc-400">
        <h1 className="font-display text-4xl font-bold text-zinc-50">{t.legal.privacyTitle}</h1>
        <p className="leading-relaxed">{t.legal.privacyBody}</p>
      </main>
      <MarketingFooter />
    </div>
  );
}
