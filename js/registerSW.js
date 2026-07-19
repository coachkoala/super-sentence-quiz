// Registers the offline service worker. Safe to call unconditionally — it
// no-ops on browsers without SW support, and a registration failure never
// blocks the game from loading.

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}
