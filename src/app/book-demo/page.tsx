import Link from 'next/link';
import { MarketingFooter, MarketingNav } from '@/components/marketing/MarketingChrome';

export default function BookDemoPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <MarketingNav />
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-4xl font-bold">Book a demo</h1>
        <p className="mt-4 text-zinc-400">
          See Al-Noor Auto Care — our multi-branch demo — and map Gearvo to your
          operation.
        </p>
        <form className="mt-8 space-y-4" action="mailto:hello@gearvo.app">
          <input
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
            name="company"
            placeholder="Company name"
            required
          />
          <input
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
            name="email"
            type="email"
            placeholder="Work email"
            required
          />
          <input
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
            name="branches"
            placeholder="Number of branches"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-amber-600 py-3 font-medium text-white"
          >
            Request demo
          </button>
        </form>
        <p className="mt-6 text-sm text-zinc-500">
          Prefer self-serve?{' '}
          <Link href="/free-trial" className="text-amber-500">
            Start a free trial
          </Link>
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}
