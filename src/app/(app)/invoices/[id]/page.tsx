import { getInvoice } from '@/app/actions/invoices';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PaymentDialog } from '@/components/invoices/PaymentDialog';

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        description={`Customer: ${invoice.customer.fullName}`}
        actions={
          invoice.status !== 'PAID' && (
            <PaymentDialog
              invoiceId={invoice.id}
              remainingBalance={Number(invoice.remainingBalance)}
              trigger={<Button>Record Payment</Button>}
            />
          )
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Total Amount
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
              Paid
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
              Balance
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
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={
                invoice.status === 'PAID' ? 'success' : 'warning'
              }
            >
              {invoice.status}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Items</CardTitle>
          {invoice.dueDate && (
            <p className="text-sm text-zinc-400">
              Due: {formatDate(invoice.dueDate)}
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
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {invoice.payments.length === 0 ? (
            <p className="text-sm text-zinc-500">No payments yet</p>
          ) : (
            <div className="space-y-2">
              {invoice.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex justify-between rounded-lg border border-zinc-800 p-4"
                >
                  <div>
                    <p className="font-medium text-emerald-500">
                      {formatCurrency(Number(payment.amount))}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {formatDate(payment.paymentDate)} • {payment.method}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {invoice.installments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Installment Plan</CardTitle>
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
                      Due: {formatDate(inst.dueDate)}
                    </p>
                  </div>
                  <Badge variant={inst.status === 'PAID' ? 'success' : 'warning'}>
                    {inst.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
