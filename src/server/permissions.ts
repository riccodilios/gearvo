import type { AppRole } from '@prisma/client';

/** Permission keys used across server actions and UI. */
export const PERMISSIONS = [
  'workspace:read',
  'workspace:manage',
  'branches:manage',
  'members:manage',
  'customers:read',
  'customers:write',
  'customers:delete',
  'vehicles:read',
  'vehicles:write',
  'vehicles:delete',
  'repairs:read',
  'repairs:write',
  'repairs:delete',
  'inventory:read',
  'inventory:write',
  'inventory:adjust',
  'inventory:delete',
  'suppliers:read',
  'suppliers:write',
  'suppliers:delete',
  'marketplace:read',
  'marketplace:write',
  'invoices:read',
  'invoices:write',
  'payments:write',
  'installments:write',
  'analytics:read',
  'reports:read',
  'expenses:read',
  'expenses:write',
  'settings:read',
  'settings:write',
  'integrations:manage',
  'features:manage',
  'activity:read',
  'platform:admin',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL_COMPANY: Permission[] = PERMISSIONS.filter((p) => p !== 'platform:admin');

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  PLATFORM_OWNER: [...PERMISSIONS],
  PLATFORM_ADMIN: [...PERMISSIONS],
  COMPANY_OWNER: ALL_COMPANY,
  COMPANY_ADMIN: ALL_COMPANY.filter((p) => p !== 'workspace:manage'),
  BRANCH_MANAGER: [
    'workspace:read',
    'customers:read',
    'customers:write',
    'customers:delete',
    'vehicles:read',
    'vehicles:write',
    'vehicles:delete',
    'repairs:read',
    'repairs:write',
    'repairs:delete',
    'inventory:read',
    'inventory:write',
    'inventory:adjust',
    'suppliers:read',
    'suppliers:write',
    'marketplace:read',
    'marketplace:write',
    'invoices:read',
    'invoices:write',
    'payments:write',
    'installments:write',
    'analytics:read',
    'reports:read',
    'expenses:read',
    'expenses:write',
    'settings:read',
    'activity:read',
    'members:manage',
  ],
  SERVICE_ADVISOR: [
    'workspace:read',
    'customers:read',
    'customers:write',
    'vehicles:read',
    'vehicles:write',
    'repairs:read',
    'repairs:write',
    'inventory:read',
    'invoices:read',
    'invoices:write',
    'payments:write',
    'installments:write',
    'activity:read',
  ],
  TECHNICIAN: [
    'workspace:read',
    'customers:read',
    'vehicles:read',
    'repairs:read',
    'repairs:write',
    'inventory:read',
  ],
  CASHIER: [
    'workspace:read',
    'customers:read',
    'invoices:read',
    'invoices:write',
    'payments:write',
    'installments:write',
  ],
  INVENTORY_MANAGER: [
    'workspace:read',
    'inventory:read',
    'inventory:write',
    'inventory:adjust',
    'inventory:delete',
    'suppliers:read',
    'suppliers:write',
    'marketplace:read',
    'marketplace:write',
  ],
  ACCOUNTANT: [
    'workspace:read',
    'customers:read',
    'invoices:read',
    'payments:write',
    'installments:write',
    'analytics:read',
    'reports:read',
    'expenses:read',
    'expenses:write',
    'activity:read',
  ],
  RECEPTIONIST: [
    'workspace:read',
    'customers:read',
    'customers:write',
    'vehicles:read',
    'vehicles:write',
    'repairs:read',
  ],
  EMPLOYEE: ['workspace:read', 'customers:read', 'vehicles:read', 'repairs:read', 'inventory:read'],
};

/** Roles that can see all branches in a company. */
export const COMPANY_WIDE_ROLES: AppRole[] = [
  'PLATFORM_OWNER',
  'PLATFORM_ADMIN',
  'COMPANY_OWNER',
  'COMPANY_ADMIN',
];

export function permissionsForRole(role: AppRole): Set<Permission> {
  return new Set(ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.EMPLOYEE);
}

export function hasPermission(role: AppRole, permission: Permission): boolean {
  return permissionsForRole(role).has(permission);
}

export function isCompanyWideRole(role: AppRole): boolean {
  return COMPANY_WIDE_ROLES.includes(role);
}
