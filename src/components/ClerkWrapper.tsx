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
 * Hard navigations avoid Next.js Server Action / RSC skew on Netlify after Clerk auth changes.
 */
function hardPush(to: string) {
  window.location.assign(to);
}

function hardReplace(to: string) {
  window.location.replace(to);
}

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
  return (
    <ClerkProvider
      appearance={appearance}
      routerPush={hardPush}
      routerReplace={hardReplace}
    >
      {children}
    </ClerkProvider>
  );
}
