'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { createInvoiceFromRepairOrder } from '@/app/actions/invoices';

interface GenerateInvoiceButtonProps {
  repairOrderId: string;
  hasInvoice: boolean;
}

export function GenerateInvoiceButton({
  repairOrderId,
  hasInvoice,
}: GenerateInvoiceButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (hasInvoice) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
      const invoice = await createInvoiceFromRepairOrder(repairOrderId);
      router.refresh();
      router.push(`/invoices/${invoice.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
    >
      <FileText className="mr-1 h-3 w-3" />
      {loading ? 'Generating...' : 'Invoice'}
    </Button>
  );
}
