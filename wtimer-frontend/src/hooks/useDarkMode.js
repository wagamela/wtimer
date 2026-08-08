import { useState, useEffect, useCallback } from 'react';

// Mirrors the original: toggling adds/removes a `.dark` class on <body>,
// which drives all the CSS custom properties in style.css.
export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('dark', isDark);
  }, [isDark]);

  const toggle = useCallback(() => setIsDark((d) => !d), []);

  return [isDark, toggle];
}
