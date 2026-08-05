'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SignedIn, SignedOut, useClerk } from '@clerk/nextjs';
import { createShopAndSignIn } from '@/app/actions/tenant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/i18n/provider';

export function CreateShopForm() {
  const { t, locale } = useI18n();
  const { signOut } = useClerk();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set('locale', locale);
      const result = await createShopAndSignIn(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (result?.redirect) {
        router.push(result.redirect);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SignedOut>
        <div className="mt-8 rounded-lg border border-amber-900/50 bg-amber-950/20 p-4 text-sm text-amber-200">
          <p>
            {locale === 'ar'
              ? 'يجب تسجيل الدخول أولاً قبل إنشاء ورشتك.'
              : 'Sign in first, then come back to create your shop.'}
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button asChild className="w-full">
              <Link href="/sign-in">{t.nav.signIn}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/sign-up">{locale === 'ar' ? 'إنشاء حساب' : 'Sign up'}</Link>
            </Button>
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-400">
              {error}
            </div>
          )}
          <input type="hidden" name="locale" value={locale} />
          <div>
            <Label htmlFor="name">{t.onboarding.shopName} *</Label>
            <Input
              id="name"
              name="name"
              placeholder={t.onboarding.shopNamePlaceholder}
              required
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="slug">{t.onboarding.slug}</Label>
            <Input id="slug" name="slug" placeholder="al-noor-auto" className="mt-2" />
            <p className="mt-1 text-xs text-zinc-500">{t.onboarding.slugHint}</p>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t.onboarding.creating : t.onboarding.createShop}
          </Button>
          <button
            type="button"
            className="w-full text-center text-xs text-zinc-500 underline hover:text-zinc-300"
            onClick={() => signOut({ redirectUrl: '/sign-in' })}
          >
            {locale === 'ar' ? 'تسجيل الخروج واستخدام حساب آخر' : 'Sign out and use a different account'}
          </button>
        </form>
      </SignedIn>
    </>
  );
}
