/**
 * Environment detection utility
 * Detects whether the app is running as a static GitHub Pages showcase
 * vs. a locally installed or self-hosted server (Termux, Linux, Raspberry Pi, LAN, localhost).
 */

export const isGitHubPages = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hostname.endsWith('github.io') ||
    window.location.hostname.includes('github.io') ||
    window.location.search.includes('demo=true')
  );
};
