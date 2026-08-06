import { getInvoice } from '@/app/actions/invoices';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PaymentDialog } from '@/components/invoices/PaymentDialog';
import { PaymentMethodSelect } from '@/components/invoices/PaymentMethodSelect';
import {
  InstallmentPlanDialog,
  MarkInstallmentPaidButton,
} from '@/components/invoices/InstallmentPlanDialog';
import { Ui } from '@/i18n/T';

const INVOICE_STATUS_KEYS = {
  PAID: 'statusPaid',
  PARTIAL: 'statusPartial',
  OVERDUE: 'statusOverdue',
  UNPAID: 'statusUnpaid',
  DRAFT: 'statusDraft',
} as const;

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pay?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();
  const openPay = sp.pay === '1' && invoice.status !== 'PAID';

  const statusLabel = (status: string) => {
    const key = INVOICE_STATUS_KEYS[status as keyof typeof INVOICE_STATUS_KEYS];
    return key ? <Ui k={key} /> : status;
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={<Ui k="invoiceTitle" vars={{ number: invoice.invoiceNumber }} />}
        description={<Ui k="customerPrefix" vars={{ name: invoice.customer.fullName }} />}
        actions={
          <div className="flex flex-wrap gap-2">
            {invoice.status !== 'PAID' && (
              <PaymentDialog
                invoiceId={invoice.id}
                remainingBalance={Number(invoice.remainingBalance)}
                defaultOpen={openPay}
                trigger={<Button><Ui k="recordPayment" /></Button>}
              />
            )}
            {invoice.status !== 'PAID' && Number(invoice.remainingBalance) > 0 && (
              <InstallmentPlanDialog
                invoiceId={invoice.id}
                remainingBalance={Number(invoice.remainingBalance)}
                trigger={<Button variant="outline"><Ui k="installmentPlan" /></Button>}
              />
            )}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              <Ui k="totalAmount" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(Number(invoice.totalAmount))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              <Ui k="colPaid" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-500">
              {formatCurrency(Number(invoice.paidAmount))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              <Ui k="colBalance" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-500">
              {formatCurrency(Number(invoice.remainingBalance))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              <Ui k="colStatus" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={
                invoice.status === 'PAID' ? 'success' : 'warning'
              }
            >
              {statusLabel(invoice.status)}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle><Ui k="invoiceItems" /></CardTitle>
          {invoice.dueDate && (
            <p className="text-sm text-zinc-400">
              <Ui k="dueColon" vars={{ date: formatDate(invoice.dueDate) }} />
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoice.items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between border-b border-zinc-800 pb-4"
              >
                <div>
                  <p className="font-medium">{item.description}</p>
                  <p className="text-sm text-zinc-500">
                    {item.quantity} x {formatCurrency(Number(item.unitPrice))}
                  </p>
                </div>
                <p className="font-medium">
                  {formatCurrency(Number(item.total))}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle><Ui k="paymentHistory" /></CardTitle>
        </CardHeader>
        <CardContent>
          {invoice.payments.length === 0 ? (
            <p className="text-sm text-zinc-500"><Ui k="noPaymentsYet" /></p>
          ) : (
            <div className="space-y-2">
              {invoice.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 p-4"
                >
                  <div>
                    <p className="font-medium text-emerald-500">
                      {formatCurrency(Number(payment.amount))}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {formatDate(payment.paymentDate)}
                    </p>
                  </div>
                  <PaymentMethodSelect
                    paymentId={payment.id}
                    currentMethod={payment.method}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {invoice.installments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle><Ui k="installmentPlan" /></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invoice.installments.map((inst) => (
                <div
                  key={inst.id}
                  className="flex justify-between rounded-lg border border-zinc-800 p-4"
                >
                  <div>
                    <p className="font-medium">
                      {formatCurrency(Number(inst.amount))}
                    </p>
                    <p className="text-sm text-zinc-500">
                      <Ui k="dueColon" vars={{ date: formatDate(inst.dueDate) }} />
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={inst.status === 'PAID' ? 'success' : 'warning'}>
                      {statusLabel(inst.status)}
                    </Badge>
                    {inst.status !== 'PAID' && (
                      <MarkInstallmentPaidButton installmentId={inst.id} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
