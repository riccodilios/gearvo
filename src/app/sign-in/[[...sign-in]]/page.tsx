import { redirect } from 'next/navigation';
import { SignInClient } from '@/components/auth/SignInClient';

export default function SignInPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    redirect('/dashboard');
  }
  return <SignInClient />;
}
