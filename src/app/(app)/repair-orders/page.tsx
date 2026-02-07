import { getRepairOrders } from '@/app/actions/repair-orders';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Wrench, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RepairOrderFormDialog } from '@/components/repair-orders/RepairOrderFormDialog';
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

export default async function RepairOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? 'all';
  const query = params.q?.toLowerCase() ?? '';
  const orders = await getRepairOrders(status);
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
    <div className="space-y-8">
      <PageHeader
        title="Repair Orders"
        description="Manage repair jobs and track progress"
        actions={
          <RepairOrderFormDialog
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Repair Order
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
          title="No repair orders"
          description="Create your first repair order to get started"
          action={
            <RepairOrderFormDialog trigger={<Button>New Repair Order</Button>} />
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>{order.customer.fullName}</TableCell>
                    <TableCell>
                      {order.vehicle.year} {order.vehicle.make}{' '}
                      {order.vehicle.model}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(order.totalPrice))}
                    </TableCell>
                    <TableCell className="text-right text-emerald-500">
                      {formatCurrency(Number(order.profit))}
                    </TableCell>
                    <TableCell>
                      {(order.status === 'COMPLETED' || order.status === 'DELIVERED') && (
                        <GenerateInvoiceButton
                          repairOrderId={order.id}
                          hasInvoice={!!order.invoice}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    'default' | 'secondary' | 'success' | 'warning'
  > = {
    PENDING: 'secondary',
    IN_PROGRESS: 'default',
    WAITING_PARTS: 'warning',
    COMPLETED: 'success',
    DELIVERED: 'success',
    CANCELLED: 'secondary',
  };
  return (
    <Badge variant={variants[status] ?? 'secondary'}>
      {status.replace('_', ' ')}
    </Badge>
  );
}
