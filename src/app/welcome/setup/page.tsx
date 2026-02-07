import Link from 'next/link';
import { Wrench } from 'lucide-react';
import { CreateShopForm } from './CreateShopForm';
import { isDatabaseConnected } from '@/app/actions/tenant';

// Run on every request so we use runtime DATABASE_URL (e.g. on Netlify), not build-time
export const dynamic = 'force-dynamic';

export default async function SetupPage() {
  const dbConnected = await isDatabaseConnected();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Gearvo</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-zinc-400 hover:text-amber-500"
          >
            Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-16">
        {!dbConnected ? (
          <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-6">
            <h1 className="text-xl font-semibold text-amber-500">
              Connect your database
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              To create your shop and save data, the app needs a PostgreSQL connection.
            </p>
            <div className="mt-4 rounded border border-zinc-700 bg-zinc-900/50 p-4">
              <p className="text-sm font-medium text-zinc-300">Deployed on Netlify?</p>
              <p className="mt-1 text-sm text-zinc-500">
                In Netlify: <strong>Site configuration</strong> → <strong>Environment variables</strong> → add <code className="rounded bg-zinc-800 px-1">DATABASE_URL</code> with your PostgreSQL URL (e.g. from Neon). Use the same value as in your local .env. Then trigger a new deploy (e.g. push a commit or “Clear cache and deploy site”).
              </p>
            </div>
            <p className="mt-4 text-sm text-zinc-400">Local development:</p>
            <ol className="mt-2 list-inside list-decimal space-y-2 text-sm text-zinc-300">
              <li>Use a hosted DB (Neon, Supabase) or local PostgreSQL.</li>
              <li>In your project root, create a <code className="rounded bg-zinc-800 px-1">.env</code> with <code className="rounded bg-zinc-800 px-1">DATABASE_URL=&quot;postgresql://...&quot;</code></li>
              <li>Run <code className="rounded bg-zinc-800 px-1">npx prisma db push</code> and <code className="rounded bg-zinc-800 px-1">npx prisma db seed</code>, then restart the app.</li>
            </ol>
            <div className="mt-6 flex gap-4">
              <Link
                href="/dashboard"
                className="text-sm text-amber-500 hover:underline"
              >
                Continue in demo mode (no data saved)
              </Link>
              <Link
                href="/"
                className="text-sm text-zinc-500 hover:underline"
              >
                Back to home
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold">Create your shop</h1>
            <p className="mt-2 text-zinc-400">
              Each mechanic business gets its own workspace. Your data and metrics are isolated.
            </p>
            <CreateShopForm />
            <p className="mt-6 text-center text-sm text-zinc-500">
              Already have a shop?{' '}
              <Link href="/dashboard" className="text-amber-500 hover:underline">
                Go to dashboard
              </Link>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
