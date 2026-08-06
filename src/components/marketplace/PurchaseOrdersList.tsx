'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { updatePurchaseOrderStatus } from '@/app/actions/marketplace';
import { toast } from '@/lib/mutation-toast';
import { formError } from '@/lib/form-error';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type Line = {
  id: string;
  quantity: number;
  unitCost: unknown;
  carPart: { id: string; name: string };
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  supplier: { name: string };
  lines: Line[];
};

export function PurchaseOrdersList({ orders }: { orders: Order[] }) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const router = useRouter();

  const toNum = (v: unknown): number =>
    typeof v === 'number' ? v : Number(String(v));

  const handleStatus = async (id: string, status: 'ORDERED' | 'RECEIVED') => {
    setUpdatingId(id);
    try {
      await updatePurchaseOrderStatus(id, status);
      toast.success(status === 'ORDERED' ? 'Marked as ordered' : 'Received — stock updated');
      router.refresh();
    } catch (err) {
      toast.error(formError(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const statusBadge = (status: string) => {
    const v = status.toLowerCase();
    if (v === 'pending') return <Badge variant="secondary">Draft</Badge>;
    if (v === 'ordered')
      return <Badge className="bg-amber-600/20 text-amber-400">Ordered</Badge>;
    if (v === 'received')
      return <Badge className="bg-emerald-600/20 text-emerald-400">Received</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  const actionButton = (order: Order, isUpdating: boolean) => {
    if (order.status === 'PENDING') {
      return (
        <Button
          variant="outline"
          size="sm"
          className="min-h-10 w-full touch-manipulation sm:w-auto"
          disabled={isUpdating}
          onClick={() => handleStatus(order.id, 'ORDERED')}
        >
          {isUpdating ? '…' : 'Mark ordered'}
        </Button>
      );
    }
    if (order.status === 'ORDERED') {
      return (
        <Button
          variant="default"
          size="sm"
          className="min-h-10 w-full touch-manipulation sm:w-auto"
          disabled={isUpdating}
          onClick={() => handleStatus(order.id, 'RECEIVED')}
        >
          {isUpdating ? '…' : 'Mark received'}
        </Button>
      );
    }
    if (order.status === 'RECEIVED') {
      return <span className="text-xs text-zinc-500">Stock updated</span>;
    }
    return null;
  };

  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {orders.map((order) => {
          const total = order.lines.reduce(
            (sum, l) => sum + l.quantity * toNum(l.unitCost),
            0
          );
          const isUpdating = updatingId === order.id;
          return (
            <div
              key={order.id}
              className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-50">{order.orderNumber}</p>
                  <p className="mt-0.5 truncate text-sm text-zinc-400">
                    {order.supplier.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {order.lines.length} items · {formatCurrency(total)}
                  </p>
                </div>
                {statusBadge(order.status)}
              </div>
              <div className="mt-3">{actionButton(order, isUpdating)}</div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lines</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const total = order.lines.reduce(
                  (sum, l) => sum + l.quantity * toNum(l.unitCost),
                  0
                );
                const isUpdating = updatingId === order.id;
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{order.supplier.name}</TableCell>
                    <TableCell>{statusBadge(order.status)}</TableCell>
                    <TableCell>{order.lines.length} items</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(total)}
                    </TableCell>
                    <TableCell className="text-right">
                      {actionButton(order, isUpdating)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
