import { getInvoices } from '@/app/actions/invoices';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FileText } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InvoicesFilter } from '@/components/invoices/InvoicesFilter';
import { InvoicesSearch } from '@/components/invoices/InvoicesSearch';
import Link from 'next/link';

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? 'all';
  const query = params.q?.toLowerCase() ?? '';
  const { items: invoices } = await getInvoices({ status });
  const filtered = query
    ? invoices.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(query) ||
          inv.customer.fullName.toLowerCase().includes(query)
      )
    : invoices;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Invoices"
        description="Manage invoices and payments"
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <InvoicesSearch />
        <InvoicesFilter />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="No invoices"
          description="Invoices are created from completed repair orders"
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">
                      {inv.invoiceNumber}
                    </TableCell>
                    <TableCell>{inv.customer.fullName}</TableCell>
                    <TableCell>
                      {formatCurrency(Number(inv.totalAmount))}
                    </TableCell>
                    <TableCell className="text-emerald-500">
                      {formatCurrency(Number(inv.paidAmount))}
                    </TableCell>
                    <TableCell className="text-amber-500">
                      {formatCurrency(Number(inv.remainingBalance))}
                    </TableCell>
                    <TableCell>
                      {inv.dueDate ? formatDate(inv.dueDate) : '-'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="text-amber-500 hover:underline"
                      >
                        View
                      </Link>
                      {inv.status !== 'PAID' && (
                        <Link
                          href={`/invoices/${inv.id}?pay=1`}
                          className="text-emerald-500 hover:underline"
                        >
                          Pay
                        </Link>
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
    'default' | 'secondary' | 'success' | 'warning' | 'destructive'
  > = {
    UNPAID: 'destructive',
    PARTIAL: 'warning',
    PAID: 'success',
    OVERDUE: 'destructive',
  };
  return (
    <Badge variant={variants[status] ?? 'secondary'}>{status}</Badge>
  );
}
