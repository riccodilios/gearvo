import { FeatureModule, Plan } from '@prisma/client';
import { prisma } from '@/lib/db';
import type { WorkspaceContext } from '@/server/auth';

const PLAN_FEATURES: Record<Plan, FeatureModule[]> = {
  TRIAL: [
    FeatureModule.CRM,
    FeatureModule.INVENTORY,
    FeatureModule.MARKETPLACE,
    FeatureModule.INSTALLMENTS,
    FeatureModule.ANALYTICS,
    FeatureModule.EMPLOYEES,
    FeatureModule.REPORTS,
    FeatureModule.EXPENSES,
  ],
  BASIC: [
    FeatureModule.CRM,
    FeatureModule.INVENTORY,
    FeatureModule.ANALYTICS,
    FeatureModule.EMPLOYEES,
    FeatureModule.REPORTS,
  ],
  PRO: [
    FeatureModule.CRM,
    FeatureModule.INVENTORY,
    FeatureModule.MARKETPLACE,
    FeatureModule.INSTALLMENTS,
    FeatureModule.ACCOUNTING,
    FeatureModule.ANALYTICS,
    FeatureModule.EMPLOYEES,
    FeatureModule.REPORTS,
    FeatureModule.APPOINTMENTS,
    FeatureModule.EXPENSES,
    FeatureModule.WHATSAPP,
  ],
  ENTERPRISE: Object.values(FeatureModule),
};

export async function seedCompanyFeatures(companyId: string, plan: Plan) {
  const enabled = new Set(PLAN_FEATURES[plan]);
  const all = Object.values(FeatureModule);
  await prisma.$transaction(
    all.map((feature) =>
      prisma.companyFeatureFlag.upsert({
        where: { companyId_feature: { companyId, feature } },
        create: { companyId, feature, enabled: enabled.has(feature) },
        update: {},
      })
    )
  );
}

export async function isFeatureEnabled(companyId: string, feature: FeatureModule): Promise<boolean> {
  const row = await prisma.companyFeatureFlag.findUnique({
    where: { companyId_feature: { companyId, feature } },
  });
  return row?.enabled ?? false;
}

export async function requireFeature(ctx: WorkspaceContext, feature: FeatureModule) {
  const ok = await isFeatureEnabled(ctx.company.id, feature);
  if (!ok) throw new Error(`Feature not enabled: ${feature}`);
}

export async function getCompanyFeatures(companyId: string) {
  return prisma.companyFeatureFlag.findMany({
    where: { companyId },
    orderBy: { feature: 'asc' },
  });
}

export async function setCompanyFeature(companyId: string, feature: FeatureModule, enabled: boolean) {
  return prisma.companyFeatureFlag.upsert({
    where: { companyId_feature: { companyId, feature } },
    create: { companyId, feature, enabled },
    update: { enabled },
  });
}
