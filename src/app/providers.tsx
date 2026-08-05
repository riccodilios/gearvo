'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useState } from 'react';
import { I18nProvider } from '@/i18n/provider';
import { GlobalLanguageSwitcher } from '@/components/i18n/GlobalLanguageSwitcher';

export function Providers({ children }: { children: React.ReactNode }) {
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
      <I18nProvider>
        <TooltipProvider delayDuration={300}>
          {children}
          <GlobalLanguageSwitcher />
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
