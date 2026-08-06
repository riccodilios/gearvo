'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useState } from 'react';
import { I18nProvider } from '@/i18n/provider';
import type { Locale } from '@/i18n/dictionaries';
import { Toaster } from 'sonner';

export function Providers({
  children,
  initialLocale = 'en',
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider initialLocale={initialLocale}>
        <TooltipProvider delayDuration={300}>
          {children}
          <Toaster
            theme="dark"
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              classNames: {
                toast: 'border border-zinc-800 bg-zinc-900 text-zinc-50',
              },
            }}
          />
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
