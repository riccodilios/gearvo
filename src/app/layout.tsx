import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Gearvo - Mechanic Shop Operating System',
  description: 'Production-ready SaaS for mechanic shops. Manage inventory, customers, repair orders, and payments.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const body = (
    <body
      className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-950 text-zinc-50 antialiased`}
    >
      <Providers>{children}</Providers>
    </body>
  );

  const hasClerk =
    !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    !!process.env.CLERK_SECRET_KEY;
  return (
    <html lang="en" className="dark">
      {hasClerk ? (
        <ClerkProvider
          appearance={{
            variables: { colorPrimary: '#f59e0b', colorBackground: '#18181b', colorText: '#fafafa' },
          }}
        >
          {body}
        </ClerkProvider>
      ) : (
        body
      )}
    </html>
  );
}
