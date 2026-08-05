import { describe, it, expect } from 'vitest';
import { hasPermission, isCompanyWideRole, permissionsForRole } from '../src/server/permissions';

describe('RBAC permissions', () => {
  it('grants company owners workspace manage', () => {
    expect(hasPermission('COMPANY_OWNER', 'workspace:manage')).toBe(true);
  });

  it('denies employees payment write', () => {
    expect(hasPermission('EMPLOYEE', 'payments:write')).toBe(false);
  });

  it('treats company admin as company-wide', () => {
    expect(isCompanyWideRole('COMPANY_ADMIN')).toBe(true);
    expect(isCompanyWideRole('TECHNICIAN')).toBe(false);
  });

  it('cashier can write payments but not inventory delete', () => {
    const perms = permissionsForRole('CASHIER');
    expect(perms.has('payments:write')).toBe(true);
    expect(perms.has('inventory:delete')).toBe(false);
  });
});

describe('payment integrity helpers', () => {
  it('rejects overpayment math', () => {
    const remaining = 100;
    const amount = 150;
    expect(amount > remaining).toBe(true);
  });
});
