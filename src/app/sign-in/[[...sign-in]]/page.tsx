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
          variables: {
            colorPrimary: '#f59e0b',
            colorBackground: '#18181b',
            colorText: '#fafafa',
            colorInputBackground: '#27272a',
            colorInputText: '#fafafa',
          },
          layout: { unsafe_disableDevelopmentModeWarnings: true },
          elements: {
            socialButtonsBlockButton: { color: '#fafafa' },
            socialButtonsBlockButtonText: { color: '#fafafa' },
            formFieldInput: { backgroundColor: '#27272a', color: '#fafafa' },
          },
        }}
        afterSignInUrl="/dashboard"
        signUpUrl="/sign-up"
      />
    </div>
  );
}
