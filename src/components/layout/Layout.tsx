import { Sidebar } from './Sidebar';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="lg:pl-64">
        <div className="min-h-screen p-4 pt-14 lg:pt-8 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
