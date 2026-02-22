'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/profile', label: 'Profile' },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { isSignedIn } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-gray-900/95 backdrop-blur-md border-b border-amber-500/20 shadow-lg shadow-amber-500/10'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <Sparkles className="w-6 h-6 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-2xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent">
              Merlin
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  pathname === link.href
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-gray-300 hover:text-amber-300 hover:bg-amber-500/10'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side - Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {!mounted ? (
              // Placeholder during SSR to prevent hydration mismatch
              <div className="w-9 h-9" />
            ) : isSignedIn ? (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-9 h-9 ring-2 ring-amber-400/50 hover:ring-amber-400 transition-all',
                    userButtonPopoverCard: 'bg-slate-900 border border-purple-500',
                    userButtonPopoverActionButton: 'text-white hover:bg-purple-600',
                    userButtonPopoverActionButtonText: 'text-white',
                    dividerBox: 'bg-purple-500/30',
                  },
                }}
              />
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/sign-in"
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-amber-300 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all duration-200 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-4">
            {mounted && isSignedIn && (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8',
                    userButtonPopoverCard: 'bg-slate-900 border border-purple-500',
                    userButtonPopoverActionButton: 'text-white hover:bg-purple-600',
                    userButtonPopoverActionButtonText: 'text-white',
                    dividerBox: 'bg-purple-500/30',
                  },
                }}
              />
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-amber-400 hover:text-amber-300 transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-gray-900/98 backdrop-blur-md border-t border-amber-500/20"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={handleLinkClick}
                  className={cn(
                    'block px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                    pathname === link.href
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-gray-300 hover:text-amber-300 hover:bg-amber-500/10'
                  )}
                >
                  {link.label}
                </Link>
              ))}

              {!isSignedIn && mounted && (
                <div className="pt-4 space-y-2 border-t border-amber-500/20">
                  <Link
                    href="/sign-in"
                    onClick={handleLinkClick}
                    className="block px-4 py-3 text-sm font-medium text-gray-300 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={handleLinkClick}
                    className="block px-4 py-3 text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all text-center"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
