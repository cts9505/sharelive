import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import { Navbar } from '../components/layout/navbar';
import { Footer } from '../components/layout/footer';
import { EarlyBirdBanner } from '../components/early-bird-banner';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sharelive.me';
const showAnnouncementBanner = process.env.NEXT_PUBLIC_SHOW_ANNOUNCEMENT_BANNER === 'true';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ShareLive — Tunnel Localhost and Route Deployed Apps',
    template: '%s | ShareLive',
  },
  description:
    'Tunnel localhost to the internet with ShareLive, then route deployed apps with branded subdomains from the dashboard when they are ready.',
  keywords: [
    'subdomain',
    'free subdomain',
    'custom subdomain',
    'subdomain hosting',
    'localhost tunnel',
    'localhost to internet',
    'tunnel cli',
    'ngrok alternative',
    'proxy routing',
    'DNS',
    'web hosting',
    'deploy',
    'sharelive',
    'instant subdomain',
    'branded URL',
  ],
  authors: [{ name: 'Chaitanya Shinde', url: 'https://sharelive.me' }],
  creator: 'Chaitanya Shinde',
  publisher: 'ShareLive',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'ShareLive',
    title: 'ShareLive — Tunnel Localhost and Route Deployed Apps',
    description:
      'Tunnel localhost to the internet with ShareLive, then route deployed apps with branded subdomains from the dashboard.',
    images: [
      {
        url: 'logo.png',
        width: 1200,
        height: 630,
        alt: 'ShareLive — Tunnel Localhost and Route Deployed Apps',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShareLive — Tunnel Localhost and Route Deployed Apps',
    description:
      'Tunnel localhost to the internet with ShareLive, then route deployed apps with branded subdomains from the dashboard.',
    images: ['/logo.png'],
    creator: '@shaaborern', // replace with your Twitter handle if available
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: siteUrl,
  },
  category: 'technology',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-background text-foreground min-h-screen">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            {showAnnouncementBanner ? <EarlyBirdBanner /> : null}
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
