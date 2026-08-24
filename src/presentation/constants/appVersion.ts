/**
 * App version injected by Vite (`define.__APP_VERSION__` from package.json).
 * Guarded read keeps every consumer crash-safe even in environments where the
 * define hasn't been applied (e.g. a dev server started before config changes).
 */
export const APP_VERSION: string =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
