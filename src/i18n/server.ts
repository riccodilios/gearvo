import { cookies } from 'next/headers';
import { unstable_noStore as noStore } from 'next/cache';
import { getDictionary, type Locale } from '@/i18n/dictionaries';

export const LOCALE_COOKIE = 'gearvo-locale';

export async function getLocale(): Promise<Locale> {
  noStore();
  try {
    const jar = await cookies();
    const value = jar.get(LOCALE_COOKIE)?.value;
    if (value === 'ar' || value === 'en') return value;
  } catch {
    // cookies() unavailable in some contexts
  }
  return 'en';
}

export async function getT() {
  noStore();
  return getDictionary(await getLocale());
}
