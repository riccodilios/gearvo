import { Sidebar } from './Sidebar';

export default function Layout({
  children,
  shopName,
}: {
  children: React.ReactNode;
  shopName?: string | null;
}) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar shopName={shopName} />
      <main className="lg:pl-64">
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
