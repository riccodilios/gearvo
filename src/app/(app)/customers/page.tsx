import { getCustomers } from '@/app/actions/customers';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerFormDialog } from '@/components/customers/CustomerFormDialog';
import { CustomersSearch } from '@/components/customers/CustomersSearch';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 1) || 1;
  const { items: customers, total } = await getCustomers({
    q: params.q,
    page,
    pageSize: 50,
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Customers"
        description={`${total} customers in this branch`}
        actions={
          <CustomerFormDialog
            trigger={
              <Button>
                <Plus className="me-2 h-4 w-4" />
                Add Customer
              </Button>
            }
          />
        }
      />

      <CustomersSearch />

      {customers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title={params.q ? 'No customers found' : 'No customers yet'}
          description={
            params.q
              ? 'Try a different search term'
              : 'Add your first customer to get started'
          }
          action={
            !params.q && (
              <CustomerFormDialog trigger={<Button>Add Customer</Button>} />
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer) => (
            <Link key={customer.id} href={`/customers/${customer.id}`}>
              <Card className="transition-colors hover:border-amber-500/50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{customer.fullName}</h3>
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
                    <span className="text-zinc-500">Spent</span>
                    <span className="font-medium text-amber-500">
                      {formatCurrency(Number(customer.totalSpent))}
                    </span>
                  </div>
                  {Number(customer.outstandingBalance) > 0 && (
                    <div className="mt-1 flex justify-between text-sm">
                      <span className="text-zinc-500">Outstanding</span>
                      <span className="text-red-400">
                        {formatCurrency(Number(customer.outstandingBalance))}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
