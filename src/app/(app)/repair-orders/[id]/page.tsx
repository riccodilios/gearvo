import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getRepairOrder } from '@/app/actions/repair-orders';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/utils';
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

export default async function RepairOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getRepairOrder(id);
  if (!order) notFound();

  return (
    <div className="space-y-8">
      <PageHeader
        title={order.orderNumber}
        description={order.description ?? 'Repair order details'}
        actions={
          <div className="flex flex-wrap gap-2">
            <RepairOrderStatusSelect orderId={order.id} currentStatus={order.status} />
            {!order.invoice && (
              <GenerateInvoiceButton repairOrderId={order.id} hasInvoice={false} />
            )}
            {order.invoice && (
              <Button asChild variant="outline">
                <Link href={`/invoices/${order.invoice.id}`}>View invoice</Link>
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/customers/${order.customer.id}`}
              className="font-medium text-amber-500 hover:underline"
            >
              {order.customer.fullName}
            </Link>
            {order.customer.phone && (
              <p className="text-sm text-zinc-500">{order.customer.phone}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Vehicle</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {order.vehicle.year} {order.vehicle.make} {order.vehicle.model}
            </p>
            {order.vehicle.licensePlate && (
              <p className="text-sm text-zinc-500">{order.vehicle.licensePlate}</p>
            )}
            {order.vehicle.mileage != null && (
              <p className="text-sm text-zinc-500">
                {order.vehicle.mileage.toLocaleString()} km
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Labor</span>
              <span>{formatCurrency(Number(order.laborCost))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Parts</span>
              <span>{formatCurrency(Number(order.partsRetailTotal))}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-amber-500">
                {formatCurrency(Number(order.totalPrice))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Profit</span>
              <span className="text-emerald-400">
                {formatCurrency(Number(order.profit))}
              </span>
            </div>
            <p className="pt-2 text-xs text-zinc-500">
              Opened {formatDateTime(order.createdAt)}
            </p>
            <Badge className="mt-2">{order.status.replace('_', ' ')}</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parts used</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Retail</TableHead>
                <TableHead>Line total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.parts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.carPart.name}</TableCell>
                  <TableCell>{p.quantity}</TableCell>
                  <TableCell>{formatCurrency(Number(p.costPrice))}</TableCell>
                  <TableCell>{formatCurrency(Number(p.retailPrice))}</TableCell>
                  <TableCell>
                    {formatCurrency(Number(p.retailPrice) * p.quantity)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-zinc-300">{order.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
