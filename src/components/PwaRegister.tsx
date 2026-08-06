'use client';

import { useEffect } from 'react';

/**
 * Registers a minimal SW for icons/manifest.
 * Migrates away from the old cache-first shell that caused ChunkLoadError after deploys.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    // Successful paint after a chunk-reload recovery
    try {
      sessionStorage.removeItem('gearvo-chunk-reload');
    } catch {
      // ignore
    }

    void (async () => {
      try {
        if ('caches' in window) {
          const keys = await caches.keys();
          const stale = keys.filter((k) => k === 'gearvo-shell-v1' || k.startsWith('gearvo-shell-v1'));
          if (stale.length > 0) {
            await Promise.all(stale.map((k) => caches.delete(k)));
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map((r) => r.unregister()));
          }
        }
      } catch {
        // ignore
      }

      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch {
        // ignore
      }
    })();
  }, []);

  return null;
}
