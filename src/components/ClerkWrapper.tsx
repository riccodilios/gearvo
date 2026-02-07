'use client';

import { useState, useEffect } from 'react';
import { ClerkProvider } from '@clerk/nextjs';

const appearance = {
  variables: {
    colorPrimary: '#f59e0b',
    colorBackground: '#18181b',
    colorText: '#fafafa',
  },
};

/**
 * Wraps children in ClerkProvider only on the client after mount.
 * This avoids running any Clerk code during server render, which can throw on some hosts (e.g. Netlify).
 */
export function ClerkWrapper({
  children,
  useClerk,
}: {
  children: React.ReactNode;
  useClerk: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!useClerk || !mounted) {
    return <>{children}</>;
  }
  return <ClerkProvider appearance={appearance}>{children}</ClerkProvider>;
}
