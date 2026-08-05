'use client';

import { MarketingFooter, MarketingNav } from '@/components/marketing/MarketingChrome';
import { useI18n } from '@/i18n/provider';

export default function BookDemoPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <MarketingNav />
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="font-display text-4xl font-bold">{t.bookDemo.title}</h1>
        <p className="mt-4 text-zinc-400">{t.bookDemo.body}</p>
        <form className="mt-8 space-y-4" action="mailto:hello@gearvo.app">
          <input
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
            name="company"
            placeholder={t.bookDemo.company}
            required
          />
          <input
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
            name="email"
            type="email"
            placeholder={t.bookDemo.email}
            required
          />
          <input
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
            name="branches"
            placeholder={t.bookDemo.branches}
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-amber-600 py-3 font-medium text-white"
          >
            {t.bookDemo.submit}
          </button>
        </form>
      </main>
      <MarketingFooter />
    </div>
  );
}
