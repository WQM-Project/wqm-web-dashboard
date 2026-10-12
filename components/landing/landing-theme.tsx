'use client';

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

const LandingTheme = createContext({ theme: 'light' as 'light' | 'dark', toggle: () => {} });

export function LandingThemeProvider({ children, initialTheme }: { children: ReactNode; initialTheme: 'light' | 'dark' }) {
  const [theme, setTheme] = useState(initialTheme);

  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    try { localStorage.setItem('wqm-theme', next); } catch { /* The cookie still saves the choice. */ }
    document.cookie = `wqm-theme=${next};Path=/;Max-Age=31536000;SameSite=Lax${location.protocol === 'https:' ? ';Secure' : ''}`;
  }

  return (
    <LandingTheme.Provider value={{ theme, toggle }}>
      <div className="wqm-landing" data-theme={theme}>{children}</div>
    </LandingTheme.Provider>
  );
}

export const useLandingTheme = () => useContext(LandingTheme);
