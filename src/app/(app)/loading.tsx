export default function AppLoading() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="fixed inset-y-0 left-0 z-40 w-64 border-r border-zinc-800 bg-zinc-950" />
      <main className="lg:pl-64">
        <div className="p-4 pt-14 lg:pt-8 lg:p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 rounded bg-zinc-800" />
            <div className="h-4 w-72 rounded bg-zinc-800/80" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded-lg bg-zinc-800/60" />
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="h-64 rounded-lg bg-zinc-800/60 lg:col-span-2" />
              <div className="h-64 rounded-lg bg-zinc-800/60" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
