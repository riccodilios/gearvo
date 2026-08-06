import { Suspense } from 'react';
import { getCustomerHistory, getCustomerProfile } from '@/app/actions/customers';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/lib/utils';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CustomerFormDialog } from '@/components/customers/CustomerFormDialog';
import { AddVehicleDialog } from '@/components/customers/AddVehicleDialog';
import { RepairOrderFormDialog } from '@/components/repair-orders/RepairOrderFormDialog';
import { Button } from '@/components/ui/button';
import { Pencil, ArrowLeft, Plus, Car, Wrench, FileText, CreditCard } from 'lucide-react';
import { PendingLink } from '@/components/ui/pending-link';
import { DetailTabsSkeleton } from '@/components/skeletons/PageSkeletons';
import { AppLabel, Ui } from '@/i18n/T';

async function CustomerHistoryTabs({ customerId }: { customerId: string }) {
  const history = await getCustomerHistory(customerId);
  if (!history) return null;

  const { vehicles, repairOrders, invoices, payments } = history;

  return (
    <Tabs defaultValue="vehicles">
      <TabsList>
        <TabsTrigger value="vehicles"><Ui k="vehicles" /></TabsTrigger>
        <TabsTrigger value="repairs"><AppLabel k="repairOrders" /></TabsTrigger>
        <TabsTrigger value="invoices"><AppLabel k="invoices" /></TabsTrigger>
        <TabsTrigger value="payments"><Ui k="paymentHistory" /></TabsTrigger>
      </TabsList>
      <TabsContent value="vehicles" className="mt-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle><Ui k="vehicles" /></CardTitle>
            <AddVehicleDialog
              customerId={customerId}
              trigger={
                <Button size="sm" className="touch-manipulation">
                  <Plus className="me-2 h-4 w-4" />
                  <Ui k="addVehicle" />
                </Button>
              }
            />
          </CardHeader>
          <CardContent>
            {vehicles.length === 0 ? (
              <EmptyState
                compact
                icon={<Car className="h-5 w-5" />}
                title={<Ui k="noVehiclesYet" />}
                description={<Ui k="addVehicleHint" />}
                action={
                  <AddVehicleDialog
                    customerId={customerId}
                    trigger={<Button size="sm"><Ui k="addVehicle" /></Button>}
                  />
                }
              />
            ) : (
              <div className="space-y-2">
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="flex justify-between gap-3 rounded-xl border border-zinc-800 p-4"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {v.year} {v.make} {v.model}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0 text-sm text-zinc-500">
                        {v.color && <span>{v.color}</span>}
                        {v.licensePlate && <span>{v.licensePlate}</span>}
                      </div>
                    </div>
                    <div className="shrink-0 text-end text-sm text-zinc-500">
                      {v.mileage != null ? `${v.mileage.toLocaleString()} km` : '—'}
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle><AppLabel k="repairOrders" /></CardTitle>
            <RepairOrderFormDialog
              defaultCustomerId={customerId}
              trigger={
                <Button size="sm" className="touch-manipulation">
                  <Plus className="me-2 h-4 w-4" />
                  <Ui k="newOrder" />
                </Button>
              }
            />
          </CardHeader>
          <CardContent>
            {repairOrders.length === 0 ? (
              <EmptyState
                compact
                icon={<Wrench className="h-5 w-5" />}
                title={<Ui k="noRepairOrdersCustomer" />}
                description={<Ui k="noRepairOrdersCustomerHint" />}
                action={
                  <RepairOrderFormDialog
                    defaultCustomerId={customerId}
                    trigger={<Button size="sm"><Ui k="newRepairOrder" /></Button>}
                  />
                }
              />
            ) : (
              <div className="space-y-2">
                {repairOrders.map((ro) => (
                  <PendingLink
                    key={ro.id}
                    href={`/repair-orders/${ro.id}`}
                    className="flex justify-between gap-3 rounded-xl border border-zinc-800 p-4 transition-colors hover:bg-zinc-800/50 active:scale-[0.99]"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{ro.orderNumber}</p>
                      <p className="truncate text-sm text-zinc-500">
                        {ro.vehicle.make} {ro.vehicle.model}
                      </p>
                    </div>
                    <div className="shrink-0 text-end">
                      <p className="font-medium tabular-nums">
                        {formatCurrency(Number(ro.totalPrice))}
                      </p>
                      <Badge variant="secondary">{ro.status}</Badge>
                    </div>
                  </PendingLink>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="invoices" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle><AppLabel k="invoices" /></CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <EmptyState
                compact
                icon={<FileText className="h-5 w-5" />}
                title={<Ui k="noInvoices" />}
                description={<Ui k="noInvoicesHint" />}
                action={
                  <Button asChild size="sm" variant="outline">
                    <Link href="/repair-orders"><Ui k="viewRepairOrders" /></Link>
                  </Button>
                }
              />
            ) : (
              <div className="space-y-2">
                {invoices.map((inv) => (
                  <PendingLink
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className="flex justify-between gap-3 rounded-xl border border-zinc-800 p-4 transition-colors hover:bg-zinc-800/50 active:scale-[0.99]"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{inv.invoiceNumber}</p>
                      <p className="text-sm text-zinc-500">{formatDate(inv.createdAt)}</p>
                    </div>
                    <div className="shrink-0 text-end">
                      <p className="font-medium tabular-nums">
                        {formatCurrency(Number(inv.totalAmount))}
                      </p>
                      <Badge variant={inv.status === 'PAID' ? 'success' : 'warning'}>
                        {inv.status}
                      </Badge>
                    </div>
                  </PendingLink>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="payments" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle><Ui k="paymentHistory" /></CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <EmptyState
                compact
                icon={<CreditCard className="h-5 w-5" />}
                title={<Ui k="noPaymentsYet" />}
                description={<Ui k="noPaymentsHint" />}
              />
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between gap-3 rounded-xl border border-zinc-800 p-4"
                  >
                    <div className="min-w-0">
                      <p className="font-medium tabular-nums">
                        {formatCurrency(Number(p.amount))}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {formatDate(p.paymentDate)} · {p.method}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm text-zinc-500">
                      <Ui k="invoiceLabel" /> {p.invoice.invoiceNumber}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomerProfile(id);
  if (!customer) notFound();

  return (
    <div className="space-y-6 sm:space-y-8">
      <PendingLink
        href="/customers"
        className="inline-flex min-h-10 items-center gap-2 text-sm text-zinc-400 hover:text-amber-500"
      >
        <ArrowLeft className="h-4 w-4" />
        <Ui k="backToCustomers" />
      </PendingLink>
      <PageHeader
        title={customer.fullName}
        description={<Ui k="customerProfileDesc" />}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <RepairOrderFormDialog
              defaultCustomerId={customer.id}
              trigger={
                <Button className="w-full touch-manipulation sm:w-auto">
                  <Plus className="me-2 h-4 w-4" />
                  <Ui k="newRepairOrder" />
                </Button>
              }
            />
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
                <Button variant="outline" className="w-full touch-manipulation sm:w-auto">
                  <Pencil className="me-2 h-4 w-4" />
                  <AppLabel k="edit" />
                </Button>
              }
            />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400"><Ui k="totalSpent" /></CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold tabular-nums text-emerald-500 sm:text-2xl">
              {formatCurrency(Number(customer.totalSpent))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              <Ui k="outstanding" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold tabular-nums text-amber-500 sm:text-2xl">
              {formatCurrency(Number(customer.outstandingBalance))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400"><Ui k="vehicles" /></CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold sm:text-2xl">{customer._count.vehicles}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400"><AppLabel k="repairOrders" /></CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold sm:text-2xl">{customer._count.repairOrders}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle><Ui k="contactInfo" /></CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {customer.phone && (
            <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
              <span className="w-20 shrink-0 text-zinc-500"><Ui k="phone" /></span>
              <a href={`tel:${customer.phone}`} className="font-medium text-amber-500 hover:underline">
                {customer.phone}
              </a>
            </div>
          )}
          {customer.email && (
            <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
              <span className="w-20 shrink-0 text-zinc-500"><Ui k="email" /></span>
              <a
                href={`mailto:${customer.email}`}
                className="break-all font-medium text-amber-500 hover:underline"
              >
                {customer.email}
              </a>
            </div>
          )}
          {customer.address && (
            <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
              <span className="w-20 shrink-0 text-zinc-500"><Ui k="address" /></span>
              <span className="text-zinc-200">{customer.address}</span>
            </div>
          )}
          {!customer.phone && !customer.email && !customer.address && (
            <p className="text-zinc-500"><Ui k="noContactDetails" /></p>
          )}
          {customer.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {customer.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          {customer.notes && (
            <p className="border-t border-zinc-800 pt-3 text-zinc-400">{customer.notes}</p>
          )}
        </CardContent>
      </Card>

      <Suspense fallback={<DetailTabsSkeleton />}>
        <CustomerHistoryTabs customerId={customer.id} />
      </Suspense>
    </div>
  );
}
