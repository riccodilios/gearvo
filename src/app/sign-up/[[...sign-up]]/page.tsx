import { redirect } from 'next/navigation';
import { SignUpClient } from '@/components/auth/SignUpClient';

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    redirect('/welcome/setup');
  }
  return <SignUpClient />;
}
