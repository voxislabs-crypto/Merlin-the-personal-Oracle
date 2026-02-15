// app/layout.tsx
import { ClerkProvider } from './clerk-provider';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { PWAInstaller } from '@/components/PWAInstaller';
import './globals.css';

export const metadata = {
  title: 'Merlin - Your Personal Oracle',
  description: 'Birth chart calculator & astrological insights',
  manifest: '/manifest.json',
  themeColor: '#fcd34d',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Merlin'
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg'
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#fcd34d" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="Merlin" />
          <link rel="apple-touch-icon" href="/icon.svg" />
        </head>
        <body className="flex flex-col min-h-screen">
          <PWAInstaller />
          <Navigation />
          <main className="flex-1">{children}</main>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}