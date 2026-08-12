import { useEffect, useState } from 'react';

const ACCENT_KEY = 'wtimer.accent';
const DEFAULT_ACCENT = '#fb8c00';

// Exposes the app-wide accent color. Writes it onto <html> as the `--accent`
// custom property so any CSS rule — nav active state, PB highlights, logo,
// charts — can inherit it, and persists across reloads.
export function useAccent() {
  const [accent, setAccent] = useState(() => {
    try {
      return localStorage.getItem(ACCENT_KEY) || DEFAULT_ACCENT;
    } catch {
      return DEFAULT_ACCENT;
    }
  });

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent);
    try {
      localStorage.setItem(ACCENT_KEY, accent);
    } catch {
      /* storage unavailable — accent still applies for this session */
    }
  }, [accent]);

  return [accent, setAccent];
}