'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectToMainDashboard() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-400 mx-auto mb-4"></div>
        <p className="text-xl text-amber-400">Redirecting to unified dashboard...</p>
      </div>
    </div>
  );
}
