'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { LanguageSwitcher, useI18n } from '@/i18n/provider';
import { GearvoLogo, GearvoMark } from '@/components/brand/GearvoLogo';

const ANCHORS = [
  { href: '#product', en: 'Product', ar: 'المنتج' },
  { href: '#features', en: 'Features', ar: 'الميزات' },
  { href: '#pricing', en: 'Pricing', ar: 'الأسعار' },
  { href: '#faq', en: 'FAQ', ar: 'الأسئلة' },
  { href: '/demo', en: 'Demo', ar: 'تجربة' },
];

export function MarketingNav() {
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label={t.brand}>
          <GearvoLogo variant="logo" theme="dark" priority className="hidden h-8 sm:block" />
          <GearvoMark className="h-8 w-8 sm:hidden" />
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-zinc-400 lg:flex">
          {ANCHORS.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-zinc-50">
              {locale === 'ar' ? l.ar : l.en}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <Link
            href="/sign-in"
            className="hidden text-sm text-zinc-400 transition-colors hover:text-zinc-50 md:inline"
          >
            {t.nav.signIn}
          </Link>
          <Link
            href="/free-trial"
            className="rounded-full bg-amber-500 px-3.5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
          >
            {t.nav.freeTrial}
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-zinc-300 hover:bg-zinc-800 lg:hidden"
            aria-label={open ? t.nav.close : t.nav.menu}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1 text-sm">
            {ANCHORS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-2.5 text-zinc-300 hover:bg-zinc-900"
                onClick={() => setOpen(false)}
              >
                {locale === 'ar' ? l.ar : l.en}
              </Link>
            ))}
            <Link
              href="/sign-in"
              className="rounded-lg px-3 py-2.5 text-zinc-300 hover:bg-zinc-900 md:hidden"
              onClick={() => setOpen(false)}
            >
              {t.nav.signIn}
            </Link>
            <Link
              href="/book-demo"
              className="rounded-lg px-3 py-2.5 text-amber-400 hover:bg-zinc-900"
              onClick={() => setOpen(false)}
            >
              {t.nav.bookDemo}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

export function MarketingFooter() {
  const { t, locale } = useI18n();
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <GearvoLogo variant="logo" theme="dark" className="h-8" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-500">
            {locale === 'ar'
              ? 'نظام تشغيل أعمال السيارات لورش السعودية ودول الخليج — متعدد الفروع، ثنائي اللغة، وجاهز للنمو.'
              : 'The automotive business OS for workshops across Saudi Arabia and the GCC — multi-branch, bilingual, built to scale.'}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {locale === 'ar' ? 'المنتج' : 'Product'}
          </p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-zinc-400">
            <Link href="/features" className="hover:text-zinc-50">
              {t.nav.features}
            </Link>
            <Link href="/pricing" className="hover:text-zinc-50">
              {t.nav.pricing}
            </Link>
            <Link href="/demo" className="hover:text-zinc-50">
              {locale === 'ar' ? 'البيئة التجريبية' : 'Live demo'}
            </Link>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {locale === 'ar' ? 'الشركة' : 'Company'}
          </p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-zinc-400">
            <Link href="/about" className="hover:text-zinc-50">
              {t.nav.about}
            </Link>
            <Link href="/contact" className="hover:text-zinc-50">
              {t.nav.contact}
            </Link>
            <Link href="/privacy" className="hover:text-zinc-50">
              {t.footer.privacy}
            </Link>
            <Link href="/terms" className="hover:text-zinc-50">
              {t.footer.terms}
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-zinc-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Gearvo. {locale === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
          <p>{locale === 'ar' ? 'صُمم لورش المملكة ودول الخليج.' : 'Built for workshops in KSA & the GCC.'}</p>
        </div>
      </div>
    </footer>
  );
}
