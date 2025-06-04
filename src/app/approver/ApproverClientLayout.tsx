'use client';
import React from 'react';
import NavbarApprover from '@/app/components/approver/NavbarApprover';
import SidebarApprover from '@/app/components/approver/SidebarApprover';
// import Footer from '@/app/components/Footer';

interface ApproverClientLayoutProps {
  children: React.ReactNode;
  role: 'APPROVER_IN' | 'APPROVER_OUT';
}

export default function ApproverClientLayout({
  children,
  role,
}: ApproverClientLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0F172A] mt-10 sm:mt-0">
      <NavbarApprover role={role} />
      <div className="flex flex-col sm:flex-row">
        <SidebarApprover role={role} />
        <main className="flex-1 p-6">{children}</main>
      </div>
      {/* <Footer /> */}
    </div>
  );
}
