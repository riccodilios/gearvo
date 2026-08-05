'use client';

import Link from 'next/link';
import { SignUp, SignedIn, SignedOut, SignOutButton, useUser } from '@clerk/nextjs';
import { AuthChrome } from '@/components/i18n/AuthChrome';
import { useI18n } from '@/i18n/provider';
import { Button } from '@/components/ui/button';

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

const DEMO_EMAILS = new Set(['demo.owner@gearvo.app', 'demo.manager@gearvo.app']);

function AlreadySignedIn() {
  const { user } = useUser();
  const { locale } = useI18n();
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? '';
  const isDemo = DEMO_EMAILS.has(email);

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
      <p className="text-sm text-zinc-400">
        {locale === 'ar' ? 'أنت مسجّل الدخول حالياً' : 'You are already signed in'}
      </p>
      <p className="mt-1 font-medium text-zinc-100">{email}</p>
      {isDemo && (
        <p className="mt-3 text-sm text-amber-200">
          {locale === 'ar'
            ? 'سجّل الخروج من العرض التجريبي قبل إنشاء حساب جديد.'
            : 'Sign out of the demo before creating a new account.'}
        </p>
      )}
      <div className="mt-6 flex flex-col gap-2">
        <SignOutButton redirectUrl="/sign-up">
          <Button type="button" className="w-full">
            {locale === 'ar' ? 'تسجيل الخروج' : 'Sign out'}
          </Button>
        </SignOutButton>
        <Button asChild variant="outline" className="w-full">
          <Link href={isDemo ? '/demo' : '/dashboard'}>
            {isDemo
              ? locale === 'ar'
                ? 'العودة للعرض'
                : 'Back to demo'
              : locale === 'ar'
                ? 'لوحة التحكم'
                : 'Dashboard'}
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function SignUpClient() {
  const { t, locale } = useI18n();
  return (
    <AuthChrome title={t.auth.signUpTitle}>
      <SignedOut>
        <SignUp
          key={locale}
          appearance={appearance}
          fallbackRedirectUrl="/welcome/setup"
          signInUrl="/sign-in"
        />
      </SignedOut>
      <SignedIn>
        <AlreadySignedIn />
      </SignedIn>
    </AuthChrome>
  );
}
