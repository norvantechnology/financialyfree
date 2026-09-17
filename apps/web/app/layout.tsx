import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono, Fraunces } from 'next/font/google';
import '../styles/globals.css';
import { LanguageProvider } from '../lib/i18n/language-context';

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

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'GoalCompass: Invest with Purpose',
    template: '%s | GoalCompass',
  },
  description:
    'Goal-based investing, Techno-Funda research tools, and an investing academy. Build wealth with purpose.',
  keywords: [
    'mutual funds',
    'SIP',
    'goal-based investing',
    'techno-funda',
    
    'FIRE India',
  ],
  authors: [{ name: 'GoalCompass' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'GoalCompass',
  },
  robots: { index: true, follow: true },
  alternates: {
    languages: {
      'en-IN': '/',
    },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [{ media: '(prefers-color-scheme: dark)', color: '#0a0f1d' }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-IN"
      className={`${plusJakartaSans.variable} ${inter.variable} ${jetbrainsMono.variable} ${fraunces.variable}`}
    >
      <body
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: '100vw',
          minWidth: 0,
          overflowX: 'hidden',
        }}
      >
        <LanguageProvider>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              maxWidth: '100vw',
              minWidth: 0,
              overflowX: 'hidden',
            }}
          >
            {children}
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
