'use client';

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { getDictionary, type Locale } from '@/i18n/dictionaries';

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: ReturnType<typeof getDictionary>;
  dir: 'ltr' | 'rtl';
};

const I18nContext = createContext<I18nContextValue | null>(null);
const listeners = new Set<() => void>();

function detectDefaultLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem('gearvo-locale');
  if (saved === 'ar' || saved === 'en') return saved;
  const nav = window.navigator.language?.toLowerCase() ?? '';
  return nav.startsWith('ar') ? 'ar' : 'en';
}

function getStoredLocale(): Locale {
  return detectDefaultLocale();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function emit() {
  listeners.forEach((l) => l());
}

function applyDocumentLocale(locale: Locale) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.classList.toggle('locale-ar', locale === 'ar');
  try {
    document.cookie = `gearvo-locale=${locale};path=/;max-age=31536000;samesite=lax`;
  } catch {
    // ignore
  }
}

export function I18nProvider({
  children,
  initialLocale = 'en',
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const locale = useSyncExternalStore(
    subscribe,
    getStoredLocale,
    () => initialLocale
  );

  useEffect(() => {
    applyDocumentLocale(locale);
  }, [locale]);

  const setLocale = (l: Locale) => {
    window.localStorage.setItem('gearvo-locale', l);
    applyDocumentLocale(l);
    emit();
  };

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t: getDictionary(locale),
        dir: locale === 'ar' ? 'rtl' : 'ltr',
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export function LanguageSwitcher({ className }: { className?: string } = {}) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className={`flex gap-0.5 rounded-full border border-zinc-800/80 bg-zinc-900/80 p-0.5 text-[10px] backdrop-blur sm:gap-1 sm:rounded-lg sm:p-1 sm:text-xs ${className ?? ''}`}
      role="group"
      aria-label={t.common.language}
    >
      <button
        type="button"
        className={`rounded-full px-1.5 py-1 font-medium touch-manipulation sm:rounded sm:px-2.5 sm:py-1.5 ${locale === 'en' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
        onClick={() => setLocale('en')}
      >
        EN
      </button>
      <button
        type="button"
        className={`rounded-full px-1.5 py-1 font-medium touch-manipulation sm:rounded sm:px-2.5 sm:py-1.5 ${locale === 'ar' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
        onClick={() => setLocale('ar')}
      >
        ع
      </button>
    </div>
  );
}
