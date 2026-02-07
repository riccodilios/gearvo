import { SignIn } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

export default function SignInPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    redirect('/dashboard');
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <SignIn
        appearance={{
          variables: { colorPrimary: '#f59e0b', colorBackground: '#18181b', colorText: '#fafafa' },
        }}
        afterSignInUrl="/dashboard"
        signUpUrl="/sign-up"
      />
    </div>
  );
}
