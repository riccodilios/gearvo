import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic } from 'next/font/google';
import { ClerkWrapper } from '@/components/ClerkWrapper';
import { Providers } from './providers';
import { PwaRegister } from '@/components/PwaRegister';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const arabic = IBM_Plex_Sans_Arabic({
  variable: '--font-arabic',
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://gearvo.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Gearvo — Automotive Business Operating System',
    template: '%s · Gearvo',
  },
  description:
    'The multi-branch workshop OS for Saudi Arabia and the GCC. CRM, repairs, inventory, payments, installments, and analytics — in Arabic and English.',
  applicationName: 'Gearvo',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Gearvo',
  },
  openGraph: {
    type: 'website',
    locale: 'en_SA',
    alternateLocale: ['ar_SA'],
    url: siteUrl,
    siteName: 'Gearvo',
    title: 'Gearvo — Automotive Business Operating System',
    description:
      'Run every workshop like a modern business. Multi-branch, bilingual, SAR-ready.',
    images: [{ url: '/brand/og-image.png', width: 512, height: 512, alt: 'Gearvo' }],
  },
  twitter: {
    card: 'summary',
    title: 'Gearvo',
    description: 'Automotive Business Operating System for Saudi workshops.',
    images: ['/brand/og-image.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#d97706',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

const localeBootScript = `
(function(){
  try {
    var s = localStorage.getItem('gearvo-locale');
    var l = (s === 'ar' || s === 'en') ? s
      : ((navigator.language || '').toLowerCase().indexOf('ar') === 0 ? 'ar' : 'en');
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    if (l === 'ar') document.documentElement.classList.add('locale-ar');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const body = (
    <body
      className={`${geistSans.variable} ${geistMono.variable} ${arabic.variable} min-h-screen bg-zinc-950 text-zinc-50 antialiased`}
    >
      <Providers>
        {children}
        <PwaRegister />
      </Providers>
    </body>
  );

  const useClerk =
    !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    !!process.env.CLERK_SECRET_KEY;
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: localeBootScript }} />
      </head>
      <ClerkWrapper useClerk={useClerk}>{body}</ClerkWrapper>
    </html>
  );
}
