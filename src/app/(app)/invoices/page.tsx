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
import { AppLabel, Ui } from '@/i18n/T';

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
      <PageHeader title={<AppLabel k="invoices" />} description={<Ui k="invoicesDesc" />} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <InvoicesSearch />
        <InvoicesFilter />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title={query || status !== 'all' ? <Ui k="noMatchingInvoices" /> : <Ui k="noInvoicesYet" />}
          description={
            query || status !== 'all' ? <Ui k="tryClearSearchFilters" /> : <Ui k="invoicesFromRepairs" />
          }
          action={
            <Button asChild>
              <Link href="/repair-orders"><Ui k="goToRepairOrders" /></Link>
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
                      {inv.dueDate
                        ? <Ui k="duePrefix" vars={{ date: formatDate(inv.dueDate) }} />
                        : <Ui k="noDueDate" />}
                    </p>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-zinc-900/80 px-2 py-2">
                    <p className="text-zinc-500"><Ui k="colTotal" /></p>
                    <p className="mt-0.5 font-medium tabular-nums">
                      {formatCurrency(Number(inv.totalAmount))}
                    </p>
                  </div>
                  <div className="rounded-lg bg-zinc-900/80 px-2 py-2">
                    <p className="text-zinc-500"><Ui k="colPaid" /></p>
                    <p className="mt-0.5 font-medium tabular-nums text-emerald-500">
                      {formatCurrency(Number(inv.paidAmount))}
                    </p>
                  </div>
                  <div className="rounded-lg bg-zinc-900/80 px-2 py-2">
                    <p className="text-zinc-500"><Ui k="due" /></p>
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
                    <Ui k="view" />
                  </PendingLink>
                  {inv.status !== 'PAID' && (
                    <PendingLink
                      href={`/invoices/${inv.id}?pay=1`}
                      className="text-sm font-medium text-emerald-500"
                    >
                      <Ui k="pay" />
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
                    <TableHead><Ui k="colInvoice" /></TableHead>
                    <TableHead><Ui k="colCustomer" /></TableHead>
                    <TableHead><Ui k="colAmount" /></TableHead>
                    <TableHead><Ui k="colPaid" /></TableHead>
                    <TableHead><Ui k="colBalance" /></TableHead>
                    <TableHead><Ui k="colDueDate" /></TableHead>
                    <TableHead><Ui k="colStatus" /></TableHead>
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
                        <StatusBadge
                          status={inv.status}
                        />
                      </TableCell>
                      <TableCell className="space-x-2">
                        <PendingLink
                          href={`/invoices/${inv.id}`}
                          className="text-amber-500 hover:underline"
                        >
                          <Ui k="view" />
                        </PendingLink>
                        {inv.status !== 'PAID' && (
                          <PendingLink
                            href={`/invoices/${inv.id}?pay=1`}
                            className="text-emerald-500 hover:underline"
                          >
                            <Ui k="pay" />
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
  const keys = {
    PAID: 'statusPaid',
    PARTIAL: 'statusPartial',
    OVERDUE: 'statusOverdue',
    UNPAID: 'statusUnpaid',
    DRAFT: 'statusDraft',
  } as const;
  const key = keys[status as keyof typeof keys];
  return <Badge variant={variant}>{key ? <Ui k={key} /> : status}</Badge>;
}
