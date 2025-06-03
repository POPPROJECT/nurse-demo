import './globals.css';
import { ThemeProvider } from './contexts/ThemeContext';
import ThemeRoot from './ThemeRoot';

export const metadata = {
  title: 'ระบบบันทึกประสบการณ์นิสิตพยาบาล',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <ThemeRoot>{children}</ThemeRoot>
    </ThemeProvider>
  );
}
