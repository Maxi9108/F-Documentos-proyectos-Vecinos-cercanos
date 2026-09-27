'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[PWA] Service Worker activo y registrado con éxito en scope:', registration.scope);
        })
        .catch((error) => {
          console.warn('[PWA] Falló el registro del Service Worker:', error);
        });
    }
  }, []);

  return null;
}
