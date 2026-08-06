import { getRepairOrders } from '@/app/actions/repair-orders';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Wrench, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PendingLink } from '@/components/ui/pending-link';
import { EntityFilterShell } from '@/components/ui/EntityFilterShell';
import { RepairOrderFormDialog } from '@/components/repair-orders/RepairOrderFormDialog';
import { RepairOrderStatusSelect } from '@/components/repair-orders/RepairOrderStatusSelect';
import { GenerateInvoiceButton } from '@/components/repair-orders/GenerateInvoiceButton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RepairOrdersFilter } from '@/components/repair-orders/RepairOrdersFilter';
import { RepairOrdersSearch } from '@/components/repair-orders/RepairOrdersSearch';
import { AppLabel, Ui } from '@/i18n/T';

export default async function RepairOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? 'all';
  const query = params.q?.toLowerCase() ?? '';
  const { items: orders } = await getRepairOrders({ status });
  const filtered = query
    ? orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(query) ||
          o.customer.fullName.toLowerCase().includes(query) ||
          o.description?.toLowerCase().includes(query) ||
          o.vehicle.make.toLowerCase().includes(query) ||
          o.vehicle.model.toLowerCase().includes(query)
      )
    : orders;

  return (
    <EntityFilterShell>
      <PageHeader
        title={<AppLabel k="repairOrders" />}
        description={<Ui k="repairOrdersDesc" />}
        actions={
          <RepairOrderFormDialog
            trigger={
              <Button>
                <Plus className="me-2 h-4 w-4" />
                <Ui k="newRepairOrder" />
              </Button>
            }
          />
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <RepairOrdersSearch />
        <RepairOrdersFilter />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Wrench className="h-6 w-6" />}
          title={query || status !== 'all' ? <Ui k="noMatchingOrders" /> : <Ui k="noRepairOrders" />}
          description={
            query || status !== 'all' ? <Ui k="tryClearFilters" /> : <Ui k="createFirstRepairOrder" />
          }
          action={
            !query && status === 'all' ? (
              <RepairOrderFormDialog trigger={<Button><Ui k="newRepairOrder" /></Button>} />
            ) : (
              <Button asChild variant="outline">
                <Link href="/repair-orders"><Ui k="clearFilters" /></Link>
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filtered.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <PendingLink
                      href={`/repair-orders/${order.id}`}
                      className="text-base font-semibold text-amber-500"
                    >
                      {order.orderNumber}
                    </PendingLink>
                    <p className="mt-0.5 truncate text-sm text-zinc-300">
                      {order.customer.fullName}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {order.vehicle.year} {order.vehicle.make} {order.vehicle.model}
                    </p>
                  </div>
                  <div className="shrink-0 text-end">
                    <p className="font-semibold tabular-nums">
                      {formatCurrency(Number(order.totalPrice))}
                    </p>
                    <p className="text-xs text-emerald-500 tabular-nums">
                      {formatCurrency(Number(order.profit))}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <RepairOrderStatusSelect
                    orderId={order.id}
                    currentStatus={order.status}
                  />
                  <GenerateInvoiceButton
                    repairOrderId={order.id}
                    hasInvoice={!!order.invoice}
                  />
                </div>
              </div>
            ))}
          </div>

          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><Ui k="colOrder" /></TableHead>
                    <TableHead><Ui k="colCustomer" /></TableHead>
                    <TableHead><Ui k="colVehicle" /></TableHead>
                    <TableHead><Ui k="colStatus" /></TableHead>
                    <TableHead className="text-right"><Ui k="colTotal" /></TableHead>
                    <TableHead className="text-right"><Ui k="colProfit" /></TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <PendingLink
                          href={`/repair-orders/${order.id}`}
                          className="text-amber-500 hover:underline"
                        >
                          {order.orderNumber}
                        </PendingLink>
                      </TableCell>
                      <TableCell>{order.customer.fullName}</TableCell>
                      <TableCell>
                        {order.vehicle.year} {order.vehicle.make}{' '}
                        {order.vehicle.model}
                      </TableCell>
                      <TableCell>
                        <RepairOrderStatusSelect
                          orderId={order.id}
                          currentStatus={order.status}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(order.totalPrice))}
                      </TableCell>
                      <TableCell className="text-right text-emerald-500">
                        {formatCurrency(Number(order.profit))}
                      </TableCell>
                      <TableCell>
                        <GenerateInvoiceButton
                          repairOrderId={order.id}
                          hasInvoice={!!order.invoice}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </EntityFilterShell>
  );
}
