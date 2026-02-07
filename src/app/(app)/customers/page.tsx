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
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const customers = await getCustomers();
  const query = params.q?.toLowerCase() ?? '';
  const filtered = query
    ? customers.filter(
        (c) =>
          c.fullName.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query) ||
          c.phone?.includes(query)
      )
    : customers;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Customers"
        description="Manage your customer database"
        actions={
          <CustomerFormDialog
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            }
          />
        }
      />

      <CustomersSearch />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title={query ? 'No customers found' : 'No customers yet'}
          description={
            query
              ? 'Try a different search term'
              : 'Add your first customer to get started'
          }
          action={
            !query && (
              <CustomerFormDialog
                trigger={<Button>Add Customer</Button>}
              />
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((customer) => (
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
                  </div>
                  {customer.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {customer.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex justify-between border-t border-zinc-800 pt-4">
                    <div>
                      <p className="text-xs text-zinc-500">Total Spent</p>
                      <p className="font-medium text-emerald-500">
                        {formatCurrency(Number(customer.totalSpent))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500">Outstanding</p>
                      <p className="font-medium text-amber-500">
                        {formatCurrency(Number(customer.outstandingBalance))}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">
                    {customer._count.vehicles} vehicles • {customer._count.repairOrders} repairs
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
