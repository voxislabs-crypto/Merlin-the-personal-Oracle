/* PWA Service Worker Registration */
'use client';

import { useEffect } from 'react';

export function PWAInstaller() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration.scope);
          
          // Check for updates every hour
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    }

    // Handle install prompt
    let deferredPrompt: any;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      console.log('[PWA] Install prompt available');
      
      // Could show custom install button here
      // For now, just log it
    });

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      deferredPrompt = null;
    });
  }, []);

  return null;
}
