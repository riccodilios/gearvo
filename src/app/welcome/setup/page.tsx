import Link from 'next/link';
import { Wrench } from 'lucide-react';
import { CreateShopForm } from './CreateShopForm';
import { isDatabaseConnected } from '@/app/actions/tenant';

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
              To create your shop and save data, you need a PostgreSQL database.
            </p>
            <ol className="mt-6 list-inside list-decimal space-y-2 text-sm text-zinc-300">
              <li>Install PostgreSQL or use a hosted service (e.g. Vercel Postgres, Supabase, Neon).</li>
              <li>Create a database and copy the connection URL.</li>
              <li>In your project root, create a <code className="rounded bg-zinc-800 px-1">.env</code> file with:
                <pre className="mt-2 overflow-x-auto rounded bg-zinc-900 p-3 text-xs">
                  DATABASE_URL=&quot;postgresql://user:password@host:5432/dbname&quot;
                </pre>
              </li>
              <li>Run in terminal:
                <pre className="mt-2 overflow-x-auto rounded bg-zinc-900 p-3 text-xs">
                  npx prisma db push{'\n'}
                  npx prisma db seed
                </pre>
              </li>
              <li>Restart the app and return to this page.</li>
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
