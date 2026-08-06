'use client';

import { useState, useTransition } from 'react';
import { addMember } from '@/app/actions/users';
import { formError } from '@/lib/form-error';
import { toast } from '@/lib/mutation-toast';
import type { AppRole } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

const ROLES: AppRole[] = [
  'COMPANY_ADMIN',
  'BRANCH_MANAGER',
  'SERVICE_ADVISOR',
  'TECHNICIAN',
  'CASHIER',
  'INVENTORY_MANAGER',
  'ACCOUNTANT',
  'RECEPTIONIST',
  'EMPLOYEE',
];

export function AddMemberForm({
  branches,
}: {
  branches: { id: string; name: string }[];
}) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<AppRole>('EMPLOYEE');
  const [branchId, setBranchId] = useState<string>('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add employee</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            startTransition(async () => {
              try {
                await addMember({
                  email,
                  fullName,
                  role,
                  branchId: branchId || null,
                });
                toast.success('Employee added');
                setEmail('');
                setFullName('');
                router.refresh();
              } catch (err) {
                const msg = formError(err);
                setError(msg);
                toast.error(msg);
              }
            });
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as AppRole)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="branch">Branch (optional for company-wide)</Label>
            <select
              id="branch"
              className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              required={!['COMPANY_OWNER', 'COMPANY_ADMIN'].includes(role)}
            >
              {['COMPANY_OWNER', 'COMPANY_ADMIN'].includes(role) ? (
                <option value="">Company-wide</option>
              ) : (
                <option value="" disabled>
                  Select branch
                </option>
              )}
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="sm:col-span-2 text-sm text-red-400">{error}</p>}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? 'Adding…' : 'Add member'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
