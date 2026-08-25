import { ClerkProvider } from './clerk-provider';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { PWAInstaller } from '@/components/PWAInstaller';
import './globals.css';
import type { Metadata, Viewport } from 'next';

const rawUrl = process.env.NEXT_PUBLIC_URL || 'https://merlin-the-personal-oracle-chi.vercel.app';
const siteUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#fcd34d'
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Merlin — Personalized Life Weather',
    template: '%s | Merlin'
  },
  description: 'Merlin reads your real birth chart and tells you how the current planetary weather is actually going to feel for you — including when storms are coming and what to do about them.',
  keywords: [
    'personalized life weather',
    'life weather forecast',
    'astrology forecast',
    'daily transit forecast',
    'storm radar astrology',
    'birth chart calculator',
    'natal chart',
    'Swiss Ephemeris',
    'astrology app',
    'personalized horoscope',
    'MBTI astrology',
    'pressure windows',
    'life forecast'
  ],
  authors: [{ name: 'Merlin Oracle' }],
  creator: 'Merlin Oracle',
  publisher: 'Merlin Oracle',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Merlin'
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg'
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Merlin Oracle',
    title: 'Merlin — Know how today feels for you',
    description: 'Merlin reads your real birth chart and tells you how the current planetary weather is actually going to feel for you — including when storms are coming and what to do about them.',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Merlin — personalized life weather',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Merlin — Personalized Life Weather',
    description: 'Merlin reads your real birth chart and tells you how the current planetary weather is actually going to feel for you — including when storms are coming and what to do about them.',
    images: ['/og-image.svg'],
    creator: '@merlinoracle',
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#fcd34d" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="Merlin" />
          <link rel="apple-touch-icon" href="/icon.svg" />
          <link rel="canonical" href={siteUrl} />
          
          {/* Structured Data for SEO */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'SoftwareApplication',
                name: 'Merlin Oracle',
                applicationCategory: 'LifestyleApplication',
                operatingSystem: 'Web, iOS, Android',
                offers: {
                  '@type': 'Offer',
                  price: '9.99',
                  priceCurrency: 'USD',
                  availability: 'https://schema.org/LimitedAvailability',
                },
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: '4.9',
                  ratingCount: '247',
                },
                description: 'Merlin reads your real birth chart and tells you how the current planetary weather is actually going to feel for you — including when storms are coming and what to do about them.',
              }),
            }}
          />
          
          {/* Analytics placeholder - add your tracking IDs */}
          {process.env.NEXT_PUBLIC_GA_ID && (
            <>
              <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} />
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                      page_path: window.location.pathname,
                    });
                  `,
                }}
              />
            </>
          )}
          
          {/* Meta Pixel placeholder */}
          {process.env.NEXT_PUBLIC_FB_PIXEL_ID && (
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${process.env.NEXT_PUBLIC_FB_PIXEL_ID}');
                  fbq('track', 'PageView');
                `,
              }}
            />
          )}
      </head>
      <body className="flex flex-col min-h-screen">
        <ClerkProvider>
          <PWAInstaller />
          <Navigation />
          <main className="flex-1">{children}</main>
          <Footer />
        </ClerkProvider>
      </body>
    </html>
  );
}