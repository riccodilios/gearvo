import { isDatabaseConnected } from '@/app/actions/tenant';
import { SetupPageClient } from './SetupPageClient';

export const dynamic = 'force-dynamic';

export default async function SetupPage() {
  const dbConnected = await isDatabaseConnected();
  return <SetupPageClient dbConnected={dbConnected} />;
}
