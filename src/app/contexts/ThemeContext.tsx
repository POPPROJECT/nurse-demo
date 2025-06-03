'use client'; // สำหรับ Next.js App Router, ระบุว่านี่คือ Client Component

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

// กำหนดประเภทของ Context Value
interface ThemeContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

// สร้าง Context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider Component
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // สถานะเริ่มต้นของธีม
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');

  // Effect สำหรับโหลดธีมจาก localStorage และตั้งค่าเริ่มต้น
  useEffect(() => {
    // ตรวจสอบว่าอยู่ใน environment ของ browser ก่อนเข้าถึง localStorage
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
      // ตรวจสอบ prefers-color-scheme ของระบบปฏิบัติการ
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;

      if (savedTheme) {
        setThemeState(savedTheme);
      } else if (prefersDark) {
        setThemeState('dark');
      } else {
        setThemeState('light');
      }
    }
  }, []);

  // Effect สำหรับอัปเดต localStorage และคลาส 'dark' บน HTML element เมื่อธีมเปลี่ยน
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement; // ได้องค์ประกอบ <html>
      localStorage.setItem('theme', theme);

      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  // ฟังก์ชันสำหรับตั้งค่าธีม
  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  };

  // ฟังก์ชันสำหรับสลับธีม
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom Hook สำหรับใช้งาน Theme Context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
