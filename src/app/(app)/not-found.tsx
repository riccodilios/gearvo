import Link from 'next/link';
import { GearvoMark } from '@/components/brand/GearvoLogo';
import { Button } from '@/components/ui/button';

export default function AppNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <GearvoMark className="mb-4 h-12 w-12" />
      <h1 className="text-xl font-semibold text-zinc-50">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-zinc-400">
        This record may have been removed, or you might not have access to it.
      </p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
