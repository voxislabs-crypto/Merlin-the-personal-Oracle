import { ClerkProvider } from '@clerk/nextjs';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { PWAInstaller } from '@/components/PWAInstaller';
import './globals.css';

// Environment variable safety checks
if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  throw new Error('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required');
}

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error('CLERK_SECRET_KEY is required');
}

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required');
}

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <html lang="en">
        <head>
          {/* Fallback CSS in case Tailwind fails to load */}
          <style dangerouslySetInnerHTML={{
            __html: `
              body { background: linear-gradient(to bottom, #0f172a, #000000); color: white; font-family: system-ui, -apple-system, sans-serif; }
              .min-h-screen { min-height: 100vh; }
              .flex { display: flex; }
              .items-center { align-items: center; }
              .justify-center { justify-content: center; }
              .text-center { text-align: center; }
              .text-2xl { font-size: 1.5rem; line-height: 2rem; }
              .font-bold { font-weight: 700; }
              .text-amber-400 { color: #fbbf24; }
              .animate-spin { animation: spin 1s linear infinite; }
              @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `
          }} />
        </head>
        <body>
          <PWAInstaller />
          <Navigation />
          <main>{children}</main>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}
