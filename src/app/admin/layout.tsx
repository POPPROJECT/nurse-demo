'use client';

import Navbar from '../components/admin/navbarAdmin';
import SidenavAdmin from '../components/admin/sidenavAdmin';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0F172A]">
      <Navbar />
      <div className="flex">
        <SidenavAdmin />
        <main className="flex-1 p-6 bg-background text-foreground">
          {children}
        </main>
      </div>
    </div>
  );
}
