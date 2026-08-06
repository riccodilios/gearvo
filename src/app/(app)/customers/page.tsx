import { getCustomers } from '@/app/actions/customers';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerFormDialog } from '@/components/customers/CustomerFormDialog';
import { CustomersSearch } from '@/components/customers/CustomersSearch';
import { PendingLink } from '@/components/ui/pending-link';
import { CustomersFilterShell } from '@/components/customers/CustomersFilterShell';
import { AppLabel, Ui } from '@/i18n/T';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 1) || 1;
  const result = await getCustomers({
    q: params.q,
    page,
    pageSize: 50,
  });
  const { items: customers, total } = result;

  return (
    <CustomersFilterShell>
      <PageHeader
        title={<AppLabel k="customers" />}
        description={<Ui k="customersInBranch" vars={{ count: total }} />}
        actions={
          <CustomerFormDialog
            trigger={
              <Button>
                <Plus className="me-2 h-4 w-4" />
                <Ui k="addCustomer" />
              </Button>
            }
          />
        }
      />

      <CustomersSearch />

      {customers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title={params.q ? <Ui k="noCustomersFound" /> : <Ui k="noCustomersYet" />}
          description={params.q ? <Ui k="tryDifferentSearch" /> : <Ui k="addFirstCustomer" />}
          action={
            !params.q && (
              <CustomerFormDialog trigger={<Button><Ui k="addCustomer" /></Button>} />
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer) => (
            <PendingLink key={customer.id} href={`/customers/${customer.id}`}>
              <Card className="transition-colors hover:border-amber-500/50 active:scale-[0.99]">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{customer.fullName}</h3>
                      {customer.phone && (
                        <p className="text-sm text-zinc-500">{customer.phone}</p>
                      )}
                      {customer.email && (
                        <p className="text-sm text-zinc-500">{customer.email}</p>
                      )}
                    </div>
                    {customer.tags?.[0] && (
                      <Badge variant="secondary">{customer.tags[0]}</Badge>
                    )}
                  </div>
                  <div className="mt-4 flex justify-between text-sm">
                    <span className="text-zinc-500"><Ui k="spent" /></span>
                    <span className="font-medium text-amber-500">
                      {formatCurrency(Number(customer.totalSpent))}
                    </span>
                  </div>
                  {Number(customer.outstandingBalance) > 0 && (
                    <div className="mt-1 flex justify-between text-sm">
                      <span className="text-zinc-500"><Ui k="outstanding" /></span>
                      <span className="text-red-400">
                        {formatCurrency(Number(customer.outstandingBalance))}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </PendingLink>
          ))}
        </div>
      )}
    </CustomersFilterShell>
  );
}
