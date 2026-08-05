import { getCustomer } from '@/app/actions/customers';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CustomerFormDialog } from '@/components/customers/CustomerFormDialog';
import { AddVehicleDialog } from '@/components/customers/AddVehicleDialog';
import { Button } from '@/components/ui/button';
import { Pencil, ArrowLeft, Plus } from 'lucide-react';

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  return (
    <div className="space-y-8">
      <Link
        href="/customers"
        className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-amber-500"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Customers
      </Link>
      <PageHeader
        title={customer.fullName}
        description="Customer profile and history"
        actions={
          <CustomerFormDialog
            customer={{
              id: customer.id,
              fullName: customer.fullName,
              phone: customer.phone ?? undefined,
              email: customer.email ?? undefined,
              address: customer.address ?? undefined,
              tags: customer.tags,
              notes: customer.notes ?? undefined,
            }}
            trigger={
              <Button variant="outline">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            }
          />
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-500">
              {formatCurrency(Number(customer.totalSpent))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Outstanding Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-500">
              {formatCurrency(Number(customer.outstandingBalance))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Vehicles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{customer.vehicles.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Repair Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{customer.repairOrders.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {customer.phone && <p>Phone: {customer.phone}</p>}
          {customer.email && <p>Email: {customer.email}</p>}
          {customer.address && <p>Address: {customer.address}</p>}
          {customer.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2">
              {customer.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          {customer.notes && (
            <p className="pt-2 text-sm text-zinc-500">{customer.notes}</p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="vehicles">
        <TabsList>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="repairs">Repairs</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
        <TabsContent value="vehicles" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Vehicles</CardTitle>
              <AddVehicleDialog
                customerId={customer.id}
                trigger={
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add vehicle
                  </Button>
                }
              />
            </CardHeader>
            <CardContent>
              {customer.vehicles.length === 0 ? (
                <p className="text-sm text-zinc-500">No vehicles. Add one to get started.</p>
              ) : (
                <div className="space-y-2">
                  {customer.vehicles.map((v) => (
                    <div
                      key={v.id}
                      className="flex justify-between rounded-lg border border-zinc-800 p-4"
                    >
                      <div>
                        <p className="font-medium">
                          {v.year} {v.make} {v.model}
                        </p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0 text-sm text-zinc-500">
                          {v.color && <span>{v.color}</span>}
                          {v.licensePlate && <span>{v.licensePlate}</span>}
                        </div>
                      </div>
                      <div className="text-right text-sm text-zinc-500">
                        {v.mileage ? `${v.mileage} mi` : '-'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="repairs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Repair Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.repairOrders.length === 0 ? (
                <p className="text-sm text-zinc-500">No repair orders</p>
              ) : (
                <div className="space-y-2">
                  {customer.repairOrders.map((ro) => (
                    <Link
                      key={ro.id}
                      href={`/repair-orders/${ro.id}`}
                      className="flex justify-between rounded-lg border border-zinc-800 p-4 transition-colors hover:bg-zinc-800/50"
                    >
                      <div>
                        <p className="font-medium">{ro.orderNumber}</p>
                        <p className="text-sm text-zinc-500">
                          {ro.vehicle.make} {ro.vehicle.model}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(Number(ro.totalPrice))}
                        </p>
                        <Badge variant="secondary">{ro.status}</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.invoices.length === 0 ? (
                <p className="text-sm text-zinc-500">No invoices</p>
              ) : (
                <div className="space-y-2">
                  {customer.invoices.map((inv) => (
                    <Link
                      key={inv.id}
                      href={`/invoices/${inv.id}`}
                      className="flex justify-between rounded-lg border border-zinc-800 p-4 transition-colors hover:bg-zinc-800/50"
                    >
                      <div>
                        <p className="font-medium">{inv.invoiceNumber}</p>
                        <p className="text-sm text-zinc-500">
                          {formatDate(inv.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(Number(inv.totalAmount))}
                        </p>
                        <Badge
                          variant={
                            inv.status === 'PAID' ? 'success' : 'warning'
                          }
                        >
                          {inv.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.invoices.flatMap((i) => i.payments).length === 0 ? (
                <p className="text-sm text-zinc-500">No payments</p>
              ) : (
                <div className="space-y-2">
                  {customer.invoices.flatMap((inv) =>
                    inv.payments.map((p) => (
                      <div
                        key={p.id}
                        className="flex justify-between rounded-lg border border-zinc-800 p-4"
                      >
                        <div>
                          <p className="font-medium">
                            {formatCurrency(Number(p.amount))}
                          </p>
                          <p className="text-sm text-zinc-500">
                            {formatDate(p.paymentDate)} • {p.method}
                          </p>
                        </div>
                        <p className="text-sm text-zinc-500">
                          Invoice {inv.invoiceNumber}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
