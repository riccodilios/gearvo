import {
  IntegrationProvider,
  IntegrationStatus,
  type CompanyIntegration,
  type PrismaClient,
} from '@prisma/client';
import { prisma } from '@/lib/db';

type IntegrationDb = Pick<PrismaClient, 'companyIntegration'>;

export type IntegrationDefinition = {
  provider: IntegrationProvider;
  name: string;
  description: string;
  category: 'payments' | 'messaging' | 'calendar' | 'compliance' | 'accounting';
  docsUrl?: string;
};

export const INTEGRATION_REGISTRY: IntegrationDefinition[] = [
  {
    provider: 'STRIPE',
    name: 'Stripe',
    description: 'Accept card payments and manage SaaS subscriptions.',
    category: 'payments',
    docsUrl: 'https://stripe.com/docs',
  },
  {
    provider: 'WHATSAPP',
    name: 'WhatsApp Business',
    description: 'Send repair updates and payment reminders via WhatsApp.',
    category: 'messaging',
  },
  {
    provider: 'EMAIL',
    name: 'Email',
    description: 'Transactional email for invoices and notifications.',
    category: 'messaging',
  },
  {
    provider: 'SMS',
    name: 'SMS',
    description: 'SMS alerts for appointments and overdue balances.',
    category: 'messaging',
  },
  {
    provider: 'GOOGLE_CALENDAR',
    name: 'Google Calendar',
    description: 'Sync appointments with Google Calendar.',
    category: 'calendar',
  },
  {
    provider: 'OUTLOOK_CALENDAR',
    name: 'Outlook Calendar',
    description: 'Sync appointments with Microsoft Outlook.',
    category: 'calendar',
  },
  {
    provider: 'ACCOUNTING',
    name: 'Accounting Software',
    description: 'Export journals to your accounting package.',
    category: 'accounting',
  },
  {
    provider: 'ZATCA',
    name: 'ZATCA e-Invoicing',
    description: 'Saudi e-invoicing (architecture ready — connect later).',
    category: 'compliance',
  },
];

export async function ensureCompanyIntegrations(
  companyId: string,
  db: IntegrationDb = prisma
) {
  await db.companyIntegration.createMany({
    data: INTEGRATION_REGISTRY.map((i) => ({
      companyId,
      provider: i.provider,
      status: IntegrationStatus.DISCONNECTED,
    })),
    skipDuplicates: true,
  });
}

export async function getCompanyIntegrations(companyId: string): Promise<
  (CompanyIntegration & { definition: IntegrationDefinition })[]
> {
  await ensureCompanyIntegrations(companyId);
  const rows = await prisma.companyIntegration.findMany({ where: { companyId } });
  return rows.map((row) => ({
    ...row,
    secretsEnc: null, // never expose
    definition:
      INTEGRATION_REGISTRY.find((d) => d.provider === row.provider) ??
      ({
        provider: row.provider,
        name: row.provider,
        description: '',
        category: 'payments' as const,
      }),
  }));
}

export async function setIntegrationStatus(
  companyId: string,
  provider: IntegrationProvider,
  status: IntegrationStatus,
  config?: object
) {
  return prisma.companyIntegration.upsert({
    where: { companyId_provider: { companyId, provider } },
    create: { companyId, provider, status, config: config ?? undefined },
    update: { status, config: config ?? undefined, lastError: null },
  });
}
