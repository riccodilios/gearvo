'use client';

import { useI18n } from '@/i18n/provider';
import type { Dictionary } from '@/i18n/dictionaries';

function applyVars(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{${key}}`, String(value));
  }
  return out;
}

/** Client UI string — updates instantly when language toggles. */
export function Ui({
  k,
  vars,
}: {
  k: keyof Dictionary['ui'];
  vars?: Record<string, string | number>;
}) {
  const { t } = useI18n();
  return <>{applyVars(String(t.ui[k]), vars)}</>;
}

export function AppLabel({
  k,
}: {
  k: keyof Dictionary['app'];
}) {
  const { t } = useI18n();
  return <>{t.app[k]}</>;
}

export function CommonLabel({
  k,
}: {
  k: keyof Dictionary['common'];
}) {
  const { t } = useI18n();
  return <>{t.common[k]}</>;
}
