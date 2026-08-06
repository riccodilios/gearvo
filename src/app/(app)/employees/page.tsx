import { getTeamUsers } from '@/app/actions/users';
import { listBranches } from '@/app/actions/workspace';
import { gatePage } from '@/server/page-gate';
import { FeatureModule } from '@prisma/client';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AddMemberForm } from '@/components/employees/AddMemberForm';
import { UserCog } from 'lucide-react';
import { AppLabel, Ui } from '@/i18n/T';

export default async function EmployeesPage() {
  await gatePage('members:manage', FeatureModule.EMPLOYEES);
  const [team, branches] = await Promise.all([getTeamUsers(), listBranches()]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title={<AppLabel k="employees" />}
        description={<Ui k="employeesDesc" />}
      />

      <AddMemberForm
        branches={branches.map((b) => ({ id: b.id, name: b.name }))}
      />

      <Card>
        <CardHeader>
          <CardTitle><Ui k="teamDirectory" /></CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {team.length === 0 ? (
            <EmptyState
              compact
              icon={<UserCog className="h-5 w-5" />}
              title={<Ui k="noTeamMembers" />}
              description={<Ui k="inviteStaffHint" />}
            />
          ) : (
            team.map((m) => (
              <div
                key={m.id}
                className="flex flex-col gap-2 rounded-xl border border-zinc-800 px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:py-2"
              >
                <div className="min-w-0">
                  <p className="font-medium text-zinc-50">{m.user.fullName}</p>
                  <p className="truncate text-zinc-500">{m.user.email}</p>
                </div>
                <Badge variant="secondary" className="w-fit max-w-full truncate">
                  <RoleLabel role={m.role} />
                  {m.branch ? ` · ${m.branch.name}` : <> · <Ui k="companyWide" /></>}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RoleLabel({ role }: { role: string }) {
  const keys = {
    OWNER: 'roleOwner',
    COMPANY_MANAGER: 'roleCompanyManager',
    BRANCH_MANAGER: 'roleBranchManager',
    TECHNICIAN: 'roleTechnician',
    RECEPTIONIST: 'roleReceptionist',
    ACCOUNTANT: 'roleAccountant',
    VIEWER: 'roleViewer',
  } as const;
  const key = keys[role as keyof typeof keys];
  return key ? <Ui k={key} /> : role.replace(/_/g, ' ');
}
