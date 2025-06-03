'use client';

import { useTheme } from './contexts/ThemeContext';

export default function ThemeRoot({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <html lang="th" className={theme === 'dark' ? 'dark' : ''}>
      <body className="bg-background text-foreground">{children}</body>
    </html>
  );
}
