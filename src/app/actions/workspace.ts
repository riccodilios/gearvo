'use server';

import { prisma } from '@/lib/db';
import { requirePermission, getWorkspaceContext } from '@/server/auth';
import { getActivityFeed, logActivity } from '@/server/audit';
import { getCompanyFeatures, setCompanyFeature, seedCompanyFeatures } from '@/server/features';
import {
  getCompanyIntegrations,
  setIntegrationStatus,
} from '@/server/integrations/registry';
import type { FeatureModule, IntegrationProvider, IntegrationStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function getActivity(options?: { take?: number; entityType?: string; entityId?: string }) {
  const ctx = await requirePermission('activity:read');
  return getActivityFeed(ctx, options);
}

export async function getFeatures() {
  const ctx = await getWorkspaceContext();
  if (!ctx) return [];
  return getCompanyFeatures(ctx.company.id);
}

export async function toggleFeature(feature: FeatureModule, enabled: boolean) {
  const ctx = await requirePermission('features:manage');
  await setCompanyFeature(ctx.company.id, feature, enabled);
  await logActivity({
    ctx,
    action: 'feature.toggled',
    entityType: 'Feature',
    entityId: feature,
    summary: `${enabled ? 'Enabled' : 'Disabled'} feature ${feature}`,
  });
  revalidatePath('/settings');
  revalidatePath('/settings/features');
}

export async function getIntegrations() {
  const ctx = await getWorkspaceContext();
  if (!ctx) return [];
  return getCompanyIntegrations(ctx.company.id);
}

export async function updateIntegration(
  provider: IntegrationProvider,
  status: IntegrationStatus
) {
  const ctx = await requirePermission('integrations:manage');
  await setIntegrationStatus(ctx.company.id, provider, status);
  await logActivity({
    ctx,
    action: 'integration.updated',
    entityType: 'Integration',
    entityId: provider,
    summary: `Integration ${provider} → ${status}`,
  });
  revalidatePath('/settings');
}

export async function updateCompanySettings(data: {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  commercialRegNumber?: string;
  vatNumber?: string;
  currency?: string;
  locale?: string;
}) {
  const ctx = await requirePermission('settings:write');
  await prisma.company.update({
    where: { id: ctx.company.id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.address !== undefined && { address: data.address || null }),
      ...(data.commercialRegNumber !== undefined && {
        commercialRegNumber: data.commercialRegNumber || null,
      }),
      ...(data.vatNumber !== undefined && { vatNumber: data.vatNumber || null }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.locale !== undefined && { locale: data.locale }),
    },
  });
  await logActivity({
    ctx,
    action: 'company.settings_updated',
    entityType: 'Company',
    entityId: ctx.company.id,
    summary: 'Updated company settings',
  });
  revalidatePath('/settings');
}

export async function listBranches() {
  const ctx = await getWorkspaceContext();
  if (!ctx) return [];
  return prisma.branch.findMany({
    where: {
      companyId: ctx.company.id,
      deletedAt: null,
      ...(ctx.canAccessAllBranches ? {} : { id: { in: ctx.branchIds } }),
    },
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  });
}

export async function createBranch(data: { name: string; slug: string; address?: string; phone?: string }) {
  const ctx = await requirePermission('branches:manage');
  const slug = data.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const branch = await prisma.branch.create({
    data: {
      companyId: ctx.company.id,
      name: data.name,
      slug,
      address: data.address || null,
      phone: data.phone || null,
    },
  });
  await logActivity({
    ctx,
    action: 'branch.created',
    entityType: 'Branch',
    entityId: branch.id,
    summary: `Created branch ${branch.name}`,
  });
  revalidatePath('/settings');
  revalidatePath('/settings/branches');
  return branch;
}

export async function archiveBranch(branchId: string) {
  const ctx = await requirePermission('branches:manage');
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, companyId: ctx.company.id },
  });
  if (!branch) throw new Error('Branch not found');
  if (branch.isDefault) throw new Error('Cannot archive the default branch');
  await prisma.branch.update({
    where: { id: branchId },
    data: { isArchived: true },
  });
  await logActivity({
    ctx,
    action: 'branch.archived',
    entityType: 'Branch',
    entityId: branchId,
    summary: `Archived branch ${branch.name}`,
  });
  revalidatePath('/settings/branches');
}

export async function ensureWorkspaceDefaults() {
  const ctx = await getWorkspaceContext();
  if (!ctx) return;
  await seedCompanyFeatures(ctx.company.id, ctx.company.plan);
}
