/**
 * Presentation-demo isolation constants.
 * Real production accounts must never share this company or these emails.
 */
export const DEMO_COMPANY_SLUG = 'demo-auto';

export const DEMO_EMAILS = [
  'demo.owner@gearvo.app',
  'demo.manager@gearvo.app',
] as const;

const DEMO_EMAIL_SET = new Set<string>(DEMO_EMAILS);

export function isDemoEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return DEMO_EMAIL_SET.has(email.trim().toLowerCase());
}

export function isDemoCompanySlug(slug: string | null | undefined): boolean {
  return slug === DEMO_COMPANY_SLUG;
}
