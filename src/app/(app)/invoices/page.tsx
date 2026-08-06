import { getInvoices } from '@/app/actions/invoices';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
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
import { PendingLink } from '@/components/ui/pending-link';
import { EntityFilterShell } from '@/components/ui/EntityFilterShell';

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
    <EntityFilterShell>
      <PageHeader title="Invoices" description="Manage invoices and payments" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <InvoicesSearch />
        <InvoicesFilter />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title={query || status !== 'all' ? 'No matching invoices' : 'No invoices yet'}
          description={
            query || status !== 'all'
              ? 'Try clearing search or filters'
              : 'Invoices are created from completed repair orders'
          }
          action={
            <Button asChild>
              <Link href="/repair-orders">Go to repair orders</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filtered.map((inv) => (
              <div
                key={inv.id}
                className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-50">{inv.invoiceNumber}</p>
                    <p className="mt-0.5 truncate text-sm text-zinc-400">
                      {inv.customer.fullName}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {inv.dueDate ? `Due ${formatDate(inv.dueDate)}` : 'No due date'}
                    </p>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-zinc-900/80 px-2 py-2">
                    <p className="text-zinc-500">Total</p>
                    <p className="mt-0.5 font-medium tabular-nums">
                      {formatCurrency(Number(inv.totalAmount))}
                    </p>
                  </div>
                  <div className="rounded-lg bg-zinc-900/80 px-2 py-2">
                    <p className="text-zinc-500">Paid</p>
                    <p className="mt-0.5 font-medium tabular-nums text-emerald-500">
                      {formatCurrency(Number(inv.paidAmount))}
                    </p>
                  </div>
                  <div className="rounded-lg bg-zinc-900/80 px-2 py-2">
                    <p className="text-zinc-500">Due</p>
                    <p className="mt-0.5 font-medium tabular-nums text-amber-500">
                      {formatCurrency(Number(inv.remainingBalance))}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-3">
                  <PendingLink
                    href={`/invoices/${inv.id}`}
                    className="text-sm font-medium text-amber-500"
                  >
                    View
                  </PendingLink>
                  {inv.status !== 'PAID' && (
                    <PendingLink
                      href={`/invoices/${inv.id}?pay=1`}
                      className="text-sm font-medium text-emerald-500"
                    >
                      Pay
                    </PendingLink>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Card className="hidden md:block">
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
                      <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                      <TableCell>{inv.customer.fullName}</TableCell>
                      <TableCell>{formatCurrency(Number(inv.totalAmount))}</TableCell>
                      <TableCell className="text-emerald-500">
                        {formatCurrency(Number(inv.paidAmount))}
                      </TableCell>
                      <TableCell className="text-amber-500">
                        {formatCurrency(Number(inv.remainingBalance))}
                      </TableCell>
                      <TableCell>{inv.dueDate ? formatDate(inv.dueDate) : '-'}</TableCell>
                      <TableCell>
                        <StatusBadge status={inv.status} />
                      </TableCell>
                      <TableCell className="space-x-2">
                        <PendingLink
                          href={`/invoices/${inv.id}`}
                          className="text-amber-500 hover:underline"
                        >
                          View
                        </PendingLink>
                        {inv.status !== 'PAID' && (
                          <PendingLink
                            href={`/invoices/${inv.id}?pay=1`}
                            className="text-emerald-500 hover:underline"
                          >
                            Pay
                          </PendingLink>
                        )}
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

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === 'PAID' ? 'success' : status === 'OVERDUE' ? 'destructive' : 'warning';
  return <Badge variant={variant}>{status}</Badge>;
}
