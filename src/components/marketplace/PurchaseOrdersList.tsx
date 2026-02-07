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
import { formatCurrency } from '@/lib/utils';

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

  const toNum = (v: unknown): number =>
    typeof v === 'number' ? v : Number(String(v));

  const handleStatus = async (id: string, status: 'ORDERED' | 'RECEIVED') => {
    setUpdatingId(id);
    try {
      await updatePurchaseOrderStatus(id, status);
    } finally {
      setUpdatingId(null);
    }
  };

  const statusBadge = (status: string) => {
    const v = status.toLowerCase();
    if (v === 'pending') return <Badge variant="secondary">Draft</Badge>;
    if (v === 'ordered') return <Badge className="bg-amber-600/20 text-amber-400">Ordered</Badge>;
    if (v === 'received') return <Badge className="bg-emerald-600/20 text-emerald-400">Received</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <Card>
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
                  <TableCell className="text-right">{formatCurrency(total)}</TableCell>
                  <TableCell className="text-right">
                    {order.status === 'PENDING' && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => handleStatus(order.id, 'ORDERED')}
                      >
                        {isUpdating ? '…' : 'Mark ordered'}
                      </Button>
                    )}
                    {order.status === 'ORDERED' && (
                      <Button
                        variant="default"
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => handleStatus(order.id, 'RECEIVED')}
                      >
                        {isUpdating ? '…' : 'Mark received'}
                      </Button>
                    )}
                    {order.status === 'RECEIVED' && (
                      <span className="text-xs text-zinc-500">Stock updated</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
