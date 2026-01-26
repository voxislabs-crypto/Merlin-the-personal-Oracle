'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 bg-gray-900/50 backdrop-blur-md border-t border-amber-500/20 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent">
                Merlin
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              The astrology that doesn&apos;t lie. Your chart, your type, your whisper.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-amber-300 font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/dashboard"
                  className="text-gray-400 hover:text-amber-300 text-sm transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/enhanced-dashboard"
                  className="text-gray-400 hover:text-amber-300 text-sm transition-colors"
                >
                  Birth Chart
                </Link>
              </li>
              <li>
                <Link
                  href="/astro-calculator"
                  className="text-gray-400 hover:text-amber-300 text-sm transition-colors"
                >
                  Calculator
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-amber-300 font-semibold mb-4">Account</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/profile"
                  className="text-gray-400 hover:text-amber-300 text-sm transition-colors"
                >
                  Profile
                </Link>
              </li>
              <li>
                <Link
                  href="/sign-in"
                  className="text-gray-400 hover:text-amber-300 text-sm transition-colors"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/sign-up"
                  className="text-gray-400 hover:text-amber-300 text-sm transition-colors"
                >
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-amber-300 font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-amber-300 text-sm transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-400 hover:text-amber-300 text-sm transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <a
                  href="mailto:kai@boxeslabs.com"
                  className="text-gray-400 hover:text-amber-300 text-sm transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-amber-500/20">
          <p className="text-center text-gray-400 text-sm">
            © {currentYear} Merlin by Voxi Labs. All sales final. Contact: <a href="mailto:kai@boxeslabs.com" className="text-amber-400 hover:text-amber-300">kai@boxeslabs.com</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
