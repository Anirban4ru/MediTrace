import './globals.css';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://pharmatrace.dev'),
  title: {
    default: 'PharmaTrace | Pharmaceutical Integrity Ledger',
    template: '%s | PharmaTrace',
  },
  description: 'Immutable supply chain tracking for pharmaceutical integrity. Securing India\'s Health with Arbitrum L2 smart contracts, real-time IoT telemetry, and OpenCV computer vision.',
  keywords: ['Pharmaceutical Supply Chain', 'Blockchain', 'Arbitrum L2', 'IoT Telemetry', 'Medicine Tracker', 'Drug Authentication', 'India Healthcare', 'OpenCV'],
  authors: [{ name: 'PharmaTrace Team', url: 'https://pharmatrace.dev' }],
  creator: 'PharmaTrace',
  publisher: 'PharmaTrace',
  category: 'Healthcare Technology',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://pharmatrace.dev',
    title: 'PharmaTrace | Pharmaceutical Integrity Ledger',
    description: 'Immutable supply chain tracking for pharmaceutical integrity. Securing India\'s Health with Web3 and IoT.',
    siteName: 'PharmaTrace',
    images: [
      {
        url: '/Background.jpg',
        width: 1200,
        height: 630,
        alt: 'PharmaTrace Enterprise Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PharmaTrace | Pharmaceutical Integrity Ledger',
    description: 'Securing India\'s Health with immutable blockchain tracking and zero-trust IoT telemetry.',
    images: ['/Background.jpg'],
    creator: '@PharmaTrace',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  appleWebApp: {
    title: 'PharmaTrace',
    statusBarStyle: 'black-translucent',
    capable: true,
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-[#F4F4F6] dark:bg-black antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
