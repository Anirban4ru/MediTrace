import './globals.css';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://meditrace.dev'),
  title: {
    default: 'MediTrace | Pharmaceutical Integrity Ledger',
    template: '%s | MediTrace',
  },
  description: "Immutable supply chain tracking for pharmaceutical integrity. Securing India's Health with Arbitrum L2 smart contracts, real-time IoT telemetry, and OpenCV computer vision.",
  keywords: ['Pharmaceutical Supply Chain', 'Blockchain', 'Arbitrum L2', 'IoT Telemetry', 'Medicine Tracker', 'Drug Authentication', 'India Healthcare', 'OpenCV'],
  authors: [{ name: 'MediTrace Team', url: 'https://meditrace.dev' }],
  creator: 'MediTrace',
  publisher: 'MediTrace',
  category: 'Healthcare Technology',
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://meditrace.dev',
    title: 'MediTrace | Pharmaceutical Integrity Ledger',
    description: "Immutable supply chain tracking for pharmaceutical integrity. Securing India's Health with Web3 and IoT.",
    siteName: 'MediTrace',
    images: [{ url: '/Background.jpg', width: 1200, height: 630, alt: 'MediTrace Enterprise Dashboard' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MediTrace | Pharmaceutical Integrity Ledger',
    description: "Securing India's Health with immutable blockchain tracking and zero-trust IoT telemetry.",
    images: ['/Background.jpg'],
    creator: '@MediTrace',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  icons: { icon: '/favicon.ico', shortcut: '/favicon.ico', apple: '/favicon.ico' },
  appleWebApp: { title: 'MediTrace', statusBarStyle: 'black-translucent', capable: true },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFE3' },
    { media: '(prefers-color-scheme: dark)', color: '#2A2A2A' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Inline script to set data-theme before first paint (no FOUC)
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('meditrace-theme');
    var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} ${jetbrains.variable} min-h-screen antialiased`}
            style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
        {children}
        <Toaster
          toastOptions={{
            style: {
              background: 'var(--bg-surface)',
              color: 'var(--ink)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-inter)',
            },
          }}
          position="top-center"
        />
      </body>
    </html>
  );
}
