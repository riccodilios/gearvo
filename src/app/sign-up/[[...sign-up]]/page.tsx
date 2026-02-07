import { SignUp } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    redirect('/welcome/setup');
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <SignUp
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
        afterSignUpUrl="/welcome/setup"
        signInUrl="/sign-in"
      />
    </div>
  );
}