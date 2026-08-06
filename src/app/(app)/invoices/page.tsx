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
import { getT } from '@/i18n/server';

function invoiceStatusLabel(status: string, t: Awaited<ReturnType<typeof getT>>) {
  const map: Record<string, string> = {
    PAID: t.ui.statusPaid,
    PARTIAL: t.ui.statusPartial,
    OVERDUE: t.ui.statusOverdue,
    UNPAID: t.ui.statusUnpaid,
    DRAFT: t.ui.statusDraft,
  };
  return map[status] ?? status;
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? 'all';
  const query = params.q?.toLowerCase() ?? '';
  const [t, { items: invoices }] = await Promise.all([getT(), getInvoices({ status })]);
  const filtered = query
    ? invoices.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(query) ||
          inv.customer.fullName.toLowerCase().includes(query)
      )
    : invoices;

  return (
    <EntityFilterShell>
      <PageHeader title={t.app.invoices} description={t.ui.invoicesDesc} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <InvoicesSearch />
        <InvoicesFilter />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title={query || status !== 'all' ? t.ui.noMatchingInvoices : t.ui.noInvoicesYet}
          description={
            query || status !== 'all' ? t.ui.tryClearSearchFilters : t.ui.invoicesFromRepairs
          }
          action={
            <Button asChild>
              <Link href="/repair-orders">{t.ui.goToRepairOrders}</Link>
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
                        ? t.ui.duePrefix.replace('{date}', formatDate(inv.dueDate))
                        : t.ui.noDueDate}
                    </p>
                  </div>
                  <StatusBadge status={inv.status} label={invoiceStatusLabel(inv.status, t)} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-zinc-900/80 px-2 py-2">
                    <p className="text-zinc-500">{t.ui.colTotal}</p>
                    <p className="mt-0.5 font-medium tabular-nums">
                      {formatCurrency(Number(inv.totalAmount))}
                    </p>
                  </div>
                  <div className="rounded-lg bg-zinc-900/80 px-2 py-2">
                    <p className="text-zinc-500">{t.ui.colPaid}</p>
                    <p className="mt-0.5 font-medium tabular-nums text-emerald-500">
                      {formatCurrency(Number(inv.paidAmount))}
                    </p>
                  </div>
                  <div className="rounded-lg bg-zinc-900/80 px-2 py-2">
                    <p className="text-zinc-500">{t.ui.due}</p>
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
                    {t.ui.view}
                  </PendingLink>
                  {inv.status !== 'PAID' && (
                    <PendingLink
                      href={`/invoices/${inv.id}?pay=1`}
                      className="text-sm font-medium text-emerald-500"
                    >
                      {t.ui.pay}
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
                    <TableHead>{t.ui.colInvoice}</TableHead>
                    <TableHead>{t.ui.colCustomer}</TableHead>
                    <TableHead>{t.ui.colAmount}</TableHead>
                    <TableHead>{t.ui.colPaid}</TableHead>
                    <TableHead>{t.ui.colBalance}</TableHead>
                    <TableHead>{t.ui.colDueDate}</TableHead>
                    <TableHead>{t.ui.colStatus}</TableHead>
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
                          label={invoiceStatusLabel(inv.status, t)}
                        />
                      </TableCell>
                      <TableCell className="space-x-2">
                        <PendingLink
                          href={`/invoices/${inv.id}`}
                          className="text-amber-500 hover:underline"
                        >
                          {t.ui.view}
                        </PendingLink>
                        {inv.status !== 'PAID' && (
                          <PendingLink
                            href={`/invoices/${inv.id}?pay=1`}
                            className="text-emerald-500 hover:underline"
                          >
                            {t.ui.pay}
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

function StatusBadge({ status, label }: { status: string; label: string }) {
  const variant =
    status === 'PAID' ? 'success' : status === 'OVERDUE' ? 'destructive' : 'warning';
  return <Badge variant={variant}>{label}</Badge>;
}
