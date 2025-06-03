'use client';

import React from 'react';
import Navbar from '@/app/components/student/Navbar';
import Sidebar from '@/app/components/student/sidebar';
import Footer from '../components/Footer';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-[#161d2e]">
      {/* Navbar ที่ fixed บน mobile */}
      <Navbar />

      {/* Content */}
      <div className="flex flex-1 pt-[72px] md:pt-0">
        {/* Sidebar: hidden on mobile */}
        <Sidebar />

        {/* Main content: responsive */}
        <main className="flex-1 p-4">{children}</main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
