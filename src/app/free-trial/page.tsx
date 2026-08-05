import Link from 'next/link';
import { MarketingFooter, MarketingNav } from '@/components/marketing/MarketingChrome';

export default function FreeTrialPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <MarketingNav />
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-4xl font-bold">Start your free trial</h1>
        <p className="mt-4 text-zinc-400">
          14 days of Gearvo Pro modules. Create your company workspace in minutes.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/sign-up"
            className="rounded-lg bg-amber-600 px-6 py-3 font-medium text-white hover:bg-amber-500"
          >
            Create account
          </Link>
          <Link
            href="/welcome/setup"
            className="rounded-lg border border-zinc-700 px-6 py-3 font-medium hover:bg-zinc-900"
          >
            Create company workspace
          </Link>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
