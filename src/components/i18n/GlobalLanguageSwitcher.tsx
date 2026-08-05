'use client';

import { LanguageSwitcher } from '@/i18n/provider';

/**
 * Always-visible locale control so every route (auth, onboarding, app, marketing)
 * has an Arabic / English switch without depending on page chrome.
 */
export function GlobalLanguageSwitcher() {
  return (
    <div className="pointer-events-none fixed bottom-4 end-4 z-[100] sm:bottom-6 sm:end-6">
      <div className="pointer-events-auto shadow-lg shadow-black/40">
        <LanguageSwitcher />
      </div>
    </div>
  );
}
