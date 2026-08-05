'use client';

import { useState, useTransition } from 'react';
import { updateCompanySettings } from '@/app/actions/workspace';
import { formError } from '@/lib/form-error';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  initial: {
    name: string;
    email: string;
    phone: string;
    address: string;
    commercialRegNumber: string;
    vatNumber: string;
    currency: string;
    locale: string;
  };
};

export function CompanySettingsForm({ initial }: Props) {
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              try {
                await updateCompanySettings(form);
                setMessage('Saved');
              } catch (err) {
                setMessage(formError(err));
              }
            });
          }}
        >
          {(
            [
              ['name', 'Company name'],
              ['email', 'Email'],
              ['phone', 'Phone'],
              ['address', 'Address'],
              ['commercialRegNumber', 'Commercial Registration (CR)'],
              ['vatNumber', 'VAT registration number'],
              ['currency', 'Currency'],
              ['locale', 'Locale (en / ar)'],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="sm:col-span-2 flex items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : 'Save settings'}
            </Button>
            {message && <span className="text-sm text-zinc-400">{message}</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
