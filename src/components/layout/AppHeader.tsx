import { Wrench } from 'lucide-react';

export function AppHeader({ shopName }: { shopName: string | null }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center border-b border-zinc-800 bg-zinc-950/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600">
          <Wrench className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-semibold text-zinc-50">
          {shopName ?? 'Gearvo'}
        </span>
      </div>
    </header>
  );
}
