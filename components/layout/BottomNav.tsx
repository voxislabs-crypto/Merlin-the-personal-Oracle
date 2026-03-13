'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, MessageCircle, Zap, Settings } from 'lucide-react';

const TABS = [
  { href: '/dashboard', label: 'Chart',   icon: LayoutDashboard },
  { href: '/dashboard?chat=1', label: 'Oracle', icon: MessageCircle },
  { href: '/dashboard?tab=live', label: 'Live',   icon: Zap },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isActive = (href: string) => {
    const [base, query] = href.split('?');
    if (pathname !== base && !(pathname === '/' && base === '/dashboard')) return false;
    if (!query) {
      // Base dashboard tab: active only when no special query params
      return !searchParams.get('chat') && !searchParams.get('tab');
    }
    const params = new URLSearchParams(query);
    let allMatch = true;
    params.forEach((val, key) => {
      if (searchParams.get(key) !== val) allMatch = false;
    });
    return allMatch;
  };

  return (
    <>
      {/* Safe-area spacer so content isn't hidden behind nav */}
      <div className="h-20 flex-shrink-0" aria-hidden />

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl
                   border-t border-amber-500/20 shadow-2xl shadow-black/50
                   pb-safe-area-inset-bottom"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                className="relative flex flex-col items-center justify-center gap-0.5
                           w-full h-full min-w-0 px-2 touch-manipulation"
                aria-label={label}
                aria-current={active ? 'page' : undefined}
              >
                {active && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute inset-x-1 top-0 h-0.5 rounded-b-full bg-amber-400"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  size={22}
                  className={
                    active
                      ? 'text-amber-400'
                      : 'text-slate-500 group-hover:text-slate-300'
                  }
                  strokeWidth={active ? 2.2 : 1.8}
                />
                <span
                  className={`text-[10px] font-medium leading-none tracking-wide ${
                    active ? 'text-amber-400' : 'text-slate-500'
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
