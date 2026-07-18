import './globals.css';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';

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
  authors: [{ name: 'PharmaTrace Team' }],
  creator: 'PharmaTrace',
  publisher: 'PharmaTrace',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://pharmatrace.dev',
    title: 'PharmaTrace | Pharmaceutical Integrity Ledger',
    description: 'Immutable supply chain tracking for pharmaceutical integrity. Securing India\'s Health.',
    siteName: 'PharmaTrace',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PharmaTrace Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PharmaTrace | Pharmaceutical Integrity Ledger',
    description: 'Securing India\'s Health with immutable blockchain tracking.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
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
  },
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
        </ThemeProvider>
      </body>
    </html>
  );
}
