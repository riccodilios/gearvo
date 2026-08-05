'use client';

import { ClerkProvider } from '@clerk/nextjs';

const appearance = {
  variables: {
    colorPrimary: '#f59e0b',
    colorBackground: '#18181b',
    colorText: '#fafafa',
    colorInputBackground: '#27272a',
    colorInputText: '#fafafa',
  },
  layout: {
    unsafe_disableDevelopmentModeWarnings: true,
  },
  elements: {
    socialButtonsBlockButton: { color: '#fafafa' },
    socialButtonsBlockButtonText: { color: '#fafafa' },
    formFieldInput: { backgroundColor: '#27272a', color: '#fafafa' },
  },
};

/**
 * Wraps children in ClerkProvider when Clerk is configured.
 */
export function ClerkWrapper({
  children,
  useClerk,
}: {
  children: React.ReactNode;
  useClerk: boolean;
}) {
  if (!useClerk) {
    return <>{children}</>;
  }
  return <ClerkProvider appearance={appearance}>{children}</ClerkProvider>;
}
