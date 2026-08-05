import { getTeamUsers } from '@/app/actions/users';
import { listBranches } from '@/app/actions/workspace';
import { gatePage } from '@/server/page-gate';
import { FeatureModule } from '@prisma/client';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AddMemberForm } from '@/components/employees/AddMemberForm';

export default async function EmployeesPage() {
  await gatePage('members:manage', FeatureModule.EMPLOYEES);
  const [team, branches] = await Promise.all([getTeamUsers(), listBranches()]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Employees"
        description="Manage memberships and roles across branches"
      />

      <AddMemberForm
        branches={branches.map((b) => ({ id: b.id, name: b.name }))}
      />

      <Card>
        <CardHeader>
          <CardTitle>Team directory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {team.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{m.user.fullName}</p>
                <p className="text-zinc-500">{m.user.email}</p>
              </div>
              <Badge variant="secondary">
                {m.role.replace(/_/g, ' ')}
                {m.branch ? ` · ${m.branch.name}` : ' · Company-wide'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
