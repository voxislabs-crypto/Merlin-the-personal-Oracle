import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Merlin - Your Personal Astrology Guide',
  description: 'Explore the cosmos and discover your astrological blueprint',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex flex-col`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <main className="flex-1">
            {children}
          </main>
          <footer className="py-4 text-center text-gray-400 border-t border-gray-800">
            <p>Only {50 - 3} spots left. When they're gone — no more.</p>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
