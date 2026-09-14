import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import '../styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800'],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700', '800'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'FinanciallyFree  Invest with Purpose',
    template: '%s | FinanciallyFree',
  },
  description:
    'Goal-based mutual fund investing, Techno-Funda research tools, and an investing course  all in one platform. AMFI-registered distributor.',
  keywords: ['mutual funds', 'SIP', 'investing', 'goal-based investing', 'techno-funda', 'stock market India'],
  authors: [{ name: 'FinanciallyFree' }],
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'FinanciallyFree',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [{ media: '(prefers-color-scheme: dark)', color: '#0b0f1a' }],
};

import { LanguageProvider } from '../lib/i18n/language-context';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100vw', minWidth: 0, overflowX: 'hidden' }}>
        <LanguageProvider>
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100vw', minWidth: 0, overflowX: 'hidden' }}>{children}</main>
        </LanguageProvider>
      </body>
    </html>
  );
}
