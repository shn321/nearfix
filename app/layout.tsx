import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { SOSButton } from '@/components/SOSButton';
import { PWARegister } from '@/components/PWARegister';

export const metadata: Metadata = {
  title: 'NearFix — Find Nearby Services | Honnavar to Bhatkal',
  description:
    'NearFix is a location-based service finder for the Honnavar to Bhatkal region. Find nearby mechanics, puncture shops, fuel stations, EV charging, hospitals, and police — no login required. Emergency SOS, reviews, and help requests built in.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NearFix',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#FF5C00',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased">
        <Navbar />
        <main>{children}</main>
        <SOSButton />
        <PWARegister />
      </body>
    </html>
  );
}
