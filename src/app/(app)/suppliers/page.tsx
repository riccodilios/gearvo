import { getSuppliers } from '@/app/actions/suppliers';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SupplierFormDialog } from '@/components/suppliers/SupplierFormDialog';
import { SupplierCard } from '@/components/suppliers/SupplierCard';
import { SuppliersSearch } from '@/components/suppliers/SuppliersSearch';
import { AppLabel, Ui } from '@/i18n/T';

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q ?? '';
  const { items: suppliers } = await getSuppliers({ q: query });
  const filtered = suppliers;

  return (
    <div className="space-y-8">
      <PageHeader
        title={<AppLabel k="suppliers" />}
        description={<Ui k="suppliersDesc" />}
        actions={
          <SupplierFormDialog
            trigger={
              <Button>
                <Plus className="me-2 h-4 w-4" />
                <Ui k="addSupplier" />
              </Button>
            }
          />
        }
      />

      <SuppliersSearch />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title={query ? <Ui k="noSuppliersFound" /> : <Ui k="noSuppliersYet" />}
          description={
            query ? <Ui k="tryDifferentSearch" /> : <Ui k="addFirstSupplier" />
          }
          action={
            !query && (
              <SupplierFormDialog trigger={<Button><Ui k="addSupplier" /></Button>} />
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((supplier) => (
            <SupplierCard
              key={supplier.id}
              supplier={{
                id: supplier.id,
                name: supplier.name,
                contactPerson: supplier.contactPerson ?? undefined,
                phone: supplier.phone ?? undefined,
                email: supplier.email ?? undefined,
                address: supplier.address ?? undefined,
                notes: supplier.notes ?? undefined,
                _count: supplier._count,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
