'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { createInvoiceFromRepairOrder } from '@/app/actions/invoices';
import { formError } from '@/lib/form-error';
import { toast } from '@/lib/mutation-toast';
import { useSubmitGuard } from '@/hooks/use-submit-guard';
import { useI18n } from '@/i18n/provider';

interface GenerateInvoiceButtonProps {
  repairOrderId: string;
  hasInvoice: boolean;
}

export function GenerateInvoiceButton({
  repairOrderId,
  hasInvoice,
}: GenerateInvoiceButtonProps) {
  const { t } = useI18n();
  const { loading, run } = useSubmitGuard();
  const [done, setDone] = useState(hasInvoice);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (done || hasInvoice) return null;

  const handleConfirm = () => {
    void run(async () => {
      try {
        const invoice = await createInvoiceFromRepairOrder(repairOrderId);
        setDone(true);
        setOpen(false);
        toast.success(t.ui.invoiceCreated);
        router.refresh();
        router.push(`/invoices/${invoice.id}`);
      } catch (err) {
        toast.error(formError(err));
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => !loading && setOpen(next)}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading} className="touch-manipulation">
          <FileText className="me-1 h-3 w-3" />
          {loading ? t.ui.generating : t.ui.invoiceBtn}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.ui.createInvoiceTitle}</AlertDialogTitle>
          <AlertDialogDescription>{t.ui.createInvoiceDesc}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="w-full sm:w-auto" disabled={loading}>
            {t.ui.notNow}
          </AlertDialogCancel>
          <AlertDialogAction
            className="w-full sm:w-auto"
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
          >
            {loading ? t.ui.creating : t.ui.createInvoice}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
