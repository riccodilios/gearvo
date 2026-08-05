import type { Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;

/**
 * Atomically allocate the next document number for a company/year.
 * Format: PREFIX-00001
 */
export async function nextDocumentNumber(
  tx: Tx,
  params: { companyId: string; type: 'INV' | 'RO' | 'PO'; branchId?: string | null }
): Promise<string> {
  const year = new Date().getFullYear();

  let seq = await tx.documentSequence.findFirst({
    where: {
      companyId: params.companyId,
      type: params.type,
      year,
      branchId: null,
    },
  });

  if (!seq) {
    seq = await tx.documentSequence.create({
      data: {
        companyId: params.companyId,
        branchId: null,
        type: params.type,
        year,
        lastValue: 0,
      },
    });
  }

  const updated = await tx.documentSequence.update({
    where: { id: seq.id },
    data: { lastValue: { increment: 1 } },
  });

  return `${params.type}-${String(updated.lastValue).padStart(5, '0')}`;
}
