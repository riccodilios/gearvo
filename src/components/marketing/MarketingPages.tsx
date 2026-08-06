'use client';

import Link from 'next/link';
import { MarketingFooter, MarketingNav } from '@/components/marketing/MarketingChrome';
import { useI18n } from '@/i18n/provider';

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-50">
      <MarketingNav />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <h1 className="font-display mb-6 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}

export function FeaturesContent() {
  const { t } = useI18n();
  const p = t.pages.features;
  return (
    <Shell title={p.title}>
      <p className="mb-10 max-w-2xl text-lg leading-relaxed text-zinc-400">{p.intro}</p>
      <div className="grid gap-6 sm:grid-cols-2">
        {p.items.map((item) => (
          <div key={item.title} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
            <h2 className="text-xl font-semibold text-amber-500">{item.title}</h2>
            <p className="mt-2 leading-relaxed text-zinc-400">{item.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-12">
        <Link
          href="/free-trial"
          className="inline-block rounded-lg bg-amber-600 px-5 py-3 font-medium text-white hover:bg-amber-500"
        >
          {t.nav.freeTrial}
        </Link>
      </div>
    </Shell>
  );
}

export function PricingContent() {
  const { t } = useI18n();
  const p = t.pages.pricing;
  return (
    <Shell title={p.title}>
      <p className="mb-10 max-w-2xl text-zinc-400">{p.intro}</p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {p.plans.map((plan) => (
          <div
            key={plan.name}
            className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6"
          >
            <h2 className="text-lg font-semibold">{plan.name}</h2>
            <p className="mt-2 text-2xl font-bold text-amber-500">{plan.price}</p>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-400">{plan.desc}</p>
            <Link
              href={plan.cta}
              className="mt-6 rounded-lg bg-zinc-100 px-3 py-2 text-center text-sm font-medium text-zinc-900 hover:bg-white"
            >
              {p.choose} {plan.name}
            </Link>
          </div>
        ))}
      </div>
    </Shell>
  );
}

export function AboutContent() {
  const { t } = useI18n();
  return (
    <Shell title={t.pages.about.title}>
      <p className="max-w-2xl text-lg leading-relaxed text-zinc-400">{t.pages.about.body}</p>
    </Shell>
  );
}

export function ContactContent() {
  const { t } = useI18n();
  return (
    <Shell title={t.pages.contact.title}>
      <p className="max-w-2xl text-lg leading-relaxed text-zinc-400">{t.pages.contact.body}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/book-demo"
          className="inline-block rounded-lg bg-amber-600 px-5 py-3 font-medium text-white hover:bg-amber-500"
        >
          {t.nav.bookDemo}
        </Link>
        <Link
          href="/free-trial"
          className="inline-block rounded-lg border border-zinc-700 px-5 py-3 font-medium text-zinc-200 hover:bg-zinc-900"
        >
          {t.nav.freeTrial}
        </Link>
      </div>
    </Shell>
  );
}

export function FaqContent() {
  const { t } = useI18n();
  const p = t.pages.faq;
  return (
    <Shell title={p.title}>
      <div className="mx-auto max-w-3xl space-y-6">
        {p.items.map((item) => (
          <div key={item.q} className="border-b border-zinc-800 pb-6">
            <h2 className="text-lg font-semibold text-zinc-100">{item.q}</h2>
            <p className="mt-2 leading-relaxed text-zinc-400">{item.a}</p>
          </div>
        ))}
      </div>
    </Shell>
  );
}
