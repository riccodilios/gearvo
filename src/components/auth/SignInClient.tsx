'use client';

import { SignIn } from '@clerk/nextjs';
import { AuthChrome } from '@/components/i18n/AuthChrome';
import { useI18n } from '@/i18n/provider';

const appearance = {
  variables: {
    colorPrimary: '#f59e0b',
    colorBackground: '#18181b',
    colorText: '#fafafa',
    colorInputBackground: '#27272a',
    colorInputText: '#fafafa',
  },
  layout: { unsafe_disableDevelopmentModeWarnings: true },
  elements: {
    socialButtonsBlockButton: { color: '#fafafa' },
    socialButtonsBlockButtonText: { color: '#fafafa' },
    formFieldInput: { backgroundColor: '#27272a', color: '#fafafa' },
  },
};

export function SignInClient() {
  const { t, locale } = useI18n();
  return (
    <AuthChrome title={t.auth.signInTitle}>
      <SignIn
        key={locale}
        appearance={appearance}
        afterSignInUrl="/dashboard"
        signUpUrl="/sign-up"
      />
    </AuthChrome>
  );
}
