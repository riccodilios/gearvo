import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Secure cron endpoint for marking overdue installments.
 * Requires header: Authorization: Bearer $CRON_SECRET
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Cron not configured' }, { status: 503 });
  }

  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const installments = await prisma.installment.updateMany({
    where: {
      status: 'PENDING',
      dueDate: { lt: now },
    },
    data: { status: 'OVERDUE' },
  });

  const invoices = await prisma.invoice.updateMany({
    where: {
      status: { in: ['UNPAID', 'PARTIAL'] },
      dueDate: { lt: now },
      deletedAt: null,
    },
    data: { status: 'OVERDUE' },
  });

  return NextResponse.json({
    ok: true,
    installmentsUpdated: installments.count,
    invoicesUpdated: invoices.count,
  });
}
