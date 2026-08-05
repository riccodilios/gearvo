import { SignUp } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { GearvoLogo } from '@/components/brand/GearvoLogo';

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    redirect('/welcome/setup');
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-950 px-4">
      <Link href="/" className="flex flex-col items-center gap-3">
        <GearvoLogo variant="logo" theme="dark" priority className="h-10 w-auto" />
        <p className="text-sm text-zinc-500">Automotive Business Operating System</p>
      </Link>
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
