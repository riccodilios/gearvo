'use client';

import Link from 'next/link';
import { SignIn, SignedIn, SignedOut, SignOutButton, useUser } from '@clerk/nextjs';
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
  const { t, locale } = useI18n();
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? '';
  const isDemo = DEMO_EMAILS.has(email);

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
      <p className="text-sm text-zinc-400">
        {locale === 'ar' ? 'أنت مسجّل الدخول حالياً كـ' : 'You are currently signed in as'}
      </p>
      <p className="mt-1 font-medium text-zinc-100">{email || user?.fullName}</p>
      {isDemo && (
        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {locale === 'ar'
            ? 'هذه جلسة العرض التجريبي (النور). سجّل الخروج قبل استخدام حسابك الحقيقي.'
            : 'This is the Al-Noor demo session. Sign out before using your real account.'}
        </p>
      )}
      <div className="mt-6 flex flex-col gap-2">
        <SignOutButton redirectUrl="/sign-in">
          <Button type="button" className="w-full">
            {locale === 'ar' ? 'تسجيل الخروج ثم تسجيل الدخول' : 'Sign out, then sign in'}
          </Button>
        </SignOutButton>
        {!isDemo && (
          <Button asChild variant="outline" className="w-full">
            <Link href="/welcome">{t.onboarding.goDashboard}</Link>
          </Button>
        )}
        {isDemo && (
          <Button asChild variant="outline" className="w-full">
            <Link href="/demo">{locale === 'ar' ? 'العودة لصفحة العرض' : 'Back to demo page'}</Link>
          </Button>
        )}
        <Button asChild variant="ghost" className="w-full">
          <Link href="/welcome/setup">
            {locale === 'ar' ? 'إنشاء شركتك الخاصة' : 'Create your own company'}
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function SignInClient() {
  const { t, locale } = useI18n();
  return (
    <AuthChrome title={t.auth.signInTitle}>
      <SignedOut>
        <SignIn
          key={locale}
          appearance={appearance}
          fallbackRedirectUrl="/welcome"
          signUpUrl="/sign-up"
        />
      </SignedOut>
      <SignedIn>
        <AlreadySignedIn />
      </SignedIn>
    </AuthChrome>
  );
}
