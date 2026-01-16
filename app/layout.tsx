// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

export const metadata = {
  title: 'Merlin - Your Personal Oracle',
  description: 'Birth chart calculator & astrological insights',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="flex flex-col min-h-screen">
          <Navigation />
          <main className="flex-1">{children}</main>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}