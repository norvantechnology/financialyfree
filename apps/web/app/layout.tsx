import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'FinanciallyFree — Invest with Purpose',
    template: '%s | FinanciallyFree',
  },
  description:
    'Goal-based mutual fund investing, Techno-Funda research tools, and an investing course — all in one platform. AMFI-registered distributor.',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
